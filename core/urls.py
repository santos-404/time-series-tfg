from django.urls import path
from .views import (
    TrainModelsView, 
    PredictView, 
    HistoricalDataView, 
    DownloadDataView,
    MergeDataView,
    LatestDataDateView
)

urlpatterns = [
    path('train/', TrainModelsView.as_view(), name='train-models'),
    path('predict/', PredictView.as_view(), name='predict'),
    path('historical/', HistoricalDataView.as_view(), name='historical-data'),

    path('data/download/', DownloadDataView.as_view(), name='download-data'),
    path('data/merge/', MergeDataView.as_view(), name='merge-data'),
    path('data/latest-date/', LatestDataDateView.as_view(), name='latest-data'),
]

