from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from product.models import Product
from warehouse.models import Warehouse, StockLevel

User = get_user_model()


class Command(BaseCommand):
    help = "Reset demo user data"

    @transaction.atomic
    def handle(self, *args, **options):
        email = "demo@warehouse-erp.com"

        user, created = User.objects.get_or_create(
            email=email
        )

        if created:
            user.set_password("demo12345")
            user.save()
        else:
            user.set_password("demo12345")
            user.save()

        self.stdout.write("Deleting old demo data...")

        StockLevel.objects.filter(warehouse__created_by=user).delete()
        Warehouse.objects.filter(created_by=user).delete()

        Product.objects.filter(sku__startswith="DEMO-").delete()

        self.stdout.write("Creating fresh demo data...")

        warehouse_1 = Warehouse.objects.create(
            name="Main Demo Warehouse",
            location="Sofia, Bulgaria",
            created_by=user,
            is_active=True,
        )

        warehouse_2 = Warehouse.objects.create(
            name="Retail Dispatch Hub",
            location="Plovdiv, Bulgaria",
            created_by=user,
            is_active=True,
        )

        products = [
            {
                "sku": "DEMO-TAPE-001",
                "name": "Industrial Tape XL",
                "description": "Heavy-duty packaging tape for warehouse operations.",
                "unit": "pcs",
                "price_sell": "8.90",
                "price_buy": "4.20",
            },
            {
                "sku": "DEMO-LABEL-001",
                "name": "Barcode Label Roll",
                "description": "Thermal labels for stock and shipment tracking.",
                "unit": "roll",
                "price_sell": "14.50",
                "price_buy": "7.80",
            },
            {
                "sku": "DEMO-GLOVES-001",
                "name": "Safety Gloves",
                "description": "Protective gloves for warehouse staff.",
                "unit": "pair",
                "price_sell": "5.40",
                "price_buy": "2.60",
            },
        ]

        created_products = []

        for item in products:
            product = Product.objects.create(**item, is_active=True)
            created_products.append(product)

        for index, product in enumerate(created_products):
            StockLevel.objects.create(
                warehouse=warehouse_1,
                product=product,
                quantity=100 + index * 30,
                reserved_quantity=10 + index * 5,
                min_stock_level=20,
            )

            StockLevel.objects.create(
                warehouse=warehouse_2,
                product=product,
                quantity=50 + index * 20,
                reserved_quantity=5,
                min_stock_level=10,
            )

        self.stdout.write(
            self.style.SUCCESS("Demo data reset successfully.")
        )