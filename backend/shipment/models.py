from django.conf import settings
from django.db import models
from django.utils import timezone

from product.models import Product
from warehouse.models import Warehouse


class ShipmentStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SENT = "SENT", "Sent"
    IN_TRANSIT = "IN_TRANSIT", "In transit"
    RECEIVED = "RECEIVED", "Received"
    CANCELLED = "CANCELLED", "Cancelled"


class ShipmentType(models.TextChoices):
    TRANSFER = "TRANSFER", "Warehouse transfer"
    OUTBOUND = "OUTBOUND", "Outbound to address"


class Unit(models.TextChoices):
    PCS = "PCS", "pcs"
    KG = "KG", "kg"
    L = "L", "l"


class Shipment(models.Model):
    shipment_type = models.CharField(
        max_length=20,
        choices=ShipmentType.choices,
        default=ShipmentType.TRANSFER,
        db_index=True,
    )

    status = models.CharField(
        max_length=20,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.DRAFT,
        db_index=True,
    )

    from_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="shipments_sent",
    )

    # For transfers. Required when shipment_type=TRANSFER
    to_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="shipments_received",
        null=True,
        blank=True,
    )

    # For outbound shipments (customer / external address).
    destination_address = models.CharField(
        max_length=150,
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="shipments_created",
        null=True,
        blank=True,
    )

    notes = models.TextField(blank=True, default="")

    dispatched_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["from_warehouse", "status"]),
            models.Index(fields=["to_warehouse", "status"]),
        ]

    def clean(self):
        """
        Keeps the model consistent:
        - TRANSFER requires to_warehouse and must NOT use destination_address
        - OUTBOUND requires destination_address and may NOT require to_warehouse
        """
        from django.core.exceptions import ValidationError

        if self.shipment_type == ShipmentType.TRANSFER:
            if not self.to_warehouse_id:
                raise ValidationError({"to_warehouse": "Required for TRANSFER shipments."})
            if self.destination_address:
                raise ValidationError({"destination_address": "Not allowed for TRANSFER shipments."})

        if self.shipment_type == ShipmentType.OUTBOUND:
            if not self.destination_address:
                raise ValidationError({"destination_address": "Required for OUTBOUND shipments."})

        if self.to_warehouse_id and self.to_warehouse_id == self.from_warehouse_id:
            raise ValidationError({"to_warehouse": "Destination warehouse must be different from source."})

    def mark_dispatched(self):
        if self.status in {ShipmentStatus.CANCELLED, ShipmentStatus.RECEIVED}:
            raise ValueError("Cannot dispatch a cancelled/received shipment.")
        self.status = ShipmentStatus.SENT
        self.dispatched_at = self.dispatched_at or timezone.now()

    def mark_received(self):
        if self.status in {ShipmentStatus.CANCELLED, ShipmentStatus.DRAFT}:
            raise ValueError("Cannot receive a cancelled/draft shipment.")
        self.status = ShipmentStatus.RECEIVED
        self.received_at = self.received_at or timezone.now()


class ShipmentItem(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name="items",
    )

    # Identification of product will be based on scu here
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="shipment_items",
    )

    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=10, choices=Unit.choices, default=Unit.PCS)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["shipment", "product"], name="uniq_product_per_shipment"),
        ]