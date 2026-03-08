from django.urls import path, include
from rest_framework.routers import DefaultRouter

from shipment.views import ShipmentViewSet

router = DefaultRouter()
router.register(r"shipments", ShipmentViewSet, basename="create-shipment")

urlpatterns = [
    path("api/v1/", include(router.urls)),
]
