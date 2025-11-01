from django.urls import path

from product.views import ProductListView, ManageProductView

urlpatterns = [
    path("api/v1/products-list", ProductListView.as_view(), name="product-list"),
    path('api/v1/products/create', ManageProductView.as_view(), name='product-manage'),
    path('api/v1/products/<int:pk>', ManageProductView.as_view(), name='product-manage'),
]