from rest_framework import permissions, mixins, viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from product.pagination import DefaultPagination
from shipment.models import Shipment, ShipmentStatus
from shipment.serializers import (
    ShipmentWriteSerializer,
    ShipmentReadSerializer,
    ShipmentStatusActionSerializer,
)
from shipment.services import dispatch_shipment, receive_shipment, cancel_shipment


class ShipmentViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = DefaultPagination

    def get_queryset(self):
        return (
            Shipment.objects
            .select_related("from_warehouse", "to_warehouse", "created_by")
            .prefetch_related("items__product")
            .order_by("-id")
        )

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return ShipmentReadSerializer
        if self.action in ["dispatch", "receive", "cancel"]:
            return ShipmentStatusActionSerializer
        return ShipmentWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = ShipmentWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        shipment = serializer.save(created_by=request.user)

        shipment.refresh_from_db()
        read_serializer = ShipmentReadSerializer(shipment, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        shipment = self.get_object()

        if shipment.status != ShipmentStatus.DRAFT:
            raise ValidationError({"status": "Only draft shipments can be edited."})

        serializer = ShipmentWriteSerializer(
            shipment,
            data=request.data,
            partial=kwargs.get("partial", False),
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        shipment = serializer.save()

        shipment.refresh_from_db()
        read_serializer = ShipmentReadSerializer(shipment, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def dispatch(self, request, pk=None):
        shipment = self.get_object()
        dispatch_shipment(shipment)
        shipment.refresh_from_db()
        return Response(ShipmentReadSerializer(shipment, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        shipment = self.get_object()
        receive_shipment(shipment)
        shipment.refresh_from_db()
        return Response(ShipmentReadSerializer(shipment, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        shipment = self.get_object()
        cancel_shipment(shipment)
        shipment.refresh_from_db()
        return Response(ShipmentReadSerializer(shipment, context={"request": request}).data)