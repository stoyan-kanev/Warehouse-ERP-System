# product/serializers.py
from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Product
        fields = '__all__'

    def validate_sku(self, value: str):
        sku = (value or "").strip()
        if not sku:
            raise serializers.ValidationError("SKU is required.")

        qs = Product.objects.filter(sku__iexact=sku)

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError("SKU already exists.")

        return sku

    def create(self, validated_data):
        validated_data['sku'] = validated_data['sku'].strip().upper()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'sku' in validated_data and validated_data['sku'] is not None:
            validated_data['sku'] = validated_data['sku'].strip().upper()
        return super().update(instance, validated_data)

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url