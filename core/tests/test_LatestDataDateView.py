import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, date, timedelta
import sys

import django
from django.conf import settings
from django.utils import timezone
import pytz

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

class MockTimeSeriesData:
    objects = MagicMock()

mock_timezone = MagicMock()
mock_timezone.get_current_timezone.return_value = timezone.get_current_timezone()

sys.modules['core.models'] = MagicMock()
sys.modules['core.models'].TimeSeriesData = MockTimeSeriesData


class TestLatestDataDateView(APITestCase):
    """Test cases for LatestDataDateView class"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.url = '/data/latest-date/'
        
        self.test_latest_datetime = datetime(2023, 12, 31, 23, 0, 0, tzinfo=pytz.UTC)
        self.test_oldest_datetime = datetime(2023, 1, 1, 0, 0, 0, tzinfo=pytz.UTC)
        
        self.expected_latest_date = date(2023, 12, 30)  
        self.expected_oldest_date = date(2023, 1, 1)

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.timezone.get_current_timezone')
    def test_successful_response_with_data(self, mock_get_timezone):
        """Test successful response when database has data"""
        mock_latest_record = MagicMock()
        mock_latest_record.datetime_utc = self.test_latest_datetime
        
        mock_oldest_record = MagicMock()
        mock_oldest_record.datetime_utc = self.test_oldest_datetime
        
        def mock_order_by(field):
            mock_query = MagicMock()
            if field == '-datetime_utc':
                mock_query.first.return_value = mock_latest_record
            elif field == 'datetime_utc':
                mock_query.first.return_value = mock_oldest_record
            return mock_query
        
        MockTimeSeriesData.objects.order_by.side_effect = mock_order_by
        
        MockTimeSeriesData.objects.count.return_value = 8760  
        
        mock_get_timezone.return_value = timezone.get_current_timezone()
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        expected_fields = [
            'latest_date', 'oldest_date', 'total_days_available', 
            'total_records', 'timezone', 'suggested_defaults'
        ]
        
        for field in expected_fields:
            self.assertIn(field, response.data)
        
        self.assertEqual(response.data['latest_date'], self.expected_latest_date.isoformat())
        self.assertEqual(response.data['oldest_date'], self.expected_oldest_date.isoformat())
        self.assertEqual(response.data['total_records'], 8760)
        
        suggested_defaults = response.data['suggested_defaults']
        expected_default_fields = ['end_date', 'days_30', 'days_90', 'days_365']
        
        for field in expected_default_fields:
            self.assertIn(field, suggested_defaults)
        
        self.assertEqual(suggested_defaults['end_date'], self.expected_latest_date.isoformat())

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.timezone.get_current_timezone')
    def test_total_days_calculation(self, mock_get_timezone):
        """Test total days calculation between oldest and latest dates"""
        latest_datetime = datetime(2023, 12, 31, 23, 0, 0, tzinfo=pytz.UTC)
        oldest_datetime = datetime(2023, 1, 1, 0, 0, 0, tzinfo=pytz.UTC)
        
        mock_latest_record = MagicMock()
        mock_latest_record.datetime_utc = latest_datetime
        
        mock_oldest_record = MagicMock()
        mock_oldest_record.datetime_utc = oldest_datetime
        
        def mock_order_by(field):
            mock_query = MagicMock()
            if field == '-datetime_utc':
                mock_query.first.return_value = mock_latest_record
            elif field == 'datetime_utc':
                mock_query.first.return_value = mock_oldest_record
            return mock_query
        
        MockTimeSeriesData.objects.order_by.side_effect = mock_order_by
        MockTimeSeriesData.objects.count.return_value = 100
        mock_get_timezone.return_value = timezone.get_current_timezone()
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        expected_latest_date = date(2023, 12, 30)  
        expected_oldest_date = date(2023, 1, 1)
        expected_total_days = (expected_latest_date - expected_oldest_date).days
        
        self.assertEqual(response.data['total_days_available'], expected_total_days)

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.timezone.get_current_timezone')
    def test_suggested_defaults_calculation(self, mock_get_timezone):
        """Test suggested defaults date calculations"""
        latest_datetime = datetime(2023, 12, 31, 23, 0, 0, tzinfo=pytz.UTC)
        
        mock_latest_record = MagicMock()
        mock_latest_record.datetime_utc = latest_datetime
        
        mock_oldest_record = MagicMock()
        mock_oldest_record.datetime_utc = datetime(2023, 1, 1, 0, 0, 0, tzinfo=pytz.UTC)
        
        def mock_order_by(field):
            mock_query = MagicMock()
            if field == '-datetime_utc':
                mock_query.first.return_value = mock_latest_record
            elif field == 'datetime_utc':
                mock_query.first.return_value = mock_oldest_record
            return mock_query
        
        MockTimeSeriesData.objects.order_by.side_effect = mock_order_by
        MockTimeSeriesData.objects.count.return_value = 100
        mock_get_timezone.return_value = timezone.get_current_timezone()
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        suggested_defaults = response.data['suggested_defaults']
        
        base_date = date(2023, 12, 30)
        
        self.assertEqual(suggested_defaults['end_date'], base_date.isoformat())
        self.assertEqual(suggested_defaults['days_30'], (base_date - timedelta(days=30)).isoformat())
        self.assertEqual(suggested_defaults['days_90'], (base_date - timedelta(days=90)).isoformat())
        self.assertEqual(suggested_defaults['days_365'], (base_date - timedelta(days=365)).isoformat())

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.timezone.get_current_timezone')
    def test_oldest_record_none_handling(self, mock_get_timezone):
        """Test handling when oldest record is None"""
        mock_latest_record = MagicMock()
        mock_latest_record.datetime_utc = self.test_latest_datetime
        
        def mock_order_by(field):
            mock_query = MagicMock()
            if field == '-datetime_utc':
                mock_query.first.return_value = mock_latest_record
            elif field == 'datetime_utc':
                mock_query.first.return_value = None  
            return mock_query
        
        MockTimeSeriesData.objects.order_by.side_effect = mock_order_by
        MockTimeSeriesData.objects.count.return_value = 1
        mock_get_timezone.return_value = timezone.get_current_timezone()
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['oldest_date'])
        self.assertEqual(response.data['total_days_available'], 0)

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    def test_database_exception_handling(self):
        """Test handling of database exceptions"""
        MockTimeSeriesData.objects.order_by.side_effect = Exception("Database connection failed")
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('Fallo al obtener la fecha más reciente', response.data['error'])

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.timezone.get_current_timezone')
    def test_timezone_inclusion(self, mock_get_timezone):
        """Test that timezone information is included in response"""
        mock_latest_record = MagicMock()
        mock_latest_record.datetime_utc = self.test_latest_datetime
        
        mock_oldest_record = MagicMock()
        mock_oldest_record.datetime_utc = self.test_oldest_datetime
        
        def mock_order_by(field):
            mock_query = MagicMock()
            if field == '-datetime_utc':
                mock_query.first.return_value = mock_latest_record
            elif field == 'datetime_utc':
                mock_query.first.return_value = mock_oldest_record
            return mock_query
        
        MockTimeSeriesData.objects.order_by.side_effect = mock_order_by
        MockTimeSeriesData.objects.count.return_value = 100
        
        mock_tz = MagicMock()
        mock_tz.__str__ = MagicMock(return_value='UTC')
        mock_get_timezone.return_value = mock_tz
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('timezone', response.data)
        self.assertEqual(response.data['timezone'], 'UTC')

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.timezone.get_current_timezone')
    def test_date_minus_one_day_logic(self, mock_get_timezone):
        """Test that the returned latest_date is one day before the actual latest"""
        actual_latest = datetime(2023, 6, 15, 12, 0, 0, tzinfo=pytz.UTC)
        expected_returned_date = date(2023, 6, 14)  
        
        mock_latest_record = MagicMock()
        mock_latest_record.datetime_utc = actual_latest
        
        mock_oldest_record = MagicMock()
        mock_oldest_record.datetime_utc = datetime(2023, 1, 1, 0, 0, 0, tzinfo=pytz.UTC)
        
        def mock_order_by(field):
            mock_query = MagicMock()
            if field == '-datetime_utc':
                mock_query.first.return_value = mock_latest_record
            elif field == 'datetime_utc':
                mock_query.first.return_value = mock_oldest_record
            return mock_query
        
        MockTimeSeriesData.objects.order_by.side_effect = mock_order_by
        MockTimeSeriesData.objects.count.return_value = 100
        mock_get_timezone.return_value = timezone.get_current_timezone()
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['latest_date'], expected_returned_date.isoformat())

    def test_only_get_method_allowed(self):
        """Test that only GET method is allowed"""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.put(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.timezone.get_current_timezone')
    def test_response_structure_completeness(self, mock_get_timezone):
        """Test that response contains all expected fields with correct types"""
        mock_latest_record = MagicMock()
        mock_latest_record.datetime_utc = self.test_latest_datetime
        
        mock_oldest_record = MagicMock()
        mock_oldest_record.datetime_utc = self.test_oldest_datetime
        
        def mock_order_by(field):
            mock_query = MagicMock()
            if field == '-datetime_utc':
                mock_query.first.return_value = mock_latest_record
            elif field == 'datetime_utc':
                mock_query.first.return_value = mock_oldest_record
            return mock_query
        
        MockTimeSeriesData.objects.order_by.side_effect = mock_order_by
        MockTimeSeriesData.objects.count.return_value = 500
        mock_get_timezone.return_value = timezone.get_current_timezone()
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertIsInstance(response.data['latest_date'], str)
        self.assertIsInstance(response.data['oldest_date'], str)
        self.assertIsInstance(response.data['total_days_available'], int)
        self.assertIsInstance(response.data['total_records'], int)
        self.assertIsInstance(response.data['timezone'], str)
        self.assertIsInstance(response.data['suggested_defaults'], dict)
        
        suggested_defaults = response.data['suggested_defaults']
        self.assertIsInstance(suggested_defaults['end_date'], str)
        self.assertIsInstance(suggested_defaults['days_30'], str)
        self.assertIsInstance(suggested_defaults['days_90'], str)
        self.assertIsInstance(suggested_defaults['days_365'], str)

    @patch('core.views.TimeSeriesData', MockTimeSeriesData)
    @patch('core.views.timezone.get_current_timezone')
    def test_edge_case_single_day_data(self, mock_get_timezone):
        """Test handling when oldest and latest dates are the same"""
        same_datetime = datetime(2023, 6, 15, 12, 0, 0, tzinfo=pytz.UTC)
        
        mock_record = MagicMock()
        mock_record.datetime_utc = same_datetime
        
        def mock_order_by(field):
            mock_query = MagicMock()
            if field == '-datetime_utc':
                mock_query.first.return_value = mock_record
            elif field == 'datetime_utc':
                mock_query.first.return_value = mock_record  
            return mock_query
        
        MockTimeSeriesData.objects.order_by.side_effect = mock_order_by
        MockTimeSeriesData.objects.count.return_value = 1
        mock_get_timezone.return_value = timezone.get_current_timezone()
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        expected_latest_date = date(2023, 6, 14)  
        expected_oldest_date = date(2023, 6, 15)
        expected_total_days = (expected_latest_date - expected_oldest_date).days
        
        self.assertEqual(response.data['total_days_available'], expected_total_days)


if __name__ == '__main__':
    unittest.main()
