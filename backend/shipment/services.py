from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from shipment.models import Shipment, ShipmentStatus, ShipmentType
from warehouse.models import StockLevel


def _get_locked_stock(warehouse_id, product_id):
    try:
        return (
            StockLevel.objects
            .select_for_update()
            .get(warehouse_id=warehouse_id, product_id=product_id)
        )
    except StockLevel.DoesNotExist:
        raise ValidationError({
            "items": [f"No stock record for product_id={product_id} in warehouse_id={warehouse_id}."]
        })


@transaction.atomic
def reserve_shipment_stock(shipment: Shipment):
    shipment = (
        Shipment.objects
        .select_for_update()
        .prefetch_related("items__product")
        .get(pk=shipment.pk)
    )

    if shipment.status != ShipmentStatus.DRAFT:
        raise ValidationError({"status": "Only draft shipments can reserve stock."})

    for item in shipment.items.all():
        stock = _get_locked_stock(shipment.from_warehouse_id, item.product_id)

        if stock.available_quantity < item.quantity:
            raise ValidationError({
                "items": [
                    f"Insufficient available stock for SKU '{item.product.sku}'. "
                    f"Available: {stock.available_quantity}, requested: {item.quantity}."
                ]
            })

    for item in shipment.items.all():
        stock = _get_locked_stock(shipment.from_warehouse_id, item.product_id)
        stock.reserved_quantity += item.quantity
        stock.save(update_fields=["reserved_quantity", "updated_at"])


@transaction.atomic
def release_shipment_stock(shipment: Shipment):
    shipment = (
        Shipment.objects
        .select_for_update()
        .prefetch_related("items__product")
        .get(pk=shipment.pk)
    )

    for item in shipment.items.all():
        stock = _get_locked_stock(shipment.from_warehouse_id, item.product_id)

        if stock.reserved_quantity < item.quantity:
            raise ValidationError({
                "items": [
                    f"Reserved quantity inconsistency for SKU '{item.product.sku}'."
                ]
            })

    for item in shipment.items.all():
        stock = _get_locked_stock(shipment.from_warehouse_id, item.product_id)
        stock.reserved_quantity -= item.quantity
        stock.save(update_fields=["reserved_quantity", "updated_at"])


@transaction.atomic
def dispatch_shipment(shipment: Shipment):
    shipment = (
        Shipment.objects
        .select_for_update()
        .prefetch_related("items__product")
        .get(pk=shipment.pk)
    )

    if shipment.status != ShipmentStatus.DRAFT:
        raise ValidationError({"status": "Only draft shipments can be dispatched."})

    for item in shipment.items.all():
        stock = _get_locked_stock(shipment.from_warehouse_id, item.product_id)

        if stock.reserved_quantity < item.quantity:
            raise ValidationError({
                "items": [
                    f"Reserved quantity inconsistency for SKU '{item.product.sku}'."
                ]
            })

        if stock.quantity < item.quantity:
            raise ValidationError({
                "items": [
                    f"Insufficient physical stock for SKU '{item.product.sku}'. "
                    f"In stock: {stock.quantity}, requested: {item.quantity}."
                ]
            })

    for item in shipment.items.all():
        stock = _get_locked_stock(shipment.from_warehouse_id, item.product_id)
        stock.quantity -= item.quantity
        stock.reserved_quantity -= item.quantity
        stock.save(update_fields=["quantity", "reserved_quantity", "updated_at"])

    shipment.status = ShipmentStatus.SENT
    shipment.dispatched_at = shipment.dispatched_at or timezone.now()
    shipment.save(update_fields=["status", "dispatched_at", "updated_at"])


@transaction.atomic
def receive_shipment(shipment: Shipment):
    shipment = (
        Shipment.objects
        .select_for_update()
        .prefetch_related("items__product")
        .get(pk=shipment.pk)
    )

    if shipment.status not in {ShipmentStatus.SENT, ShipmentStatus.IN_TRANSIT}:
        raise ValidationError({"status": "Only sent or in-transit shipments can be received."})

    if shipment.shipment_type == ShipmentType.TRANSFER:
        if not shipment.to_warehouse_id:
            raise ValidationError({"to_warehouse": "Transfer shipment requires destination warehouse."})

        for item in shipment.items.all():
            stock, _ = StockLevel.objects.select_for_update().get_or_create(
                warehouse_id=shipment.to_warehouse_id,
                product_id=item.product_id,
                defaults={
                    "quantity": Decimal("0.00"),
                    "reserved_quantity": Decimal("0.00"),
                    "min_stock_level": Decimal("0.00"),
                }
            )
            stock.quantity += item.quantity
            stock.save(update_fields=["quantity", "updated_at"])

    shipment.status = ShipmentStatus.RECEIVED
    shipment.received_at = shipment.received_at or timezone.now()
    shipment.save(update_fields=["status", "received_at", "updated_at"])


@transaction.atomic
def cancel_shipment(shipment: Shipment):
    shipment = (
        Shipment.objects
        .select_for_update()
        .prefetch_related("items__product")
        .get(pk=shipment.pk)
    )

    if shipment.status == ShipmentStatus.CANCELLED:
        raise ValidationError({"status": "Shipment is already cancelled."})

    if shipment.status != ShipmentStatus.DRAFT:
        raise ValidationError({
            "status": "Only draft shipments can be cancelled automatically."
        })

    for item in shipment.items.all():
        stock = _get_locked_stock(shipment.from_warehouse_id, item.product_id)

        if stock.reserved_quantity < item.quantity:
            raise ValidationError({
                "items": [
                    f"Reserved quantity inconsistency for SKU '{item.product.sku}'."
                ]
            })

    for item in shipment.items.all():
        stock = _get_locked_stock(shipment.from_warehouse_id, item.product_id)
        stock.reserved_quantity -= item.quantity
        stock.save(update_fields=["reserved_quantity", "updated_at"])

    shipment.status = ShipmentStatus.CANCELLED
    shipment.save(update_fields=["status", "updated_at"])