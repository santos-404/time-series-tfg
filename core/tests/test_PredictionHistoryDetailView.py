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
from rest_framework.test import APITestCase, APIClient
from rest_framework import status


class MockPredictionHistory:
    """Mock class for PredictionHistory model"""
    objects = MagicMock()
    
    def __init__(self, pk=None, **kwargs):
        self.id = pk or 1
        self.created_at = datetime(2025, 3, 25, 10, 0, 0)
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
    
    @property
    def prediction_summary(self):
        """Mock implementation of prediction_summary property"""
        if not self.predictions:
            return None
        
        try:
            summary = {
                'format': 'multi_label',
                'labels': {},
                'total_predictions': 0
            }
            
            for label, values in self.predictions.items():
                if isinstance(values, list):
                    numeric_values = []
                    for val in values:
                        try:
                            numeric_values.append(float(val))
                        except (ValueError, TypeError):
                            continue
                    
                    if numeric_values:
                        summary['labels'][label] = {
                            'count': len(numeric_values),
                            'min': min(numeric_values),
                            'max': max(numeric_values),
                            'avg': sum(numeric_values) / len(numeric_values)
                        }
                        summary['total_predictions'] += len(numeric_values)
                    else:
                        summary['labels'][label] = {
                            'count': 0,
                            'min': None,
                            'max': None,
                            'avg': None
                        }
            
            return summary
        
        except Exception:
            return None


class MockDoesNotExist(Exception):
    """Mock exception for DoesNotExist"""
    pass


MockPredictionHistory.DoesNotExist = MockDoesNotExist


from core.views import PredictionHistoryDetailView


class TestPredictionHistoryDetailView(APITestCase):
    """Test cases for PredictionHistoryDetailView class"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.base_url = '/predictions/history/'
        
        self.sample_prediction = MockPredictionHistory(
            pk=1,
            model_used='linear',
            hours_ahead=3,
            input_hours=24,
            prediction_date=date(2025, 3, 25),
            start_time=datetime(2025, 3, 25, 10, 0, 0),
            end_time=datetime(2025, 3, 25, 14, 0, 0),
            predictions={
                'scheduled_demand_372': [1000.5, 1100.2, 1200.1],
                'daily_spot_market_600_España': [50.5, 55.2, 60.1]
            },
            timestamps=[
                '2025-03-25T15:00:00Z',
                '2025-03-25T16:00:00Z',
                '2025-03-25T17:00:00Z'
            ],
            notes='Test prediction'
        )

    def tearDown(self):
        """Clean up after tests"""
        pass

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    def test_get_existing_prediction_success(self):
        """Test successful retrieval of existing prediction with id 1"""
        MockPredictionHistory.objects.get.return_value = self.sample_prediction
        
        url = f'{self.base_url}1/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('model_used', response.data)
        self.assertIn('hours_ahead', response.data)
        self.assertIn('input_hours', response.data)
        self.assertIn('prediction_date', response.data)
        self.assertIn('start_time', response.data)
        self.assertIn('end_time', response.data)
        self.assertIn('predictions', response.data)
        self.assertIn('timestamps', response.data)
        self.assertIn('notes', response.data)
        self.assertIn('prediction_summary', response.data)
        
        self.assertEqual(response.data['id'], 1)
        self.assertEqual(response.data['model_used'], 'linear')
        self.assertEqual(response.data['hours_ahead'], 3)
        self.assertEqual(response.data['input_hours'], 24)
        

    @patch('core.views.PredictionHistory', MockPredictionHistory)
    def test_get_nonexistent_prediction_404(self):
        """Test retrieval of non-existent prediction returns 404"""
        MockPredictionHistory.objects.get.side_effect = MockDoesNotExist()
        
        url = f'{self.base_url}999/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Predicción no encontrada')
        
    def test_post_method_not_allowed(self):
        """Test that POST method is not allowed"""
        url = f'{self.base_url}1/'
        response = self.client.post(url, {})
        
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_put_method_not_allowed(self):
        """Test that PUT method is not allowed"""
        url = f'{self.base_url}1/'
        response = self.client.put(url, {})
        
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_method_not_allowed(self):
        """Test that DELETE method is not allowed"""
        url = f'{self.base_url}1/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_patch_method_not_allowed(self):
        """Test that PATCH method is not allowed"""
        url = f'{self.base_url}1/'
        response = self.client.patch(url, {})
        
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)



if __name__ == '__main__':
    unittest.main()
