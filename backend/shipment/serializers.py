from django.db import transaction
from rest_framework import serializers

from product.models import Product
from shipment.models import Shipment, ShipmentItem, ShipmentType, Unit, ShipmentStatus
from shipment.services import reserve_shipment_stock, release_shipment_stock
from warehouse.models import Warehouse, StockLevel


class ShipmentItemWriteSerializer(serializers.Serializer):
    sku = serializers.CharField()
    qty = serializers.DecimalField(max_digits=10, decimal_places=2)
    unit = serializers.CharField()

    def validate_qty(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

    def validate_sku(self, value):
        if not Product.objects.filter(sku=value).exists():
            raise serializers.ValidationError("Invalid SKU.")
        return value

    def validate_unit(self, value):
        value = value.upper()
        valid_units = {choice[0] for choice in Unit.choices}
        if value not in valid_units:
            raise serializers.ValidationError("Invalid unit.")
        return value


class ShipmentWriteSerializer(serializers.Serializer):
    from_warehouse = serializers.IntegerField()
    destination_type = serializers.ChoiceField(choices=[("warehouse", "warehouse"), ("client", "client")])
    to_warehouse_id = serializers.IntegerField(required=False, allow_null=True)
    client_address = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    items = ShipmentItemWriteSerializer(many=True)

    def validate(self, attrs):
        destination_type = attrs.get("destination_type")
        from_warehouse = attrs.get("from_warehouse")
        to_warehouse_id = attrs.get("to_warehouse_id")
        client_address = attrs.get("client_address")
        items = attrs.get("items", [])

        if not Warehouse.objects.filter(id=from_warehouse).exists():
            raise serializers.ValidationError({
                "from_warehouse": "Invalid warehouse."
            })

        if to_warehouse_id and not Warehouse.objects.filter(id=to_warehouse_id).exists():
            raise serializers.ValidationError({
                "to_warehouse_id": "Invalid warehouse."
            })

        if destination_type == "warehouse":
            if not to_warehouse_id:
                raise serializers.ValidationError({
                    "to_warehouse_id": "This field is required when destination_type is 'warehouse'."
                })
            if to_warehouse_id == from_warehouse:
                raise serializers.ValidationError({
                    "to_warehouse_id": "Destination warehouse must be different from source."
                })
            if client_address:
                raise serializers.ValidationError({
                    "client_address": "This field is not allowed when destination_type is 'warehouse'."
                })

        if destination_type == "client":
            if not client_address:
                raise serializers.ValidationError({
                    "client_address": "This field is required when destination_type is 'client'."
                })

        if not items:
            raise serializers.ValidationError({
                "items": "At least one shipment item is required."
            })

        skus = [item["sku"] for item in items]
        if len(skus) != len(set(skus)):
            raise serializers.ValidationError({
                "items": "Duplicate SKUs are not allowed in the same shipment."
            })

        products_by_sku = Product.objects.in_bulk(skus, field_name="sku")

        # IMPORTANT:
        # when editing an existing draft shipment, add back the quantities
        # already reserved by this shipment itself
        current_reserved_by_product_id = {}
        if self.instance and isinstance(self.instance, Shipment):
            for shipment_item in self.instance.items.all():
                current_reserved_by_product_id[shipment_item.product_id] = shipment_item.quantity

        for item in items:
            product = products_by_sku[item["sku"]]

            try:
                stock = StockLevel.objects.get(
                    warehouse_id=from_warehouse,
                    product_id=product.id,
                )
            except StockLevel.DoesNotExist:
                raise serializers.ValidationError({
                    "items": [f"No stock found for SKU '{item['sku']}' in selected warehouse."]
                })

            available_quantity = stock.quantity - stock.reserved_quantity
            current_reserved = current_reserved_by_product_id.get(product.id, 0)
            effective_available = available_quantity + current_reserved

            if effective_available < item["qty"]:
                raise serializers.ValidationError({
                    "items": [
                        f"Insufficient available stock for SKU '{item['sku']}'. "
                        f"Available: {effective_available}, requested: {item['qty']}."
                    ]
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")

        destination_type = validated_data.pop("destination_type")
        to_warehouse_id = validated_data.pop("to_warehouse_id", None)
        client_address = validated_data.pop("client_address", None)

        shipment_type = (
            ShipmentType.TRANSFER
            if destination_type == "warehouse"
            else ShipmentType.OUTBOUND
        )

        shipment = Shipment(
            shipment_type=shipment_type,
            status=ShipmentStatus.DRAFT,
            from_warehouse_id=validated_data["from_warehouse"],
            to_warehouse_id=to_warehouse_id if destination_type == "warehouse" else None,
            destination_address=client_address if destination_type == "client" else None,
            notes=validated_data.get("notes", ""),
            created_by=validated_data.get("created_by"),
        )
        shipment.full_clean()
        shipment.save()

        skus = [item["sku"] for item in items_data]
        products_by_sku = Product.objects.in_bulk(skus, field_name="sku")

        shipment_items = []
        for item_data in items_data:
            product = products_by_sku[item_data["sku"]]

            item = ShipmentItem(
                shipment=shipment,
                product=product,
                quantity=item_data["qty"],
                unit=item_data["unit"],
            )
            item.full_clean()
            shipment_items.append(item)

        ShipmentItem.objects.bulk_create(shipment_items)

        reserve_shipment_stock(shipment)

        return shipment

    @transaction.atomic
    def update(self, instance, validated_data):
        if instance.status != ShipmentStatus.DRAFT:
            raise serializers.ValidationError({
                "status": "Only draft shipments can be edited."
            })

        items_data = validated_data.pop("items")

        destination_type = validated_data.pop("destination_type")
        to_warehouse_id = validated_data.pop("to_warehouse_id", None)
        client_address = validated_data.pop("client_address", None)

        release_shipment_stock(instance)

        instance.shipment_type = (
            ShipmentType.TRANSFER
            if destination_type == "warehouse"
            else ShipmentType.OUTBOUND
        )
        instance.from_warehouse_id = validated_data["from_warehouse"]
        instance.to_warehouse_id = to_warehouse_id if destination_type == "warehouse" else None
        instance.destination_address = client_address if destination_type == "client" else None
        instance.notes = validated_data.get("notes", "")
        instance.full_clean()
        instance.save()

        instance.items.all().delete()

        skus = [item["sku"] for item in items_data]
        products_by_sku = Product.objects.in_bulk(skus, field_name="sku")

        shipment_items = []
        for item_data in items_data:
            product = products_by_sku[item_data["sku"]]

            item = ShipmentItem(
                shipment=instance,
                product=product,
                quantity=item_data["qty"],
                unit=item_data["unit"],
            )
            item.full_clean()
            shipment_items.append(item)

        ShipmentItem.objects.bulk_create(shipment_items)

        reserve_shipment_stock(instance)

        return instance


class ShipmentStatusActionSerializer(serializers.Serializer):
    pass


class WarehouseMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ["id", "name", "location"]


class ProductMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "sku"]


class UserMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)


class ShipmentItemReadSerializer(serializers.ModelSerializer):
    product = ProductMiniSerializer(read_only=True)
    unit_label = serializers.CharField(source="get_unit_display", read_only=True)

    class Meta:
        model = ShipmentItem
        fields = [
            "id",
            "product",
            "quantity",
            "unit",
            "unit_label",
        ]


class ShipmentReadSerializer(serializers.ModelSerializer):
    from_warehouse = WarehouseMiniSerializer(read_only=True)
    to_warehouse = WarehouseMiniSerializer(read_only=True)
    created_by = UserMiniSerializer(read_only=True)
    items = ShipmentItemReadSerializer(many=True, read_only=True)

    shipment_type_label = serializers.CharField(source="get_shipment_type_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "id",
            "shipment_type",
            "shipment_type_label",
            "status",
            "status_label",
            "from_warehouse",
            "to_warehouse",
            "destination_address",
            "notes",
            "created_by",
            "dispatched_at",
            "received_at",
            "created_at",
            "updated_at",
            "items",
        ]