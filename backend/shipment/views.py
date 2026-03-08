from rest_framework import permissions, mixins, viewsets, status
from rest_framework.response import Response

from shipment.models import Shipment
from shipment.serializers import ShipmentWriteSerializer, ShipmentReadSerializer


class ShipmentViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Shipment.objects
            .select_related("from_warehouse", "to_warehouse", "created_by")
            .prefetch_related("items__product")
            .all()
        )

    def get_serializer_class(self):
        if self.action == "list":
            return ShipmentReadSerializer
        return ShipmentWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = ShipmentWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        shipment = serializer.save(created_by=request.user)

        read_serializer = ShipmentReadSerializer(shipment, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)