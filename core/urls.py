# core/urls.py
from django.urls import path
from .views import (
    TrainModelsView, 
    PredictView, 
    HistoricalDataView, 
)

urlpatterns = [
    # The api/v1/ might be moved to the main urls.py file
    path('api/v1/train/', TrainModelsView.as_view(), name='train-models'),
    path('api/v1/predict/', PredictView.as_view(), name='predict'),
    path('api/v1/historical/', HistoricalDataView.as_view(), name='historical-data'),
]

