# product/serializers.py
from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

    def validate_sku(self, value):
        v = value.strip()
        qs = Product.objects.filter(sku__iexact=v)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("SKU must be unique.")
        return v

    def create(self, validated_data):
        validated_data['sku'] = validated_data['sku'].strip().upper()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'sku' in validated_data and validated_data['sku'] is not None:
            validated_data['sku'] = validated_data['sku'].strip().upper()
        return super().update(instance, validated_data)
