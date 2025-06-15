import unittest
from unittest.mock import patch, MagicMock, mock_open
import pandas as pd
import sys
from datetime import datetime

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
        BASE_DIR='/tmp/test_base',
    )
    django.setup()

from django.test import override_settings
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

tf_mock = MagicMock()
tf_mock.keras.models.load_model = MagicMock()
sys.modules['tensorflow'] = tf_mock

class MockTimeSeriesData:
    objects = MagicMock()

class MockPredictionHistory:
    objects = MagicMock()

class MockTimeSeriesPredictor:
    def __init__(self):
        self.models = {}
        self.train_mean = None
        self.train_std = None
        self.column_indices = None
    
    def predict(self, model_name, data_array, hours_ahead):
        return {
            'predictions': [100.5, 101.2, 102.1],
            'model_used': model_name
        }

from core.views import PredictView
from core.serializers import PredictionRequestSerializer


class TestPredictView(APITestCase):
    """Test cases for PredictView class"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.url = '/predict/'
        
        self.sample_csv_data = pd.DataFrame({
            'datetime_utc': pd.to_datetime([
                '2025-03-25 10:00:00',
                '2025-03-25 11:00:00',
                '2025-03-25 12:00:00',
                '2025-03-25 13:00:00',
                '2025-03-25 14:00:00'
            ]),
            'scheduled_demand_372': [1000, 1100, 1200, 1300, 1400],
            'daily_spot_market_600_España': [50, 55, 60, 65, 70],
            'daily_spot_market_600_Portugal': [45, 50, 55, 60, 65]
        })
        
        self.valid_request_data = {
            'model_name': 'linear',
            'hours_ahead': 3,
            'input_hours': 24,
            'prediction_date': '2025-03-25'
        }

    def tearDown(self):
        """Clean up after tests"""
        pass

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.TimeSeriesPredictor', MockTimeSeriesPredictor)
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    @patch('pickle.load')
    @override_settings(MEDIA_ROOT='/test/media', BASE_DIR='/test/base')
    def test_successful_model_loading(self, mock_pickle_load, mock_file, mock_exists):
        """Test successful loading of models and normalization parameters"""
        mock_exists.return_value = True
        mock_pickle_load.return_value = {
            'train_mean': pd.Series([100, 50]),
            'train_std': pd.Series([10, 5]),
            'column_indices': {'test': 0}
        }
        
        with patch('tensorflow.keras.models.load_model') as mock_load_model:
            mock_model = MagicMock()
            mock_load_model.return_value = mock_model
            
            view = PredictView()
            
            self.assertIsNotNone(view.predictor)
            self.assertIsNotNone(view.predictor.train_mean)
            self.assertIsNotNone(view.predictor.train_std)
            mock_load_model.assert_called()

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('os.path.exists')
    @override_settings(MEDIA_ROOT='/test/media', BASE_DIR='/test/base')
    def test_model_loading_failure(self, mock_exists):
        """Test handling of model loading failures"""
        mock_exists.return_value = False
        
        with patch('builtins.print') as mock_print:
            view = PredictView()
            
            self.assertIsNone(view.predictor)
            mock_print.assert_called()

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('pandas.read_csv')
    @patch('os.path.exists')
    @override_settings(BASE_DIR='/test/base')
    def test_sample_data_loading_success(self, mock_exists, mock_read_csv):
        """Test successful loading of sample data"""
        mock_exists.side_effect = lambda path: 'sample_data.csv' in path
        mock_read_csv.return_value = self.sample_csv_data
        
        with patch('builtins.print') as mock_print:
            view = PredictView()
            
            self.assertIsNotNone(view.sample_data)
            mock_print.assert_called_with("Sample data loaded successfully")

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('os.path.exists')
    @override_settings(BASE_DIR='/test/base')
    def test_sample_data_loading_file_not_found(self, mock_exists):
        """Test handling when sample data file is not found"""
        mock_exists.return_value = False
        
        with patch('builtins.print') as mock_print:
            view = PredictView()
            
            self.assertIsNone(view.sample_data)
            mock_print.assert_called()

    def test_is_date_in_sample_range(self):
        """Test date range validation for sample data"""
        view = PredictView()
        
        test_date = datetime(2025, 3, 25).date()
        self.assertTrue(view._is_date_in_sample_range(test_date))
        
        test_date = datetime(2025, 3, 20).date()
        self.assertFalse(view._is_date_in_sample_range(test_date))
        
        test_date = datetime(2025, 4, 1).date()
        self.assertFalse(view._is_date_in_sample_range(test_date))

    def test_get_sample_data_for_period(self):
        """Test filtering sample data for specific time period"""
        view = PredictView()
        view.sample_data = self.sample_csv_data
        
        start_time = datetime(2025, 3, 25, 11, 0, 0)
        end_time = datetime(2025, 3, 25, 13, 0, 0)
        
        result = view._get_sample_data_for_period(start_time, end_time)
        
        self.assertIsNotNone(result)
        self.assertEqual(len(result), 3)  

    def test_get_sample_data_for_period_no_data(self):
        """Test filtering sample data when no data exists for period"""
        view = PredictView()
        view.sample_data = self.sample_csv_data
        
        start_time = datetime(2025, 3, 26, 11, 0, 0)
        end_time = datetime(2025, 3, 26, 13, 0, 0)
        
        result = view._get_sample_data_for_period(start_time, end_time)
        
        self.assertIsNone(result)

    def test_get_sample_data_for_period_none_data(self):
        """Test filtering sample data when sample_data is None"""
        view = PredictView()
        view.sample_data = None
        
        start_time = datetime(2025, 3, 25, 11, 0, 0)
        end_time = datetime(2025, 3, 25, 13, 0, 0)
        
        result = view._get_sample_data_for_period(start_time, end_time)
        
        self.assertIsNone(result)

    @patch('core.views.PredictionHistory')
    def test_save_prediction_to_history_success(self, mock_prediction_history):
        """Test successful saving of prediction to history"""
        mock_instance = MagicMock()
        mock_instance.id = 123
        mock_prediction_history.objects.create.return_value = mock_instance
        
        view = PredictView()
        
        result = view._save_prediction_to_history(
            model_name='linear',
            hours_ahead=3,
            input_hours=24,
            prediction_date=datetime(2025, 3, 25).date(),
            start_time=datetime(2025, 3, 25, 10, 0, 0),
            end_time=datetime(2025, 3, 25, 14, 0, 0),
            predictions=[100.5, 101.2, 102.1],
            timestamps=[datetime(2025, 3, 25, 15, 0, 0)],
            using_sample_data=True
        )
        
        self.assertEqual(result, 123)
        mock_prediction_history.objects.create.assert_called_once()

    @patch('core.views.PredictionHistory')
    def test_save_prediction_to_history_exception(self, mock_prediction_history):
        """Test handling of exceptions when saving prediction to history"""
        mock_prediction_history.objects.create.side_effect = Exception("DB Error")
        
        view = PredictView()
        
        with patch('builtins.print') as mock_print:
            result = view._save_prediction_to_history(
                model_name='linear',
                hours_ahead=3,
                input_hours=24,
                prediction_date=datetime(2025, 3, 25).date(),
                start_time=datetime(2025, 3, 25, 10, 0, 0),
                end_time=datetime(2025, 3, 25, 14, 0, 0),
                predictions=[100.5, 101.2, 102.1],
                timestamps=[datetime(2025, 3, 25, 15, 0, 0)],
                using_sample_data=False
            )
            
            self.assertIsNone(result)
            mock_print.assert_called()

    def test_post_invalid_serializer_data(self):
        """Test POST request with invalid serializer data"""
        invalid_data = {
            'hours_ahead': -1,  
        }
        
        response = self.client.post(self.url, invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(len(response.data) > 0)

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictView._load_models')
    @patch('core.views.PredictView._load_sample_data')
    def test_post_models_not_loaded(self, mock_load_sample, mock_load_models):
        """Test POST request when models are not loaded"""
        mock_load_models.return_value = None
        mock_load_sample.return_value = None
        
        view = PredictView()
        view.predictor = None
        
        with patch('core.views.PredictView') as mock_view_class:
            mock_view_class.return_value = view
            mock_view_class.as_view.return_value = view.post
            
            response = self.client.post(self.url, self.valid_request_data)
        
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('error', response.data)
        self.assertIn('Modelos no cargados', response.data['error'])

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictView._load_models')
    @patch('core.views.PredictView._load_sample_data')
    def test_post_invalid_date_format(self, mock_load_sample, mock_load_models):
        """Test POST request with invalid date format"""
        invalid_data = self.valid_request_data.copy()
        invalid_data['prediction_date'] = 'invalid-date'
        
        mock_predictor = MockTimeSeriesPredictor()
        mock_predictor.models = {'linear': MagicMock()}
        
        view = PredictView()
        view.predictor = mock_predictor
        view.sample_data = None
        view.sample_start_date = datetime(2025, 3, 23).date()
        view.sample_end_date = datetime(2025, 3, 30).date()
        
        with patch('core.views.PredictView') as mock_view_class:
            mock_view_class.return_value = view
            mock_view_class.as_view.return_value = view.post
            
            response = self.client.post(self.url, invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Date has wrong format.', str(response.data['prediction_date']))

    def test_only_post_method_allowed(self):
        """Test that only POST method is allowed"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.put(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


if __name__ == '__main__':
    unittest.main()
