import unittest
from unittest.mock import patch, MagicMock, mock_open
import pandas as pd
import sys

import django
from django.conf import settings

if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY='test-secret-key-for-testing-only',
        DATABASES={
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': ':memory:',
            }
        },
        INSTALLED_APPS=[
            'django.contrib.auth',
            'django.contrib.contenttypes',
            'rest_framework',
            'core',  
        ],
        REST_FRAMEWORK={
            'DEFAULT_AUTHENTICATION_CLASSES': [],
            'DEFAULT_PERMISSION_CLASSES': [],
        },
        ROOT_URLCONF='core.urls',  
        USE_TZ=True,
        MEDIA_ROOT='/tmp/test_media',
    )
    django.setup()

from django.test import override_settings
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

# Create comprehensive TensorFlow mock
tf_mock = MagicMock()
tf_mock.keras.utils.timeseries_dataset_from_array = MagicMock()
tf_mock.keras.Sequential = MagicMock()
tf_mock.keras.layers.Dense = MagicMock()
tf_mock.keras.layers.Conv1D = MagicMock()
tf_mock.keras.layers.GlobalAveragePooling1D = MagicMock()
tf_mock.keras.layers.Reshape = MagicMock()
tf_mock.keras.layers.LSTM = MagicMock()
tf_mock.keras.callbacks.EarlyStopping = MagicMock()
tf_mock.keras.losses.MeanSquaredError = MagicMock()
tf_mock.keras.optimizers.Adam = MagicMock()
tf_mock.keras.metrics.MeanAbsoluteError = MagicMock()
tf_mock.stack = MagicMock()

sys.modules['tensorflow'] = tf_mock
sys.modules['tensorflow.keras'] = tf_mock.keras
sys.modules['tensorflow.keras.utils'] = tf_mock.keras.utils
sys.modules['tensorflow.keras.layers'] = tf_mock.keras.layers
sys.modules['tensorflow.keras.callbacks'] = tf_mock.keras.callbacks
sys.modules['tensorflow.keras.losses'] = tf_mock.keras.losses
sys.modules['tensorflow.keras.optimizers'] = tf_mock.keras.optimizers
sys.modules['tensorflow.keras.metrics'] = tf_mock.keras.metrics

class MockTimeSeriesData:
    objects = MagicMock()

# Import your modules after mocking
from core.views import TrainModelsView  


class TestTrainModelsView(APITestCase):
    """Test cases for TrainModelsView class"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.url = '/train/'  
        
        self.sample_csv_data = """datetime_utc,scheduled_demand_372,daily_spot_market_600_España,daily_spot_market_600_Portugal
2023-01-01 00:00:00,1000,50,45
2023-01-01 01:00:00,1100,55,50
2023-01-01 02:00:00,1200,60,55
2023-01-01 03:00:00,1300,65,60
2023-01-01 04:00:00,1400,70,65
2023-01-01 05:00:00,1500,75,70
2023-01-01 06:00:00,1600,80,75"""
        
        self.mock_performance = {
            'linear': {'mae': 10.5, 'mse': 150.2},
            'dense': {'mae': 8.3, 'mse': 120.1},
            'conv': {'mae': 7.8, 'mse': 110.5},
            'lstm': {'mae': 6.9, 'mse': 95.8}
        }

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.TimeSeriesPredictor')
    @override_settings(MEDIA_ROOT='/media')
    def test_train_models_from_database_success(self, mock_predictor_class):
        """Test successful model training from database"""
        # Setup mocks - no CSV path in settings
        mock_predictor = MagicMock()
        mock_predictor_class.return_value = mock_predictor
        mock_predictor.load_data_from_queryset.return_value = (
            pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame()
        )
        mock_predictor.train_models.return_value = self.mock_performance
        
        # Create mock models with save method
        mock_models = {}
        for model_name in ['linear', 'dense']:
            mock_model = MagicMock()
            mock_model.save = MagicMock()
            mock_models[model_name] = mock_model
        
        mock_predictor.models = mock_models
        mock_predictor.train_mean = pd.Series([100, 50])
        mock_predictor.train_std = pd.Series([10, 5])
        mock_predictor.column_indices = {'test': 0}
        
        # Mock database operations
        mock_queryset = MagicMock()
        mock_queryset.exists.return_value = True
        mock_queryset.count.return_value = 100
        MockTimeSeriesData.objects.all.return_value.order_by.return_value = mock_queryset
        
        with patch('os.makedirs'):
            with patch('builtins.open', mock_open()):
                with patch('pickle.dump'):
                    response = self.client.post(self.url, {})
        
        # Debug the actual response if it's not 200
        if response.status_code != status.HTTP_200_OK:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data}")
            print(f"Response content: {response.content}")
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('performance', response.data)
        self.assertEqual(response.data['database_records'], 100)
        self.assertFalse(response.data['database_populated'])

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    def test_train_models_empty_database_no_csv(self):
        """Test training with empty database and no CSV path"""
        # Mock empty database
        mock_queryset = MagicMock()
        mock_queryset.exists.return_value = False
        MockTimeSeriesData.objects.all.return_value.order_by.return_value = mock_queryset
        
        response = self.client.post(self.url, {})
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'No se han encontrado los datos.')


    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.TimeSeriesPredictor')
    @override_settings(TIME_SERIES_CSV_PATH='/path/to/test.csv')
    def test_train_models_predictor_exception(self, mock_predictor_class):
        """Test handling of predictor exceptions"""
        # Setup mock to raise exception
        mock_predictor = MagicMock()
        mock_predictor_class.return_value = mock_predictor
        mock_predictor.load_data_from_csv.side_effect = Exception("CSV loading failed")
        
        response = self.client.post(self.url, {})
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('El entrenamiento ha fallado', response.data['error'])

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.TimeSeriesPredictor')
    @patch('pandas.read_csv')
    @override_settings(TIME_SERIES_CSV_PATH='/path/to/test.csv')
    def test_populate_database_csv_exception(self, mock_read_csv, mock_predictor_class):
        """Test handling of CSV population exceptions"""
        # Setup mock to raise exception during CSV reading for population
        mock_read_csv.side_effect = [
            # First call for predictor (success)
            pd.DataFrame({
                'datetime_utc': ['2023-01-01 00:00:00'],
                'scheduled_demand_372': [1000]
            }),
            # Second call for population (failure)
            Exception("CSV read failed for population")
        ]
        
        mock_predictor = MagicMock()
        mock_predictor_class.return_value = mock_predictor
        mock_predictor.load_data_from_csv.return_value = (
            pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame()
        )
        
        MockTimeSeriesData.objects.exists.return_value = False
        
        response = self.client.post(self.url, {})
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

    def test_populate_database_from_csv_method(self):
        """Test the _populate_database_from_csv method directly"""
        view = TrainModelsView()
        
        # Create mock DataFrame
        mock_df = pd.DataFrame({
            'datetime_utc': ['2023-01-01 00:00:00', '2023-01-01 01:00:00'],
            'scheduled_demand_372': [1000, 1100],
            'daily_spot_market_600_España': [50, 55],
            'daily_spot_market_600_Portugal': [45, 50]
        })
        
        with patch('pandas.read_csv', return_value=mock_df):
            with patch('pandas.to_datetime') as mock_to_datetime:
                mock_to_datetime.return_value = mock_df['datetime_utc']
                
                with patch('core.views.TimeSeriesData') as mock_model:
                    mock_model.objects.bulk_create = MagicMock()
                    mock_model.objects.count.return_value = 2
                    
                    result = view._populate_database_from_csv('/path/to/test.csv')
                    
                    # Assertions
                    self.assertEqual(result, 2)
                    mock_model.objects.bulk_create.assert_called()

    def test_populate_database_batch_processing(self):
        """Test batch processing in _populate_database_from_csv"""
        view = TrainModelsView()
        
        # Create large DataFrame to test batching (batch_size = 1000)
        large_data = {
            'datetime_utc': [f'2023-01-01 {i:02d}:00:00' for i in range(1500)],
            'scheduled_demand_372': [1000 + i for i in range(1500)],
            'daily_spot_market_600_España': [50 + i for i in range(1500)],
            'daily_spot_market_600_Portugal': [45 + i for i in range(1500)]
        }
        mock_df = pd.DataFrame(large_data)
        
        with patch('pandas.read_csv', return_value=mock_df):
            with patch('pandas.to_datetime') as mock_to_datetime:
                mock_to_datetime.return_value = mock_df['datetime_utc']
                
                with patch('core.views.TimeSeriesData') as mock_model:
                    mock_model.objects.bulk_create = MagicMock()
                    mock_model.objects.count.return_value = 1500
                    
                    result = view._populate_database_from_csv('/path/to/test.csv')
                    
                    # Should be called twice (1000 + 500 records)
                    self.assertEqual(mock_model.objects.bulk_create.call_count, 2)
                    self.assertEqual(result, 1500)

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.TimeSeriesPredictor')
    @patch('os.makedirs')
    @patch('builtins.open', new_callable=mock_open)
    @patch('pickle.dump')
    @override_settings(MEDIA_ROOT='/test/media')
    def test_model_saving_file_operations(self, mock_pickle_dump, mock_file, 
                                        mock_makedirs, mock_predictor_class):
        """Test file operations for saving models and normalization parameters"""
        mock_predictor = MagicMock()
        mock_predictor_class.return_value = mock_predictor
        mock_predictor.load_data_from_queryset.return_value = (
            pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame()
        )
        mock_predictor.train_models.return_value = self.mock_performance
        
        # Mock models with save method
        mock_model1 = MagicMock()
        mock_model1.save = MagicMock()
        mock_model2 = MagicMock()
        mock_model2.save = MagicMock()
        
        mock_predictor.models = {
            'linear': mock_model1,
            'dense': mock_model2
        }
        mock_predictor.train_mean = pd.Series([100])
        mock_predictor.train_std = pd.Series([10])
        mock_predictor.column_indices = {'test': 0}
        
        # Mock database operations
        mock_queryset = MagicMock()
        mock_queryset.exists.return_value = True
        mock_queryset.count.return_value = 10
        MockTimeSeriesData.objects.all.return_value.order_by.return_value = mock_queryset
        
        response = self.client.post(self.url, {})
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_makedirs.assert_called_with('/test/media/models', exist_ok=True)
        mock_model1.save.assert_called_with('/test/media/models/linear_model.h5')
        mock_model2.save.assert_called_with('/test/media/models/dense_model.h5')
        mock_pickle_dump.assert_called_once()

    def test_only_post_method_allowed(self):
        """Test that only POST method is allowed"""
        # Test GET method
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Test PUT method
        response = self.client.put(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Test DELETE method
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


if __name__ == '__main__':
    unittest.main()
