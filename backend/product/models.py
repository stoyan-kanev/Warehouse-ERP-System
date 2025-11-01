from django.db import models
import django_filters as df
from django.db.models.functions import Lower


# Create your models here.
class Product(models.Model):
    id = models.AutoField(primary_key=True)
    sku = models.CharField(max_length=100,db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    unit = models.CharField(max_length=100)
    min_stock_level = models.IntegerField()
    price_sell = models.FloatField()
    price_buy = models.FloatField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.name
    class Meta:
        db_table = 'product'
        ordering = ['-created_at']
        verbose_name_plural = 'products'
        constraints = [
            models.UniqueConstraint(Lower('sku'), name='uniq_product_sku_ci')
        ]


class ProductFilter(df.FilterSet):
    min_price = df.NumberFilter(field_name="price_sell", lookup_expr="gte")
    max_price = df.NumberFilter(field_name="price_sell", lookup_expr="lte")

    is_active = df.BooleanFilter(field_name="is_active")

    name = df.CharFilter(field_name="name", lookup_expr="icontains")
    sku = df.CharFilter(field_name="sku", lookup_expr="icontains")

    class Meta:
        model = Product
        fields = ["name", "sku", "is_active", "min_price", "max_price"]