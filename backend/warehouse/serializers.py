from rest_framework import serializers
from warehouse.models import Warehouse, StockLevel


class WarehouseSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Warehouse
        fields = ("id", "name", "location", "is_active", "created_by", "created_at", "updated_at")
        read_only_fields = ("id", "created_by", "created_at", "updated_at")


class StockLevelSerializer(serializers.ModelSerializer):
    # Product info за UI (read-only) – за да не правиш втори request
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_unit = serializers.CharField(source="product.unit", read_only=True)
    price_sell = serializers.DecimalField(source="product.price_sell", max_digits=12, decimal_places=2, read_only=True)
    price_buy = serializers.DecimalField(source="product.price_buy", max_digits=12, decimal_places=2, read_only=True)

    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = StockLevel
        fields = (
            "id",
            "product",
            "product_sku",
            "product_name",
            "product_unit",
            "price_sell",
            "price_buy",
            "warehouse",
            "warehouse_name",
            "quantity",
            "min_stock_level",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "updated_at",
            "product_sku",
            "product_name",
            "product_unit",
            "price_sell",
            "price_buy",
            "warehouse_name",
        )

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        return value

    def validate_min_stock_level(self, value):
        if value < 0:
            raise serializers.ValidationError("Min stock level cannot be negative.")
        return value
