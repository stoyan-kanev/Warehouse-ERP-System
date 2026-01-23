from rest_framework import serializers

from product.models import Product
from warehouse.models import Warehouse, StockLevel


class WarehouseSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Warehouse
        fields = ("id", "name", "location", "is_active", "created_by", "created_at", "updated_at")
        read_only_fields = ("id", "created_by", "created_at", "updated_at")




class StockLevelSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(write_only=True, required=False)

    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_unit = serializers.CharField(source="product.unit", read_only=True)
    price_sell = serializers.DecimalField(source="product.price_sell", max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = StockLevel
        fields = [
            "id",
            "warehouse",
            "quantity",
            "min_stock_level",
            "updated_at",

            # input
            "sku",

            # output
            "product_sku",
            "product_name",
            "product_unit",
            "price_sell",
        ]
        extra_kwargs = {
            "warehouse": {"required": False},
        }

    def validate_sku(self, value: str):
        sku = (value or "").strip()
        if not sku:
            raise serializers.ValidationError("SKU is required.")

        product = Product.objects.filter(sku__iexact=sku).first()
        if not product:
            raise serializers.ValidationError("Product with this SKU does not exist.")

        self._resolved_product = product
        return sku

    def create(self, validated_data):
        validated_data.pop("sku", None)
        product = getattr(self, "_resolved_product", None)
        if not product:
            raise serializers.ValidationError({"sku": "Invalid SKU."})

        validated_data["product"] = product
        return super().create(validated_data)

