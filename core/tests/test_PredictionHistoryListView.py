import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, date 

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
        TIME_ZONE='UTC',
    )
    django.setup()

from rest_framework.test import APITestCase, APIClient
from rest_framework import status


class MockPredictionHistory:
    objects = MagicMock()


class MockPredictionHistoryFilterSerializer:
    def __init__(self, data=None):
        self.data = data
        self.validated_data = {}
        self._errors = {}
    
    def is_valid(self):
        return True
    
    @property
    def errors(self):
        return self._errors


class MockPredictionHistoryListSerializer:
    def __init__(self, queryset, many=False):
        self.queryset = queryset
        self.many = many
        self.data = self._get_mock_data()
    
    def _get_mock_data(self):
        if self.many:
            return [
                {
                    'id': 1,
                    'model_used': 'linear',
                    'prediction_date': '2023-01-01',
                    'hours_ahead': 24,
                    'predicted_value': '1250.50',
                    'created_at': '2023-01-01T10:00:00Z'
                },
                {
                    'id': 2,
                    'model_used': 'dense',
                    'prediction_date': '2023-01-02',
                    'hours_ahead': 48,
                    'predicted_value': '1100.75',
                    'created_at': '2023-01-01T11:00:00Z'
                }
            ]
        return {
            'id': 1,
            'model_used': 'linear',
            'prediction_date': '2023-01-01',
            'hours_ahead': 24,
            'predicted_value': '1250.50',
            'created_at': '2023-01-01T10:00:00Z'
        }


class TestPredictionHistoryListView(APITestCase):
    """Test cases for PredictionHistoryListView class"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.url = '/predictions/history/'
        
        self.mock_queryset = MagicMock()
        self.mock_queryset.count.return_value = 10
        self.mock_queryset.__getitem__.return_value = self.mock_queryset  
        
        self.mock_queryset.filter.return_value = self.mock_queryset
        self.mock_queryset.all.return_value = self.mock_queryset

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer', MockPredictionHistoryFilterSerializer)
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    def test_get_prediction_history_no_filters(self):
        """Test GET request without any filters"""
        MockPredictionHistory.objects.all.return_value = self.mock_queryset
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertIn('filters_applied', response.data)
        self.assertIn('returned_count', response.data)
        self.assertEqual(response.data['count'], 10)
        self.assertEqual(len(response.data['results']), 2)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    def test_get_prediction_history_with_model_filter(self, mock_filter_serializer):
        """Test GET request with model_used filter"""
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {'model_used': 'linear', 'limit': 100}
        mock_filter_serializer.return_value = mock_serializer_instance
        
        MockPredictionHistory.objects.all.return_value = self.mock_queryset
        
        response = self.client.get(self.url, {'model_used': 'linear'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.mock_queryset.filter.assert_called_with(model_used='linear')
        self.assertEqual(response.data['filters_applied']['model_used'], 'linear')

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    @patch('core.views.timezone')
    def test_get_prediction_history_with_date_from_filter(self, mock_timezone, mock_filter_serializer):
        """Test GET request with date_from filter"""
        test_date = date(2023, 1, 1)
        test_datetime = datetime.combine(test_date, datetime.min.time())
        
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {'date_from': test_date, 'limit': 100}
        mock_filter_serializer.return_value = mock_serializer_instance
        
        mock_timezone.make_aware.return_value = test_datetime
        MockPredictionHistory.objects.all.return_value = self.mock_queryset
        
        response = self.client.get(self.url, {'date_from': '2023-01-01'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_timezone.make_aware.assert_called()
        self.mock_queryset.filter.assert_called_with(created_at__gte=test_datetime)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    @patch('core.views.timezone')
    def test_get_prediction_history_with_date_to_filter(self, mock_timezone, mock_filter_serializer):
        """Test GET request with date_to filter"""
        test_date = date(2023, 1, 31)
        test_datetime = datetime.combine(test_date, datetime.max.time())
        
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {'date_to': test_date, 'limit': 100}
        mock_filter_serializer.return_value = mock_serializer_instance
        
        mock_timezone.make_aware.return_value = test_datetime
        MockPredictionHistory.objects.all.return_value = self.mock_queryset
        
        response = self.client.get(self.url, {'date_to': '2023-01-31'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_timezone.make_aware.assert_called()
        self.mock_queryset.filter.assert_called_with(created_at__lte=test_datetime)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    def test_get_prediction_history_with_prediction_date_filter(self, mock_filter_serializer):
        """Test GET request with prediction_date filter"""
        test_date = date(2023, 1, 15)
        
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {'prediction_date': test_date, 'limit': 100}
        mock_filter_serializer.return_value = mock_serializer_instance
        
        MockPredictionHistory.objects.all.return_value = self.mock_queryset
        
        response = self.client.get(self.url, {'prediction_date': '2023-01-15'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.mock_queryset.filter.assert_called_with(prediction_date=test_date)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    def test_get_prediction_history_with_hours_ahead_filter(self, mock_filter_serializer):
        """Test GET request with hours_ahead filter"""
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {'hours_ahead': 24, 'limit': 100}
        mock_filter_serializer.return_value = mock_serializer_instance
        
        MockPredictionHistory.objects.all.return_value = self.mock_queryset
        
        response = self.client.get(self.url, {'hours_ahead': '24'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.mock_queryset.filter.assert_called_with(hours_ahead=24)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    def test_get_prediction_history_with_custom_limit(self, mock_filter_serializer):
        """Test GET request with custom limit"""
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {'limit': 50}
        mock_filter_serializer.return_value = mock_serializer_instance
        
        MockPredictionHistory.objects.all.return_value = self.mock_queryset
        
        response = self.client.get(self.url, {'limit': '50'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.mock_queryset.__getitem__.assert_called_with(slice(None, 50, None))

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    @patch('core.views.timezone')
    def test_get_prediction_history_with_multiple_filters(self, mock_timezone, mock_filter_serializer):
        """Test GET request with multiple filters applied"""
        test_date_from = date(2023, 1, 1)
        test_date_to = date(2023, 1, 31)
        
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {
            'model_used': 'dense',
            'date_from': test_date_from,
            'date_to': test_date_to,
            'hours_ahead': 48,
            'limit': 25
        }
        mock_filter_serializer.return_value = mock_serializer_instance
        
        mock_timezone.make_aware.side_effect = [
            datetime.combine(test_date_from, datetime.min.time()),
            datetime.combine(test_date_to, datetime.max.time())
        ]
        
        MockPredictionHistory.objects.all.return_value = self.mock_queryset
        
        response = self.client.get(self.url, {
            'model_used': 'dense',
            'date_from': '2023-01-01',
            'date_to': '2023-01-31',
            'hours_ahead': '48',
            'limit': '25'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.mock_queryset.filter.call_count >= 3)
        self.mock_queryset.__getitem__.assert_called_with(slice(None, 25, None))

    @patch('core.views.PredictionHistoryFilterSerializer')
    def test_get_prediction_history_invalid_filters(self, mock_filter_serializer):
        """Test GET request with invalid filter parameters"""
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = False
        mock_serializer_instance.errors = {'date_from': ['Invalid date format']}
        mock_filter_serializer.return_value = mock_serializer_instance
        
        response = self.client.get(self.url, {'date_from': 'invalid-date'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'date_from': ['Invalid date format']})

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    def test_get_prediction_history_empty_results(self, mock_filter_serializer):
        """Test GET request that returns no results"""
        empty_queryset = MagicMock()
        empty_queryset.count.return_value = 0
        empty_queryset.__getitem__.return_value = empty_queryset
        empty_queryset.filter.return_value = empty_queryset
        
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {'model_used': 'nonexistent', 'limit': 100}
        mock_filter_serializer.return_value = mock_serializer_instance
        
        MockPredictionHistory.objects.all.return_value = empty_queryset
        
        with patch('core.views.PredictionHistoryListSerializer') as mock_list_serializer:
            mock_list_serializer.return_value.data = []
            
            response = self.client.get(self.url, {'model_used': 'nonexistent'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['returned_count'], 0)
        self.assertEqual(len(response.data['results']), 0)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    def test_get_prediction_history_default_limit(self, mock_filter_serializer):
        """Test GET request uses default limit of 100 when not specified"""
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {}  
        mock_filter_serializer.return_value = mock_serializer_instance
        
        MockPredictionHistory.objects.all.return_value = self.mock_queryset
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.mock_queryset.__getitem__.assert_called_with(slice(None, 100, None))

    def test_only_get_method_allowed(self):
        """Test that only GET method is allowed"""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.put(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.patch(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    @patch('core.views.PredictionHistoryListSerializer', MockPredictionHistoryListSerializer)
    def test_response_structure(self, mock_filter_serializer):
        """Test the structure of the response data"""
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {'model_used': 'linear', 'limit': 50}
        mock_filter_serializer.return_value = mock_serializer_instance
        
        MockPredictionHistory.objects.all.return_value = self.mock_queryset
        
        response = self.client.get(self.url, {'model_used': 'linear', 'limit': '50'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        required_keys = ['count', 'results', 'filters_applied', 'returned_count']
        for key in required_keys:
            self.assertIn(key, response.data, f"Missing required key: {key}")
        
        self.assertIsInstance(response.data['count'], int)
        self.assertIsInstance(response.data['results'], list)
        self.assertIsInstance(response.data['filters_applied'], dict)
        self.assertIsInstance(response.data['returned_count'], int)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.PredictionHistoryFilterSerializer')
    def test_serializer_exception_handling(self, mock_filter_serializer):
        """Test handling of serializer exceptions"""
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.is_valid.side_effect = Exception("Serializer error")
        mock_filter_serializer.return_value = mock_serializer_instance
        
        with self.assertRaises(Exception):
            self.client.get(self.url, {'invalid_param': 'value'})


if __name__ == '__main__':
    unittest.main()
