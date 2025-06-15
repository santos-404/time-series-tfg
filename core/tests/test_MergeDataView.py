import unittest
from unittest.mock import patch, mock_open
import pandas as pd

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
        BASE_DIR='/test/project',
    )
    django.setup()

from django.test import override_settings
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from core.views import MergeDataView


class TestMergeDataView(APITestCase):
    """Test cases for MergeDataView class"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.url = '/data/merge/'
        
        # Sample CSV data for different scenarios
        self.sample_csv_geo_data = """datetime_utc,geo_name,value
2023-01-01 00:00:00,España,1000
2023-01-01 00:00:00,Portugal,950
2023-01-01 01:00:00,España,1100
2023-01-01 01:00:00,Portugal,1050"""

        self.sample_csv_single_geo = """datetime_utc,geo_name,value
2023-01-01 00:00:00,España,1000
2023-01-01 01:00:00,España,1100"""

        self.sample_csv_no_geo = """datetime_utc,value
2023-01-01 00:00:00,500
2023-01-01 01:00:00,550"""

        self.sample_csv_with_minutes = """datetime_utc,geo_name,value
2023-01-01 00:00:00,España,1000
2023-01-01 00:15:00,España,1025
2023-01-01 00:30:00,España,1050
2023-01-01 01:00:00,España,1100"""

    def test_get_data_dir_method(self):
        """Test _get_data_dir method"""
        view = MergeDataView()
        with override_settings(BASE_DIR='/test/project'):
            data_dir = view._get_data_dir()
            self.assertEqual(data_dir, '/test/project/data')

    def test_get_data_id_method(self):
        """Test _get_data_id method"""
        view = MergeDataView()
        
        # Test valid path
        path = "/data/category1/sensor123_data.csv"
        data_id = view._get_data_id(path)
        self.assertEqual(data_id, "category1_sensor123")
        
        # Test Windows path
        path = "\\data\\category2\\sensor456_info.csv"
        data_id = view._get_data_id(path)
        self.assertEqual(data_id, "category2_sensor456")
        
        # Test invalid path (too short)
        path = "sensor123.csv"
        data_id = view._get_data_id(path)
        self.assertIsNone(data_id)

    @patch('os.path.exists')
    def test_data_directory_not_found(self, mock_exists):
        """Test response when data directory doesn't exist"""
        mock_exists.return_value = False
        
        response = self.client.post(self.url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Directorio de datos no encontrado', response.data['error'])

    @patch('os.path.exists')
    @patch('os.walk')
    def test_no_valid_data_found(self, mock_walk, mock_exists):
        """Test response when no valid CSV files are found"""
        mock_exists.return_value = True
        mock_walk.return_value = [
            ('/test/project/data', [], ['not_csv.txt']),
            ('/test/project/data/category1', [], [])
        ]
        
        response = self.client.post(self.url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('No se han encontrado datos validos', response.data['error'])


    @patch('os.path.exists')
    @patch('os.walk')
    @patch('pandas.read_csv')
    def test_csv_reading_error_handling(self, mock_read_csv, mock_walk, mock_exists):
        """Test handling of CSV reading errors"""
        mock_exists.return_value = True
        mock_walk.return_value = [
            ('/test/project/data/category1', [], ['sensor1_data.csv', 'sensor2_data.csv'])
        ]
        
        # First file succeeds, second fails
        df1 = pd.DataFrame({
            'datetime_utc': pd.to_datetime(['2023-01-01 00:00:00'], utc=True),
            'value': [1000]
        })
        
        mock_read_csv.side_effect = [df1, Exception("CSV read error")]
        
        with patch('pandas.to_datetime', return_value=df1['datetime_utc']):
            with patch('builtins.open', mock_open()):
                with patch.object(pd.DataFrame, 'to_csv'):
                    response = self.client.post(self.url, {})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('errors', response.data)
        self.assertIsNotNone(response.data['errors'])
        self.assertTrue(len(response.data['errors']) > 0)

    @patch('os.path.exists')
    @patch('os.walk')
    @patch('pandas.read_csv')
    @patch('pandas.to_datetime')
    def test_merge_failure_handling(self, mock_to_datetime, mock_read_csv, mock_walk, mock_exists):
        """Test handling when merge operation fails"""
        mock_exists.return_value = True
        mock_walk.return_value = [
            ('/test/project/data/category1', [], ['sensor1_data.csv'])
        ]
        
        df = pd.DataFrame({
            'datetime_utc': ['2023-01-01 00:00:00'],
            'value': [1000]
        })
        
        mock_read_csv.return_value = df
        mock_to_datetime.return_value = pd.to_datetime(df['datetime_utc'], utc=True)
        
        # Mock merge failure by making merge return None
        with patch('pandas.merge', side_effect=Exception("Merge failed")):
            response = self.client.post(self.url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


    @patch('os.path.exists')
    def test_general_exception_handling(self, mock_exists):
        """Test general exception handling"""
        mock_exists.side_effect = Exception("Unexpected error")
        
        response = self.client.post(self.url, {})
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('Hubo un error al unir los datos', response.data['error'])

    def test_only_post_method_allowed(self):
        """Test that only POST method is allowed"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.put(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


    def test_selected_geo_initialization(self):
        """Test that SELECTED_GEO is properly initialized"""
        view = MergeDataView()
        expected_geos = {"Península", "España", "Portugal", "Baleares", "Canarias", "Ceuta", "Melilla"}
        self.assertEqual(view.SELECTED_GEO, expected_geos)


if __name__ == '__main__':
    unittest.main()
