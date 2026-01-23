from django.urls import path, include
from rest_framework.routers import DefaultRouter
from warehouse.views import WarehouseViewSet, StockLevelViewSet, SearchViewSet

router = DefaultRouter()
router.register(r"warehouses", WarehouseViewSet, basename="warehouses")
router.register(r"warehouses/search", SearchViewSet, basename="search-warehouses")
router.register(r"stocklevels", StockLevelViewSet, basename="stocklevels")

urlpatterns = [
    path("api/v1/", include(router.urls)),
]
