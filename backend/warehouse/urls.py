from django.urls import path

from warehouse.views import StockLevelView, StockLevelDetailView

urlpatterns = [
    path('api/v1/stocklevel',StockLevelView.as_view(), name='stocklevel'),
    path('api/v1/stocklevel/<int:pk>', StockLevelDetailView.as_view(), name='stocklevel'),

]