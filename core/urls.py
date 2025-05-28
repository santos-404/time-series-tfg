from django.urls import path
from .views import (
    TrainModelsView, 
    PredictView, 
    HistoricalDataView, 
)

urlpatterns = [
    path('train/', TrainModelsView.as_view(), name='train-models'),
    path('predict/', PredictView.as_view(), name='predict'),
    path('historical/', HistoricalDataView.as_view(), name='historical-data'),
]

