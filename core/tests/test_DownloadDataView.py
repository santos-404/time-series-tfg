import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
import os
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
        BASE_DIR='/test/project',
    )
    django.setup()

from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from core.views import DownloadDataView


class TestDownloadDataView(APITestCase):
    """Test cases for DownloadDataView class"""
    
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.url = '/data/download/'
        self.view = DownloadDataView()
        
        # Sample API response data
        self.sample_indicators_response = {
            'indicators': [
                {
                    'id': 358,
                    'name': 'Demanda programada PBF',
                    'description': '<p>Demanda programada PBF description</p>',
                    'short_name': 'dem_prog_pbf'
                },
                {
                    'id': 460,
                    'name': 'Previsión demanda',
                    'description': '<b>Previsión</b> de la demanda peninsular',
                    'short_name': 'prev_dem'
                }
            ]
        }
        
        self.sample_data_response = {
            'indicator': {
                'id': 358,
                'name': 'Test Indicator',
                'values': [
                    {
                        'value': 1000.5,
                        'datetime': '2023-01-01T00:00:00.000+01:00',
                        'datetime_utc': '2022-12-31T23:00:00.000+00:00'
                    },
                    {
                        'value': 1100.7,
                        'datetime': '2023-01-01T00:05:00.000+01:00',
                        'datetime_utc': '2022-12-31T23:05:00.000+00:00'
                    }
                ]
            }
        }
        
        self.valid_request_data = {
            'esios_token': 'test-token-123',
            'download_indicators': True,
            'years_back': 2
        }

    def test_get_headers(self):
        """Test _get_headers method returns correct headers"""
        token = 'test-token-123'
        headers = self.view._get_headers(token)
        
        expected_headers = {
            'Accept': 'application/json; application/vnd.esios-api-v2+json',
            'Content-Type': 'application/json',
            'Host': 'api.esios.ree.es',
            'Cookie': '',
            'Authorization': f'Token token={token}',
            'x-api-key': f'{token}',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        self.assertEqual(headers, expected_headers)

    @patch('core.views.settings')
    def test_get_data_dir(self, mock_settings):
        """Test _get_data_dir method returns correct path"""
        mock_settings.BASE_DIR = '/test/project'
        
        data_dir = self.view._get_data_dir()
        expected_path = os.path.join('/test/project', 'data')
        
        self.assertEqual(data_dir, expected_path)


    @patch('core.views.requests.get')
    @patch('core.views.pd.json_normalize')
    def test_get_indicators_success(self, mock_normalize, mock_get):
        """Test successful indicators retrieval"""
        # Mock the response
        mock_response = MagicMock()
        mock_response.json.return_value = self.sample_indicators_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response
        
        # Mock pandas operations
        mock_df = MagicMock()
        mock_df.assign.return_value = mock_df
        mock_normalize.return_value = mock_df
        
        headers = {'Authorization': 'Token token=test'}
        result = self.view._get_indicators(headers)
        
        mock_get.assert_called_once_with(self.view.BASE_ENDPOINT, headers=headers)
        mock_response.raise_for_status.assert_called_once()
        mock_normalize.assert_called_once()
        self.assertEqual(result, mock_df)

    @patch('core.views.requests.get')
    def test_get_indicators_request_exception(self, mock_get):
        """Test _get_indicators handles request exceptions"""
        mock_get.side_effect = Exception("Connection error")
        
        headers = {'Authorization': 'Token token=test'}
        
        with self.assertRaises(Exception) as context:
            self.view._get_indicators(headers)
        
        self.assertIn('Connection error', str(context.exception))

    @patch('core.views.requests.get')
    @patch('core.views.pd.json_normalize')
    def test_get_data_by_id_month_success(self, mock_normalize, mock_get):
        """Test successful data retrieval by indicator ID and month"""
        # Mock the response
        mock_response = MagicMock()
        mock_response.json.return_value = self.sample_data_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response
        
        # Mock pandas normalize
        mock_df = pd.DataFrame([{'value': 1000, 'datetime': '2023-01-01'}])
        mock_normalize.return_value = mock_df
        
        headers = {'Authorization': 'Token token=test'}
        result = self.view._get_data_by_id_month(358, 2023, 1, headers)
        
        # Verify the endpoint was called with correct parameters
        expected_endpoint = (f"{self.view.BASE_ENDPOINT}/358?"
                           f"start_date=2023-01-01T00:00&"
                           f"end_date=2023-01-31T23:59&"
                           f"time_trunc=five_minutes")
        
        mock_get.assert_called_once_with(expected_endpoint, headers=headers)
        self.assertEqual(result.equals(mock_df), True)

    @patch('core.views.requests.get')
    def test_get_data_by_id_month_current_month(self, mock_get):
        """Test data retrieval for current month uses today as end date"""
        mock_response = MagicMock()
        mock_response.json.return_value = self.sample_data_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response
        
        headers = {'Authorization': 'Token token=test'}
        current_date = datetime.today()
        
        with patch('core.views.datetime') as mock_datetime:
            mock_datetime.today.return_value = current_date
            mock_datetime.return_value = datetime
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
            
            self.view._get_data_by_id_month(358, current_date.year, current_date.month, headers)
            
            # The endpoint should use today's date as end date
            expected_end_date = current_date.strftime('%Y-%m-%d')
            call_args = mock_get.call_args[0][0]
            self.assertIn(f"end_date={expected_end_date}T23:59", call_args)

    @patch('core.views.requests.get')
    def test_get_data_by_id_month_request_exception(self, mock_get):
        """Test _get_data_by_id_month handles request exceptions"""
        mock_get.side_effect = Exception("API error")
        
        headers = {'Authorization': 'Token token=test'}
        
        with self.assertRaises(Exception) as context:
            self.view._get_data_by_id_month(358, 2023, 1, headers)
        
        self.assertIn('API error', str(context.exception))

    @patch('os.makedirs')
    @patch('pandas.DataFrame.to_csv')
    def test_save_data(self, mock_to_csv, mock_makedirs):
        """Test _save_data method"""
        mock_df = pd.DataFrame({'test': [1, 2, 3]})
        file_path = '/test/path/data.csv'
        
        self.view._save_data(mock_df, file_path)
        
        mock_makedirs.assert_called_once_with('/test/path', exist_ok=True)
        mock_to_csv.assert_called_once_with(file_path, index=False)

    @patch('core.views.DownloadDataView._get_headers')
    @patch('core.views.DownloadDataView._get_data_dir')
    @patch('core.views.DownloadDataView._get_indicators')
    @patch('core.views.DownloadDataView._save_data')
    @patch('os.makedirs')
    def test_post_success_with_indicators(self, mock_makedirs, mock_save_data, 
                                        mock_get_indicators, mock_get_data_dir, 
                                        mock_get_headers):
        """Test successful POST request with indicators download"""
        # Setup mocks
        mock_get_headers.return_value = {'Authorization': 'Token token=test'}
        mock_get_data_dir.return_value = '/test/data'
        mock_get_indicators.return_value = pd.DataFrame({'id': [1, 2]})
        
        # Mock datetime to control the date range
        mock_today = datetime(2023, 6, 15)
        
        with patch('core.views.datetime') as mock_datetime:
            mock_datetime.today.return_value = mock_today
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
            
            with patch('core.views.DownloadDataView._get_data_by_id_month') as mock_get_data:
                mock_get_data.return_value = pd.DataFrame({'value': [100, 200]})
                
                response = self.client.post(self.url, self.valid_request_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('downloaded_files', response.data)
        self.assertIn('indicators.csv', response.data['downloaded_files'])

    def test_post_invalid_serializer(self):
        """Test POST request with invalid data"""
        invalid_data = {
            'years_back': 'invalid'  # Should be integer
        }
        
        response = self.client.post(self.url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('core.views.DownloadDataView._get_headers')
    def test_post_general_exception(self, mock_get_headers):
        """Test POST request with general exception"""
        mock_get_headers.side_effect = Exception("General error")
        
        response = self.client.post(self.url, self.valid_request_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('Download failed', response.data['error'])

    @patch('core.views.DownloadDataView._get_headers')
    @patch('core.views.DownloadDataView._get_data_dir')
    @patch('os.makedirs')
    def test_post_all_errors_no_success(self, mock_makedirs, mock_get_data_dir, mock_get_headers):
        """Test POST request where all operations fail"""
        mock_get_headers.return_value = {'Authorization': 'Token token=test'}
        mock_get_data_dir.return_value = '/test/data'
        
        with patch('core.views.DownloadDataView._get_indicators') as mock_get_indicators:
            mock_get_indicators.side_effect = Exception("Indicators failed")
            
            with patch('core.views.DownloadDataView._get_data_by_id_month') as mock_get_data:
                mock_get_data.side_effect = Exception("Data failed")
                
                mock_today = datetime(2023, 6, 15)
                
                with patch('core.views.datetime') as mock_datetime:
                    mock_datetime.today.return_value = mock_today
                    mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
                    
                    response = self.client.post(self.url, self.valid_request_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('errors', response.data)
        self.assertEqual(len(response.data['downloaded_files']), 0)

    @patch('core.views.DownloadDataView._get_headers')
    @patch('core.views.DownloadDataView._get_data_dir')
    @patch('core.views.DownloadDataView._save_data')
    @patch('os.makedirs')
    @patch('core.views.pd.concat')
    def test_monthly_data_combination(self, mock_concat, mock_makedirs, mock_save_data, 
                                    mock_get_data_dir, mock_get_headers):
        """Test that monthly data is properly combined into yearly files"""
        mock_get_headers.return_value = {'Authorization': 'Token token=test'}
        mock_get_data_dir.return_value = '/test/data'
        
        # Mock monthly data returns
        monthly_df1 = pd.DataFrame({'value': [100, 200], 'datetime': ['2023-01-01', '2023-01-02']})
        monthly_df2 = pd.DataFrame({'value': [300, 400], 'datetime': ['2023-02-01', '2023-02-02']})
        combined_df = pd.DataFrame({'value': [100, 200, 300, 400], 
                                  'datetime': ['2023-01-01', '2023-01-02', '2023-02-01', '2023-02-02']})
        
        mock_concat.return_value = combined_df
        
        request_data = {
            'esios_token': 'test-token-123',
            'download_indicators': False,
            'years_back': 1
        }
        
        mock_today = datetime(2023, 3, 15)  # March, so we'll have Jan and Feb data
        
        with patch('core.views.datetime') as mock_datetime:
            mock_datetime.today.return_value = mock_today
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw)
            
            with patch('core.views.DownloadDataView._get_data_by_id_month') as mock_get_data:
                # Return different data for different months
                mock_get_data.side_effect = [monthly_df1, monthly_df2] * 50  # Enough for all indicators
                
                response = self.client.post(self.url, request_data, format='json')
        
        # Verify that concat was called (monthly data was combined)
        self.assertTrue(mock_concat.called)
        
        # Verify that save_data was called (yearly files were saved)
        self.assertTrue(mock_save_data.called)

    def test_only_post_method_allowed(self):
        """Test that only POST method is allowed"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.put(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_data_to_download_structure(self):
        """Test that DATA_TO_DOWNLOAD has expected structure"""
        expected_categories = [
            "energy_generation/hydraulic",
            "energy_generation/nuclear", 
            "energy_generation/wind",
            "energy_generation/solar",
            "energy_demand/peninsula_forecast",
            "energy_demand/scheduled_demand",
            "price/daily_spot_market",
            "price/average_demand_price"
        ]
        
        for category in expected_categories:
            self.assertIn(category, self.view.DATA_TO_DOWNLOAD)
            self.assertIsInstance(self.view.DATA_TO_DOWNLOAD[category], list)
            self.assertTrue(len(self.view.DATA_TO_DOWNLOAD[category]) > 0)


if __name__ == '__main__':
    unittest.main()
