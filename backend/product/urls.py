from django.urls import path, include
from rest_framework.routers import DefaultRouter

from product.views import ProductListView, ManageProductView, SearchProductView

router = DefaultRouter()
router.register(r"product", SearchProductView, basename="search-product")

urlpatterns = [
    path("api/v1/products-list", ProductListView.as_view(), name="product-list"),
    path('api/v1/products/create', ManageProductView.as_view(), name='product-manage'),
    path('api/v1/products/<int:pk>', ManageProductView.as_view(), name='product-manage'),
    path("api/v1/", include(router.urls)),
]
