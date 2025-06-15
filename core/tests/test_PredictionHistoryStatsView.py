import unittest
from unittest.mock import patch, MagicMock
import sys
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
        MEDIA_ROOT='/tmp/test_media',
        BASE_DIR='/tmp/test_base',
    )
    django.setup()

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status


class MockPredictionHistory:
    """Mock class for PredictionHistory model"""
    objects = MagicMock()
    
    def __init__(self, pk=None, **kwargs):
        self.id = pk or 1
        self.created_at = kwargs.get('created_at', datetime(2025, 3, 25, 10, 0, 0))
        self.model_used = kwargs.get('model_used', 'linear')
        self.hours_ahead = kwargs.get('hours_ahead', 3)
        self.input_hours = kwargs.get('input_hours', 24)
        self.prediction_date = kwargs.get('prediction_date', date(2025, 3, 25))
        self.start_time = kwargs.get('start_time', datetime(2025, 3, 25, 10, 0, 0))
        self.end_time = kwargs.get('end_time', datetime(2025, 3, 25, 14, 0, 0))
        self.predictions = kwargs.get('predictions', {
            'scheduled_demand_372': [1000.5, 1100.2, 1200.1],
            'daily_spot_market_600_España': [50.5, 55.2, 60.1]
        })
        self.timestamps = kwargs.get('timestamps', [
            '2025-03-25T15:00:00Z',
            '2025-03-25T16:00:00Z',
            '2025-03-25T17:00:00Z'
        ])
        self.notes = kwargs.get('notes', '')


class MockQuerySet:
    """Mock QuerySet class for database operations"""
    
    def __init__(self, data=None, count_value=0):
        self.data = data or []
        self.count_value = count_value
    
    def count(self):
        return self.count_value
    
    def filter(self, **kwargs):
        filtered_count = self.count_value  
        return MockQuerySet(self.data, filtered_count)
    
    def order_by(self, field):
        return self
    
    def first(self):
        return self.data[0] if self.data else None
    
    def aggregate(self, **kwargs):
        return {'avg_hours': 4.5}  


class TestPredictionHistoryStatsView(APITestCase):
    """Test cases for PredictionHistoryStatsView class"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.base_url = '/predictions/history/stats/'
        
        self.mock_predictions = [
            MockPredictionHistory(
                pk=1,
                created_at=timezone.now() - timezone.timedelta(days=1),
                model_used='linear',
                hours_ahead=3
            ),
            MockPredictionHistory(
                pk=2,
                created_at=timezone.now() - timezone.timedelta(days=5),
                model_used='dense',
                hours_ahead=6
            ),
            MockPredictionHistory(
                pk=3,
                created_at=timezone.now() - timezone.timedelta(days=10),
                model_used='conv',
                hours_ahead=4
            )
        ]

    def tearDown(self):
        """Clean up after tests"""
        pass

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.timezone')
    def test_get_stats_no_predictions(self, mock_timezone):
        """Test stats retrieval when no predictions exist"""
        MockPredictionHistory.objects.count.return_value = 0
        
        response = self.client.get(self.base_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        expected_data = {
            'total_predictions': 0,
            'models_used': [],
            'date_range': None,
            'average_hours_ahead': 0,
            'recent_predictions_7_days': 0
        }
        
        self.assertEqual(response.data, expected_data)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.timezone')
    def test_get_stats_with_predictions(self, mock_timezone):
        """Test stats retrieval with existing predictions"""
        mock_now = timezone.now()
        mock_timezone.now.return_value = mock_now
        mock_timezone.timedelta = timezone.timedelta
        
        MockPredictionHistory.objects.count.return_value = 10
        
        model_counts = {'linear': 4, 'dense': 3, 'conv': 2, 'lstm': 1}
        def mock_filter_count(*args, **kwargs):
            model_used = kwargs.get('model_used')
            queryset = MockQuerySet(count_value=model_counts.get(model_used, 0))
            return queryset
        
        MockPredictionHistory.objects.filter.side_effect = mock_filter_count
        
        oldest_prediction = MockPredictionHistory(
            created_at=datetime(2025, 1, 1, 10, 0, 0)
        )
        newest_prediction = MockPredictionHistory(
            created_at=datetime(2025, 3, 25, 15, 0, 0)
        )
        
        mock_oldest_qs = MockQuerySet([oldest_prediction])
        mock_newest_qs = MockQuerySet([newest_prediction])
        
        def mock_order_by(field):
            if field == 'created_at':
                return mock_oldest_qs
            elif field == '-created_at':
                return mock_newest_qs
            return MockQuerySet()
        
        MockPredictionHistory.objects.order_by.side_effect = mock_order_by
        
        MockPredictionHistory.objects.aggregate.return_value = {'avg_hours': 4.5}
        
        response = self.client.get(self.base_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertIn('total_predictions', response.data)
        self.assertIn('models_used', response.data)
        self.assertIn('date_range', response.data)
        self.assertIn('average_hours_ahead', response.data)
        self.assertIn('recent_predictions_7_days', response.data)
        
        self.assertEqual(response.data['total_predictions'], 10)
        self.assertEqual(response.data['models_used'], model_counts)
        self.assertEqual(response.data['average_hours_ahead'], 4.5)
        
        self.assertIn('oldest', response.data['date_range'])
        self.assertIn('newest', response.data['date_range'])

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.timezone')
    def test_get_stats_partial_models(self, mock_timezone):
        """Test stats when only some models have predictions"""
        mock_now = timezone.now()
        mock_timezone.now.return_value = mock_now
        mock_timezone.timedelta = timezone.timedelta
        
        MockPredictionHistory.objects.count.return_value = 5
        
        model_counts = {'linear': 3, 'dense': 2, 'conv': 0, 'lstm': 0}
        def mock_filter_count(*args, **kwargs):
            model_used = kwargs.get('model_used')
            queryset = MockQuerySet(count_value=model_counts.get(model_used, 0))
            return queryset
        
        MockPredictionHistory.objects.filter.side_effect = mock_filter_count
        
        prediction = MockPredictionHistory()
        mock_qs = MockQuerySet([prediction])
        MockPredictionHistory.objects.order_by.return_value = mock_qs
        MockPredictionHistory.objects.aggregate.return_value = {'avg_hours': 3.2}
        
        response = self.client.get(self.base_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        expected_models = {'linear': 3, 'dense': 2}
        self.assertEqual(response.data['models_used'], expected_models)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    @patch('core.views.timezone')
    def test_get_stats_recent_predictions(self, mock_timezone):
        """Test recent predictions count (last 7 days)"""
        mock_now = timezone.now()
        mock_timezone.now.return_value = mock_now
        mock_timezone.timedelta = timezone.timedelta
        
        MockPredictionHistory.objects.count.return_value = 15
        
        def mock_filter_count(*args, **kwargs):
            if 'created_at__gte' in kwargs:
                return MockQuerySet(count_value=8)
            elif 'model_used' in kwargs:
                return MockQuerySet(count_value=2)
            return MockQuerySet(count_value=0)
        
        MockPredictionHistory.objects.filter.side_effect = mock_filter_count
        
        prediction = MockPredictionHistory()
        mock_qs = MockQuerySet([prediction])
        MockPredictionHistory.objects.order_by.return_value = mock_qs
        MockPredictionHistory.objects.aggregate.return_value = {'avg_hours': 5.0}
        
        response = self.client.get(self.base_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['recent_predictions_7_days'], 8)

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    def test_get_stats_null_average(self, mock_timezone=None):
        """Test stats when average calculation returns None"""
        MockPredictionHistory.objects.count.return_value = 3
        
        MockPredictionHistory.objects.filter.return_value = MockQuerySet(count_value=1)
        
        prediction = MockPredictionHistory()
        mock_qs = MockQuerySet([prediction])
        MockPredictionHistory.objects.order_by.return_value = mock_qs
        
        MockPredictionHistory.objects.aggregate.return_value = {'avg_hours': None}
        
        response = self.client.get(self.base_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['average_hours_ahead'], 0)

    def test_post_method_not_allowed(self):
        """Test that POST method is not allowed"""
        response = self.client.post(self.base_url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_put_method_not_allowed(self):
        """Test that PUT method is not allowed"""
        response = self.client.put(self.base_url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_method_not_allowed(self):
        """Test that DELETE method is not allowed"""
        response = self.client.delete(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_patch_method_not_allowed(self):
        """Test that PATCH method is not allowed"""
        response = self.client.patch(self.base_url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


if __name__ == '__main__':
    unittest.main()
