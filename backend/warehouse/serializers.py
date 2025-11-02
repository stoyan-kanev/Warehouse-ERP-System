from rest_framework import serializers

from warehouse.models import StockLevel


class StockLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLevel
        fields = '__all__'
        read_only_fields = ('id',)
