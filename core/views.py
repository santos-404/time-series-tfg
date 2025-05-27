from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import pandas as pd
import os

from .models import TimeSeriesData
from .utils.time_series_utils import TimeSeriesPredictor
from .serializers import (
    PredictionRequestSerializer, 
    # PredictionResponseSerializer,
    # TimeSeriesDataSerializer
)

class TrainModelsView(APIView):
    """
    One-time endpoint to train all models
    """
    def post(self, request):
        try:
            predictor = TimeSeriesPredictor()
            
            # Option 1: Load from CSV. This should be the default approach here.
            if hasattr(settings, 'TIME_SERIES_CSV_PATH'):
                train_df, val_df, test_df, date_time = predictor.load_data_from_csv(
                    settings.TIME_SERIES_CSV_PATH
                )
            else:
                # Option 2: Load from database
                queryset = TimeSeriesData.objects.all().order_by('datetime_utc')
                if not queryset.exists():
                    return Response({
                        'error': 'No data found. Please upload data first.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                train_df, val_df, test_df, date_time = predictor.load_data_from_queryset(queryset)
            
            # Train all models
            performance = predictor.train_all_models(train_df, val_df, test_df)
            
            # Save models to disk (optional)
            models_dir = os.path.join(settings.MEDIA_ROOT, 'models')
            os.makedirs(models_dir, exist_ok=True)
            
            for name, model in predictor.models.items():
                model.save(os.path.join(models_dir, f'{name}_model.h5'))
            
            # Save normalization parameters
            import pickle
            norm_params = {
                'train_mean': predictor.train_mean,
                'train_std': predictor.train_std,
                'column_indices': predictor.column_indices
            }
            with open(os.path.join(models_dir, 'normalization_params.pkl'), 'wb') as f:
                pickle.dump(norm_params, f)
            
            return Response({
                'message': 'Models trained successfully',
                'performance': performance,
                'models_saved': list(predictor.models.keys())
            })
            
        except Exception as e:
            return Response({
                'error': f'Training failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PredictView(APIView):
    """
    Main prediction endpoint
    """
    def __init__(self):
        super().__init__()
        self.predictor = None
        self._load_models()
    
    def _load_models(self):
        """Load trained models and normalization parameters"""
        try:
            import pickle
            import tensorflow as tf
            
            models_dir = os.path.join(settings.MEDIA_ROOT, 'models')
            
            # Load normalization parameters
            with open(os.path.join(models_dir, 'normalization_params.pkl'), 'rb') as f:
                norm_params = pickle.load(f)
            
            self.predictor = TimeSeriesPredictor()
            self.predictor.train_mean = norm_params['train_mean']
            self.predictor.train_std = norm_params['train_std']
            self.predictor.column_indices = norm_params['column_indices']
            
            # Load models
            for model_name in ['linear', 'dense', 'conv', 'lstm']:
                model_path = os.path.join(models_dir, f'{model_name}_model.h5')
                if os.path.exists(model_path):
                    self.predictor.models[model_name] = tf.keras.models.load_model(model_path)
                    
        except Exception as e:
            print(f"Warning: Could not load models: {e}")
            self.predictor = None
    
    def post(self, request):
        serializer = PredictionRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        if not self.predictor or not self.predictor.models:
            return Response({
                'error': 'Models not loaded. Please train models first.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        try:
            model_name = serializer.validated_data['model_name']
            hours_ahead = serializer.validated_data['hours_ahead']
            input_hours = serializer.validated_data['input_hours']
            
            # Get recent data
            end_time = timezone.now()
            start_time = end_time - timedelta(hours=input_hours)
            
            recent_data = TimeSeriesData.objects.filter(
                datetime_utc__range=[start_time, end_time]
            ).order_by('datetime_utc')
            
            if recent_data.count() < input_hours:
                return Response({
                    'error': f'Not enough recent data. Need {input_hours} hours, got {recent_data.count()}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Convert to numpy array
            df = pd.DataFrame.from_records(recent_data.values())
            df = df.drop(['id', 'datetime_utc'], axis=1)
            data_array = df.values
            
            # Make prediction
            result = self.predictor.predict(model_name, data_array, hours_ahead)
            
            # Generate future timestamps
            last_timestamp = recent_data.last().datetime_utc
            future_timestamps = [
                last_timestamp + timedelta(hours=i+1) 
                for i in range(hours_ahead)
            ]
            
            response_data = {
                'predictions': result['predictions'],
                'timestamps': future_timestamps,
                'model_used': result['model_used'],
                'input_data': {
                    'hours_used': input_hours,
                    'start_time': start_time,
                    'end_time': end_time
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response({
                'error': f'Prediction failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HistoricalDataView(APIView):
    """
    Get historical data for charts
    """
    def get(self, request):
        try:
            days = int(request.query_params.get('days', 7))
            columns = request.query_params.get('columns', '').split(',')
            
            # Default columns if none specified
            if not columns or columns == ['']:
                columns = [
                    'daily_spot_market_600_España',
                    'daily_spot_market_600_Portugal',
                    
                    'scheduled_demand_365',
                    'scheduled_demand_358', 
                    'scheduled_demand_372',
                    'peninsula_forecast_460',

                    'hydraulic_71',
                    'hydraulic_36',
                    'hydraulic_1',
                    'solar_14',
                    'wind_12',
                    'nuclear_39',
                    'nuclear_4',
                    'nuclear_74',
                    
                    'average_demand_price_573_Baleares',
                    'average_demand_price_573_Canarias',
                    'average_demand_price_573_Ceuta',
                    'average_demand_price_573_Melilla'
                ]
            
            end_time = timezone.now()
            start_time = end_time - timedelta(days=days)
            
            queryset = TimeSeriesData.objects.filter(
                datetime_utc__range=[start_time, end_time]
            ).order_by('datetime_utc')
            
            if not queryset.exists():
                return Response({
                    'error': 'No data found for the specified time range'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Convert to format suitable for frontend charts
            data = []
            for record in queryset:
                row = {'datetime': record.datetime_utc}
                for col in columns:
                    if hasattr(record, col):
                        row[col] = getattr(record, col)
                data.append(row)
            
            return Response({
                'data': data,
                'columns': columns,
                'count': len(data),
                'time_range': {
                    'start': start_time,
                    'end': end_time
                }
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch data: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DataUploadView(APIView):
    """
    Upload CSV data to database
    """
    def post(self, request):
        try:
            if 'file' not in request.FILES:
                return Response({
                    'error': 'No file provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            csv_file = request.FILES['file']
            df = pd.read_csv(csv_file)
            
            # Validate columns
            required_columns = [
                'datetime_utc', 'hydraulic_71', 'hydraulic_36', 'hydraulic_1',
                'solar_14', 'wind_12', 'nuclear_39', 'nuclear_4', 'nuclear_74',
                'peninsula_forecast_460', 'scheduled_demand_365', 'scheduled_demand_358',
                'scheduled_demand_372', 'daily_spot_market_600_España',
                'daily_spot_market_600_Portugal', 'average_demand_price_573_Baleares',
                'average_demand_price_573_Canarias', 'average_demand_price_573_Ceuta',
                'average_demand_price_573_Melilla'
            ]
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return Response({
                    'error': f'Missing required columns: {missing_columns}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Convert datetime
            df['datetime_utc'] = pd.to_datetime(df['datetime_utc'])
            
            # Fill missing values
            df = df.ffill()
            
            # Create records
            records = []
            for _, row in df.iterrows():
                record_data = {col: row[col] if pd.notna(row[col]) else None 
                              for col in df.columns}
                records.append(TimeSeriesData(**record_data))
            
            # Bulk create
            TimeSeriesData.objects.bulk_create(records, batch_size=1000)
            
            return Response({
                'message': f'Successfully uploaded {len(records)} records',
                'columns': list(df.columns),
                'date_range': {
                    'start': df['datetime_utc'].min(),
                    'end': df['datetime_utc'].max()
                }
            })
            
        except Exception as e:
            return Response({
                'error': f'Upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
