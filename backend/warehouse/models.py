from django.db import models
from product.models import Product
from users.models import CustomUser


class Warehouse(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "warehouse"
        ordering = ["id"]

    def __str__(self):
        return self.name


class StockLevel(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse,on_delete=models.CASCADE,related_name="stock_levels",default=None)
    quantity = models.DecimalField(max_digits=10, decimal_places=2,default=0)
    min_stock_level = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "stocklevel"
        ordering = ["-updated_at"]
        unique_together = (("product", "warehouse"),)
        indexes = [
            models.Index(fields=["product", "warehouse"]),
        ]

    def __str__(self):
        return f"{self.product.name} @ {self.warehouse.name}"
