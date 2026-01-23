from django.db import IntegrityError
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from product.models import Product
from warehouse.models import Warehouse, StockLevel
from warehouse.serializers import WarehouseSerializer, StockLevelSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Read: authenticated users
    Write: admin/staff only
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.is_staff


class WarehouseViewSet(viewsets.ModelViewSet):
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Warehouse.objects.all()
        include_inactive = self.request.query_params.get("include_inactive", "").lower() in ("1", "true", "yes")
        if not include_inactive:
            qs = qs.filter(is_active=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        # deactivate вместо hard delete
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class StockLevelViewSet(viewsets.ModelViewSet):
    serializer_class = StockLevelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = StockLevel.objects.select_related("product", "warehouse")

        warehouse_id = self.request.query_params.get("warehouse")
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)

        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)

        return qs

    def perform_create(self, serializer):
        warehouse_id = self.request.query_params.get("warehouse")

        if warehouse_id:
            try:
                warehouse = Warehouse.objects.get(pk=warehouse_id, is_active=True)
            except Warehouse.DoesNotExist:
                raise ValidationError({"warehouse": "Invalid or inactive warehouse."})

            product = serializer.validated_data.get("product")

            if product and StockLevel.objects.filter(warehouse=warehouse, product=product).exists():
                raise ValidationError({"sku": "This product is already added to this warehouse."})

            try:
                serializer.save(warehouse=warehouse)
            except IntegrityError:
                raise ValidationError({"sku": "This product is already added to this warehouse."})

            return

        warehouse = serializer.validated_data.get("warehouse")
        product = serializer.validated_data.get("product")

        if warehouse and product and StockLevel.objects.filter(warehouse=warehouse, product=product).exists():
            raise ValidationError({"sku": "This product is already added to this warehouse."})

        try:
            serializer.save()
        except IntegrityError:
            raise ValidationError({"sku": "This product is already added to this warehouse."})


class SearchViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockLevelSerializer
    permission_classes = [IsAuthenticated]
    queryset = StockLevel.objects.select_related("product", "warehouse")

    @action(detail=False, methods=["get"], url_path="lookup")
    def lookup(self, request):
        sku = (request.query_params.get("sku") or "").strip()
        warehouse_id = request.query_params.get("warehouse")

        if not sku:
            return Response({"error": "sku is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not warehouse_id:
            return Response({"error": "warehouse is required"}, status=status.HTTP_400_BAD_REQUEST)

        sl = StockLevel.objects.select_related("product", "warehouse").filter(
            warehouse_id=warehouse_id,
            product__sku__iexact=sku,
        ).first()

        if not sl:
            return Response({"error": "stock level not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(self.get_serializer(sl).data, status=status.HTTP_200_OK)
