from django.db import models

from product.models import Product
from users.models import CustomUser


class StockLevel(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    location = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stocklevel'
        ordering = ['-updated_at']
        unique_together = (('product', 'location'),)
        indexes = [
            models.Index(fields=['product', 'location'])
        ]

    def __str__(self):
        return f"{self.product.name} @ {self.location}"



class StockMovement(models.Model):
    MOVEMENT_TYPE_CHOICES = [
        ('IN', 'In'),
        ('OUT', 'Out'),
    ]

    REASON_CHOICES = [
        ('RECEIVED_FROM_SUPPLIER', 'Received from supplier'),
        ('SOLD_TO_CLIENT', 'Sold to client'),
        ('MANUAL_ADJUSTMENT', 'Manual adjustment'),
        ('TRANSFER', 'Transfer'),
        ('CORRECTION', 'Correction'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    movement_type = models.CharField(max_length=3, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    reference = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stockmovement'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'created_at'])
        ]

    def __str__(self):
        return f"{self.product.name} ({self.movement_type}) - {self.quantity}"