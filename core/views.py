from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from datetime import timedelta, datetime
import pandas as pd
import requests
import os
import html
import tempfile
import shutil

from .models import TimeSeriesData
from .utils.time_series_utils import TimeSeriesPredictor
from .serializers import (
    PredictionRequestSerializer, 
    DataDownloadRequestSerializer,
    # PredictionResponseSerializer,
    # TimeSeriesDataSerializer
)

class TrainModelsView(APIView):
    """
    One-time endpoint to train all models
    """
    
    def _populate_database_from_csv(self, csv_path):
        """Load CSV data into database after training"""
        try:
            df = pd.read_csv(csv_path)
            df['datetime_utc'] = pd.to_datetime(df['datetime_utc'])
            df = df.ffill()
            
            # Create records in batches for efficiency
            batch_size = 1000
            records = []
            
            for _, row in df.iterrows():
                # Create a record dict, excluding datetime_utc which needs special handling
                record_data = row.to_dict()
                datetime_val = record_data.pop('datetime_utc')
                
                record = TimeSeriesData(
                    datetime_utc=datetime_val,
                    **record_data
                )
                records.append(record)
                
                # Bulk create when batch is full
                if len(records) >= batch_size:
                    TimeSeriesData.objects.bulk_create(records)
                    records = []
            
            # Create remaining records
            if records:
                TimeSeriesData.objects.bulk_create(records)
                
            return TimeSeriesData.objects.count()
            
        except Exception as e:
            raise Exception(f"Failed to populate database: {str(e)}")
    
    def post(self, request):
        try:
            predictor = TimeSeriesPredictor()

            force_populate = request.data.get('populate_database', False)
            db_is_empty = not TimeSeriesData.objects.exists()
            should_populate_db = db_is_empty or force_populate
            
            # Option 1: Load from CSV. This should be the default approach here.
            if hasattr(settings, 'TIME_SERIES_CSV_PATH'):
                train_df, val_df, test_df, date_time = predictor.load_data_from_csv(
                    settings.TIME_SERIES_CSV_PATH
                )
                
                # POPULATE DATABASE FROM CSV only if conditions are met
                if should_populate_db:
                    records_created = self._populate_database_from_csv(settings.TIME_SERIES_CSV_PATH)
                else:
                    # Count existing records for response
                    records_created = TimeSeriesData.objects.count()
                    
            else:
                # Option 2: Load from database
                queryset = TimeSeriesData.objects.all().order_by('datetime_utc')
                if not queryset.exists():
                    return Response({
                        'error': 'No data found. Please upload data first.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                train_df, val_df, test_df, date_time = predictor.load_data_from_queryset(queryset)
                records_created = queryset.count()
            
            # Train all models
            performance = predictor.train_models(train_df, val_df, test_df)
            
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
            
            response_data = {
                'message': 'Models trained successfully',
                'performance': performance,
                'models_saved': list(predictor.models.keys()),
                'database_records': records_created
            }
            
            # Add info about database population
            if should_populate_db and hasattr(settings, 'TIME_SERIES_CSV_PATH'):
                response_data['database_populated'] = True
                response_data['population_reason'] = 'empty_database' if db_is_empty else 'explicitly_requested'
            else:
                response_data['database_populated'] = False
            
            return Response(response_data)
            
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
            
            # Im using this date so the 28/04/25 is shown 
            end_time = timezone.make_aware(datetime(2025, 4, 30))
            start_time = end_time - timedelta(hours=input_hours)
            
            recent_data = TimeSeriesData.objects.filter(
                datetime_utc__range=[start_time, end_time]
            ).order_by('datetime_utc')
            
            if recent_data.count() < input_hours:
                return Response({
                    'error': f'Not enough recent data. Need {input_hours} hours, got {recent_data.count()}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            df = pd.DataFrame.from_records(recent_data.values())
            df = df.drop(['id', 'datetime_utc'], axis=1)
            data_array = df.values
            
            result = self.predictor.predict(model_name, data_array, hours_ahead)
            
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
            
            end_time = timezone.make_aware(datetime(2025, 4, 30))
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

class DownloadDataView(APIView):
    """
    Endpoint to download data from ESIOS API
    """
    
    def __init__(self):
        super().__init__()
        self.BASE_ENDPOINT = 'https://api.esios.ree.es/indicators'
        
        # Data configuration - same as your original script
        self.DATA_TO_DOWNLOAD = {
            "energy_generation/hydraulic": [1, 36, 71],
            "energy_generation/nuclear": [4, 39, 74],
            "energy_generation/wind": [12],
            "energy_generation/solar": [14],
            "energy_demand/peninsula_forecast": [460],
            "energy_demand/scheduled_demand": [358, 365, 372],
            "price/daily_spot_market": [600],
            "price/average_demand_price": [573]
        }
    
    def _get_headers(self, token):
        """Generate request headers with the provided token"""
        return {
            'Accept': 'application/json; application/vnd.esios-api-v2+json',
            'Content-Type': 'application/json',
            'Host': 'api.esios.ree.es',
            'Cookie': '',
            'Authorization': f'Token token={token}',
            'x-api-key': f'{token}',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    
    def _get_indicators(self, token):
        """Get all available indicators from the API"""
        try:
            headers = self._get_headers(token)
            response = requests.get(self.BASE_ENDPOINT, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return (pd
                    .json_normalize(data=data['indicators'], errors='ignore')
                    .assign(description=lambda df_: df_.apply(
                        lambda df__: html.unescape(df__['description']
                                                  .replace('<p>', '')
                                                  .replace('</p>', '')
                                                  .replace('<b>', '')
                                                  .replace('</b>', ''))
                        if isinstance(df__['description'], str) else df__['description'],
                        axis=1)
                    ))
        except requests.RequestException as e:
            raise Exception(f"Failed to fetch indicators: {str(e)}")
    
    def _get_data_by_id_month(self, indicator_id, year, month, token):
        """Get data for a specific indicator by ID for a given month"""
        start_date = datetime(year, month, 1)
        
        # If it's the current year and month, use today as the end date
        if year == datetime.today().year and month == datetime.today().month:
            end_date = datetime.today()
        else:
            # Otherwise, use the last day of the month
            if month == 12:
                end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = datetime(year, month + 1, 1) - timedelta(days=1)

        start_date_str = start_date.strftime('%Y-%m-%d')
        end_date_str = end_date.strftime('%Y-%m-%d')

        endpoint = (f"{self.BASE_ENDPOINT}/{indicator_id}?"
                   f"start_date={start_date_str}T00:00&"
                   f"end_date={end_date_str}T23:59&"
                   f"time_trunc=five_minutes")
        
        headers = self._get_headers(token)
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        return pd.json_normalize(data=data['indicator'], record_path='values', errors='ignore')
    
    def _save_data(self, data, file_path):
        """Save DataFrame to CSV file"""
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        data.to_csv(file_path, index=False)
    
    def post(self, request):
        """Download data from ESIOS API"""
        serializer = DataDownloadRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['esios_token']
        download_indicators = serializer.validated_data.get('download_indicators', True)
        years_back = serializer.validated_data.get('years_back', 5)
        
        try:
            # Create temporary directory for data
            temp_dir = tempfile.mkdtemp()
            data_dir = os.path.join(temp_dir, "data")
            os.makedirs(data_dir, exist_ok=True)
            
            results = {
                'message': 'Data download completed',
                'downloaded_files': [],
                'errors': []
            }
            
            # Download indicators if requested
            if download_indicators:
                try:
                    indicators = self._get_indicators(token)
                    indicators_path = os.path.join(data_dir, "indicators.csv")
                    self._save_data(indicators, indicators_path)
                    results['downloaded_files'].append('indicators.csv')
                except Exception as e:
                    results['errors'].append(f"Failed to download indicators: {str(e)}")
            
            # Calculate date range
            five_years_ago = datetime.today() - timedelta(days=years_back * 365)
            start_year = five_years_ago.year
            current_year = datetime.today().year
            
            # Download data for each category and indicator
            for category, indicator_ids in self.DATA_TO_DOWNLOAD.items():
                category_dir = os.path.join(data_dir, category)
                os.makedirs(category_dir, exist_ok=True)
                
                for indicator_id in indicator_ids:
                    try:
                        for year in range(start_year, current_year + 1):
                            yearly_data = []
                            
                            for month in range(1, 13):
                                # Skip future months for the current year
                                if year == current_year and month > datetime.today().month:
                                    break
                                
                                try:
                                    monthly_data = self._get_data_by_id_month(
                                        indicator_id, year, month, token
                                    )
                                    
                                    if not monthly_data.empty:
                                        yearly_data.append(monthly_data)
                                        
                                except Exception as e:
                                    results['errors'].append(
                                        f"Error downloading {indicator_id} for {year}-{month:02d}: {str(e)}"
                                    )
                            
                            # Combine monthly data for the year
                            if yearly_data:
                                combined_yearly_data = pd.concat(yearly_data, ignore_index=True)
                                file_name = f"{indicator_id}_{year}.csv"
                                file_path = os.path.join(category_dir, file_name)
                                self._save_data(combined_yearly_data, file_path)
                                results['downloaded_files'].append(f"{category}/{file_name}")
                                
                    except Exception as e:
                        results['errors'].append(
                            f"Failed to download indicator {indicator_id} in {category}: {str(e)}"
                        )
            
            # Store data directory path in session or cache for later use
            request.session['temp_data_dir'] = temp_dir
            
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Cleanup temp directory on error
            if 'temp_dir' in locals():
                shutil.rmtree(temp_dir, ignore_errors=True)
            
            return Response({
                'error': f'Download failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


