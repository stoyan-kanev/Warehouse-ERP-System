from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated

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
        """
        Warehouse context:
        - ако има ?warehouse=<id>, той се използва
        - иначе очаква warehouse да е в body
        """
        warehouse_id = self.request.query_params.get("warehouse")
        if warehouse_id:
            try:
                warehouse = Warehouse.objects.get(pk=warehouse_id, is_active=True)
            except Warehouse.DoesNotExist:
                raise ValidationError({"warehouse": "Invalid or inactive warehouse."})

            serializer.save(warehouse=warehouse)
            return

        serializer.save()
