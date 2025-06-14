import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
import numpy as np
import sys

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

from core.utils.time_series_utils import WindowGenerator, TimeSeriesPredictor


class TestWindowGenerator(unittest.TestCase):
    """Test cases for WindowGenerator class"""
    
    def setUp(self):
        """Set up test data"""
        self.train_data = pd.DataFrame({
            'feature1': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            'feature2': [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
            'target': [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
        })
        
        self.val_data = pd.DataFrame({
            'feature1': [11, 12, 13, 14, 15],
            'feature2': [110, 120, 130, 140, 150],
            'target': [1100, 1200, 1300, 1400, 1500]
        })
        
        self.test_data = pd.DataFrame({
            'feature1': [16, 17, 18, 19, 20],
            'feature2': [160, 170, 180, 190, 200],
            'target': [1600, 1700, 1800, 1900, 2000]
        })

    def test_window_generator_initialization(self):
        """Test WindowGenerator initialization"""
        window_generator = WindowGenerator(
            input_width=3,
            label_width=2,
            shift=1,
            train_df=self.train_data,
            val_df=self.val_data,
            test_df=self.test_data,
            label_columns=['target']
        )
        
        self.assertEqual(window_generator.input_width, 3)
        self.assertEqual(window_generator.label_width, 2)
        self.assertEqual(window_generator.shift, 1)
        self.assertEqual(window_generator.total_window_size, 4)
        
        expected_columns = {'feature1': 0, 'feature2': 1, 'target': 2}
        self.assertEqual(window_generator.column_indices, expected_columns)
        
        expected_label_columns = {'target': 0}
        self.assertEqual(window_generator.label_columns_indices, expected_label_columns)

    def test_window_generator_without_label_columns(self):
        """Test WindowGenerator without specific label columns"""
        wg = WindowGenerator(
            input_width=3,
            label_width=2,
            shift=1,
            train_df=self.train_data,
            val_df=self.val_data,
            test_df=self.test_data,
            label_columns=None
        )
        
        self.assertIsNone(wg.label_columns)
        self.assertFalse(hasattr(wg, 'label_columns_indices'))


    def test_repr_method(self):
        """Test string representation"""
        window_generator = WindowGenerator(
            input_width=3,
            label_width=2,
            shift=1,
            train_df=self.train_data,
            val_df=self.val_data,
            test_df=self.test_data,
            label_columns=['target']
        )
        
        repr_str = repr(window_generator)
        
        self.assertIn('Total window size: 4', repr_str)
        self.assertIn('Label column name(s): [\'target\']', repr_str)


class TestTimeSeriesPredictor(unittest.TestCase):
    """Test cases for TimeSeriesPredictor class"""
    
    def setUp(self):
        """Set up test data"""
        self.predictor = TimeSeriesPredictor(max_horizon=24)

    def test_predictor_initialization(self):
        """Test TimeSeriesPredictor initialization"""
        self.assertEqual(self.predictor.max_horizon, 24)
        self.assertEqual(self.predictor.models, {})
        self.assertIsNone(self.predictor.window)
        self.assertIsNone(self.predictor.train_mean)
        self.assertIsNone(self.predictor.train_std)
        self.assertIsNone(self.predictor.column_indices)

    @patch('pandas.read_csv')
    def test_load_data_from_csv(self, mock_read_csv):
        """Test loading data from CSV"""
        mock_df = pd.DataFrame({
            'datetime_utc': ['2023-01-01 00:00:00', '2023-01-01 01:00:00', 
                           '2023-01-01 02:00:00', '2023-01-01 03:00:00', '2023-01-01 04:00:00'],
            'scheduled_demand_372': [1000, 1100, 1200, 1300, 1400],
            'daily_spot_market_600_España': [50, 55, 60, 65, 70],
            'daily_spot_market_600_Portugal': [45, 50, 55, 60, 65]
        })
        mock_read_csv.return_value = mock_df
        
        train_df, val_df, test_df, date_time = self.predictor.load_data_from_csv('dummy_path.csv')
        
        mock_read_csv.assert_called_once_with('dummy_path.csv')
        
        self.assertEqual(len(train_df), 3)
        self.assertEqual(len(val_df), 1)
        self.assertEqual(len(test_df), 1)
        
        self.assertIsNotNone(self.predictor.train_mean)
        self.assertIsNotNone(self.predictor.train_std)
        self.assertIsNotNone(self.predictor.column_indices)

    def test_load_data_from_queryset(self):
        """Test loading data from Django queryset"""
        mock_queryset = MagicMock()
        mock_queryset.values.return_value = [
            {'datetime_utc': '2023-01-01 00:00:00', 'scheduled_demand_372': 1000, 
             'daily_spot_market_600_España': 50, 'daily_spot_market_600_Portugal': 45},
            {'datetime_utc': '2023-01-01 01:00:00', 'scheduled_demand_372': 1100, 
             'daily_spot_market_600_España': 55, 'daily_spot_market_600_Portugal': 50},
            {'datetime_utc': '2023-01-01 02:00:00', 'scheduled_demand_372': 1200, 
             'daily_spot_market_600_España': 60, 'daily_spot_market_600_Portugal': 55},
            {'datetime_utc': '2023-01-01 03:00:00', 'scheduled_demand_372': 1300, 
             'daily_spot_market_600_España': 65, 'daily_spot_market_600_Portugal': 60},
            {'datetime_utc': '2023-01-01 04:00:00', 'scheduled_demand_372': 1400, 
             'daily_spot_market_600_España': 70, 'daily_spot_market_600_Portugal': 65}
        ]
        
        train_df, val_df, test_df, date_time = self.predictor.load_data_from_queryset(mock_queryset)
        
        mock_queryset.values.assert_called_once()
        
        self.assertEqual(len(train_df), 3)
        self.assertEqual(len(val_df), 1)
        self.assertEqual(len(test_df), 1)

    def test_predict_without_trained_models(self):
        """Test prediction without trained models"""
        recent_data = np.array([[1, 2, 3], [4, 5, 6]])
        
        with self.assertRaises(ValueError) as context:
            self.predictor.predict('linear', recent_data, 1)
        
        self.assertIn("Modelos no entrenados", str(context.exception))

    def test_predict_invalid_model_name(self):
        """Test prediction with invalid model name"""
        self.predictor.models = {'linear': MagicMock()}
        recent_data = np.array([[1, 2, 3], [4, 5, 6]])
        
        with self.assertRaises(ValueError) as context:
            self.predictor.predict('invalid_model', recent_data, 1)
        
        self.assertIn("no encontrado", str(context.exception))

    def test_predict_hours_ahead_validation(self):
        """Test validation of hours_ahead parameter"""
        self.predictor.models = {'linear': MagicMock()}
        recent_data = np.array([[1, 2, 3], [4, 5, 6]])
        
        # Test hours_ahead > max_horizon
        with self.assertRaises(ValueError) as context:
            self.predictor.predict('linear', recent_data, 25)
        
        self.assertIn("máximo 24 horas", str(context.exception))
        
        # Test hours_ahead < 1
        with self.assertRaises(ValueError) as context:
            self.predictor.predict('linear', recent_data, 0)
        
        self.assertIn("mayor a 0", str(context.exception))

    def test_predict_successful_prediction(self):
        """Test successful prediction"""
        mock_model = MagicMock()
        mock_prediction = np.array([[[10, 20, 30], [15, 25, 35]]])
        mock_model.predict.return_value = mock_prediction
        
        self.predictor.models = {'linear': mock_model}
        self.predictor.train_mean = pd.Series([100, 50, 45])
        self.predictor.train_std = pd.Series([10, 5, 5])
        self.predictor.column_indices = {
            'scheduled_demand_372': 0,
            'daily_spot_market_600_España': 1,
            'daily_spot_market_600_Portugal': 2
        }
        
        recent_data = np.array([[1000, 50, 45], [1100, 55, 50]])
        
        result = self.predictor.predict('linear', recent_data, 2)
        
        self.assertIn('predictions', result)
        self.assertIn('model_used', result)
        self.assertIn('hours_ahead', result)
        self.assertIn('max_available', result)
        
        self.assertEqual(result['model_used'], 'linear')
        self.assertEqual(result['hours_ahead'], 2)
        self.assertEqual(result['max_available'], 24)


if __name__ == '__main__':
    unittest.main()
