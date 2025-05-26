# core/urls.py
from django.urls import path
from . import views
from .views import (
    TrainModelsView, 
    PredictView, 
    HistoricalDataView, 
    DataUploadView
)

urlpatterns = [
    # TODO: Remove this. See core/views.py to read the reason behind this.
    path('home/', views.home, name='home'),
    path('', views.home, name='home'),    
    
    path('api/upload/', DataUploadView.as_view(), name='data-upload'),
    path('api/train/', TrainModelsView.as_view(), name='train-models'),
    path('api/predict/', PredictView.as_view(), name='predict'),
    path('api/historical/', HistoricalDataView.as_view(), name='historical-data'),
]

