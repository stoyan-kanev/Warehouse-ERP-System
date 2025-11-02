from django.shortcuts import render, get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from warehouse.models import StockLevel
from warehouse.serializers import StockLevelSerializer


# Create your views here.


class StockLevelView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        stock = StockLevel.objects.all()
        serializer = StockLevelSerializer(stock, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        serializer = StockLevelSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockLevelDetailView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, pk, *args, **kwargs):
        stock = get_object_or_404(StockLevel, id=pk)
        serializer = StockLevelSerializer(stock)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk, *args, **kwargs):
        stock = get_object_or_404(StockLevel, id=pk)
        serializer = StockLevelSerializer(stock, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, *args, **kwargs):
        stock = get_object_or_404(StockLevel, id=pk)
        stock.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
