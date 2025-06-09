from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from .views import (
    TrainModelsView, 
    PredictView, 
    HistoricalDataView, 
    DownloadDataView,
    MergeDataView,
    LatestDataDateView,
    PredictionHistoryListView,
    PredictionHistoryDetailView,
    PredictionHistoryStatsView,
)

urlpatterns = [
    path('train/', TrainModelsView.as_view(), name='train-models'),
    path('predict/', PredictView.as_view(), name='predict'),
    path('historical/', HistoricalDataView.as_view(), name='historical-data'),

    path('data/download/', DownloadDataView.as_view(), name='download-data'),
    path('data/merge/', MergeDataView.as_view(), name='merge-data'),
    path('data/latest-date/', LatestDataDateView.as_view(), name='latest-data'),

    path('predictions/history/', PredictionHistoryListView.as_view(), name='prediction-history-list'),
    path('predictions/history/<int:pk>/', PredictionHistoryDetailView.as_view(), name='prediction-history-detail'),
    path('predictions/history/stats/', PredictionHistoryStatsView.as_view(), name='prediction-history-stats'),

    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

