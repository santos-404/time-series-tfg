#!/usr/bin/env python3
"""
Hyperparameter tuning script for dense model 
This script performs hyperparameter optimization using grid search and random search techniques.
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import ParameterGrid
import itertools
import json
import os
from datetime import datetime
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

CSV_PATH = "data/merged_dataset.csv"
MAX_HORIZON = 24
OUTPUT_DIR = "experimental_results/dense_hyperparameter_results"
TUNING_METHOD = 'grid'  
N_ITERATIONS = 50  
MAX_COMBINATIONS = 30  
MAX_EPOCHS = 50  
EARLY_STOPPING_PATIENCE = 5  
RANDOM_SEED = 42  

UNITS1_OPTIONS = [32, 64, 128, 256]
UNITS2_OPTIONS = [16, 32, 64, 128]
DROPOUT_RATE_OPTIONS = [0.0, 0.1, 0.2, 0.3]
ACTIVATION_OPTIONS = ['relu', 'tanh', 'elu']
LEARNING_RATE_OPTIONS = [0.001, 0.01, 0.1]
BATCH_SIZE_OPTIONS = [16, 32, 64]

INPUT_WIDTH = 24
LABEL_WIDTH = MAX_HORIZON
SHIFT = 1
LABEL_COLUMNS = ['scheduled_demand_372', 'daily_spot_market_600_España', 'daily_spot_market_600_Portugal']
NUM_FEATURES = 3

import sys
import os
NOTEBOOK_DIR = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
PROJECT_PATH = os.path.abspath(os.path.join(NOTEBOOK_DIR, '..'))
sys.path.append(PROJECT_PATH)
from core.utils.time_series_utils import WindowGenerator, TimeSeriesPredictor

class DenseHyperparameterTuner:
    def __init__(self, csv_path: str = CSV_PATH, max_horizon: int = MAX_HORIZON, output_dir: str = OUTPUT_DIR):
        """
        Initialize the hyperparameter tuner for Dense models
        
        Args:
            csv_path: Path to the CSV file
            max_horizon: Maximum prediction horizon
            output_dir: Directory to save results
        """
        self.csv_path = csv_path
        self.max_horizon = max_horizon
        self.output_dir = output_dir
        self.predictor = TimeSeriesPredictor(max_horizon=max_horizon)
        self.results = []
        self.best_params = None
        self.best_score = float('inf')
        
        os.makedirs(self.output_dir, exist_ok=True)
        
        self._load_data()
        
    def _load_data(self):
        """Load and preprocess the data"""
        print("Loading and preprocessing data...")
        self.train_df, self.val_df, self.test_df, self.date_time = self.predictor.load_data_from_csv(self.csv_path)
        print(f"Data loaded: Train={len(self.train_df)}, Val={len(self.val_df)}, Test={len(self.test_df)}")
        
    def define_search_space(self) -> Dict:
        """Define hyperparameter search space for Dense model"""
        
        search_space = {
            'units1': UNITS1_OPTIONS,
            'units2': UNITS2_OPTIONS,
            'dropout_rate': DROPOUT_RATE_OPTIONS,
            'activation': ACTIVATION_OPTIONS,
            'learning_rate': LEARNING_RATE_OPTIONS,
            'batch_size': BATCH_SIZE_OPTIONS
        }
        
        return search_space
    
    def create_model_with_params(self, params: Dict) -> tf.keras.Model:
        """Create a Dense model with specific hyperparameters"""
        
        model = tf.keras.Sequential([
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(units=params['units1'], activation=params['activation']),
            tf.keras.layers.Dropout(params['dropout_rate']),
            tf.keras.layers.Dense(units=params['units2'], activation=params['activation']),
            tf.keras.layers.Dropout(params['dropout_rate']),
            tf.keras.layers.Dense(units=self.max_horizon * NUM_FEATURES),
            tf.keras.layers.Reshape((self.max_horizon, NUM_FEATURES))
        ])
        
        return model
    
    def create_window_with_params(self, batch_size: int) -> WindowGenerator:
        """Create a window generator with specific batch size"""
        
        class CustomWindowGenerator(WindowGenerator):
            def __init__(self, *args, batch_size=32, **kwargs):
                super().__init__(*args, **kwargs)
                self.batch_size = batch_size
                
            def make_dataset(self, data):
                data = np.array(data, dtype=np.float32)
                ds = tf.keras.utils.timeseries_dataset_from_array(
                    data=data,
                    targets=None,
                    sequence_length=self.total_window_size,
                    sequence_stride=1,
                    shuffle=True,
                    batch_size=self.batch_size,
                )
                ds = ds.map(self.split_window)
                return ds
        
        return CustomWindowGenerator(
            input_width=INPUT_WIDTH,
            label_width=LABEL_WIDTH,
            shift=SHIFT,
            train_df=self.train_df,
            val_df=self.val_df,
            test_df=self.test_df,
            label_columns=LABEL_COLUMNS,
            batch_size=batch_size
        )
    
    def train_and_evaluate(self, params: Dict, max_epochs: int = MAX_EPOCHS) -> float:
        """Train a model with given parameters and return validation loss"""
        
        try:
            model = self.create_model_with_params(params)
            window = self.create_window_with_params(params.get('batch_size', 32))
            
            optimizer = tf.keras.optimizers.Adam(learning_rate=params['learning_rate'])
            model.compile(
                loss=tf.keras.losses.MeanSquaredError(),
                optimizer=optimizer,
                metrics=[tf.keras.metrics.MeanAbsoluteError()]
            )
            
            early_stopping = tf.keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=EARLY_STOPPING_PATIENCE,
                mode='min',
                restore_best_weights=True
            )
            
            history = model.fit(
                window.train,
                epochs=max_epochs,
                validation_data=window.val,
                callbacks=[early_stopping],
                verbose=0
            )
            
            val_loss = min(history.history['val_loss'])
            
            del model
            tf.keras.backend.clear_session()
            
            return val_loss
            
        except Exception as e:
            print(f"Error training model with params {params}: {str(e)}")
            return float('inf')
    
    def grid_search(self, max_combinations: int = MAX_COMBINATIONS) -> Tuple[Dict, float]:
        """Perform grid search for Dense model"""
        
        print(f"\nStarting grid search for Dense model...")
        search_space = self.define_search_space()
        
        param_names = list(search_space.keys())
        param_values = list(search_space.values())
        all_combinations = list(itertools.product(*param_values))
        
        if len(all_combinations) > max_combinations:
            print(f"Too many combinations ({len(all_combinations)}), sampling {max_combinations} random combinations...")
            np.random.shuffle(all_combinations)
            all_combinations = all_combinations[:max_combinations]
        
        best_params = None
        best_score = float('inf')
        results = []
        
        print(f"Testing {len(all_combinations)} parameter combinations...")
        
        for i, combination in enumerate(all_combinations):
            params = dict(zip(param_names, combination))
            
            print(f"  [{i+1}/{len(all_combinations)}] Testing: {params}")
            
            score = self.train_and_evaluate(params)
            results.append({
                'params': params.copy(),
                'val_loss': score,
                'timestamp': datetime.now().isoformat()
            })
            
            if score < best_score:
                best_score = score
                best_params = params.copy()
                print(f"    ✓ New best score: {best_score:.6f}")
            else:
                print(f"    Score: {score:.6f}")
        
        return best_params, best_score, results
    
    def random_search(self, n_iterations: int = N_ITERATIONS) -> Tuple[Dict, float]:
        """Perform random search for Dense model"""
        
        print(f"\nStarting random search for Dense model...")
        search_space = self.define_search_space()
        
        best_params = None
        best_score = float('inf')
        results = []
        
        for i in range(n_iterations):
            params = {}
            for param_name, param_values in search_space.items():
                params[param_name] = np.random.choice(param_values)
            
            print(f"  [{i+1}/{n_iterations}] Testing: {params}")
            
            score = self.train_and_evaluate(params)
            results.append({
                'params': params.copy(),
                'val_loss': score,
                'timestamp': datetime.now().isoformat()
            })
            
            if score < best_score:
                best_score = score
                best_params = params.copy()
                print(f"    ✓ New best score: {best_score:.6f}")
            else:
                print(f"    Score: {score:.6f}")
        
        return best_params, best_score, results
    
    def tune_hyperparameters(self, method: str = TUNING_METHOD, n_iterations: int = N_ITERATIONS, max_combinations: int = MAX_COMBINATIONS):
        """Tune hyperparameters for Dense model"""
        
        print(f"\n{'='*60}")
        print(f"Tuning DENSE model")
        print(f"{'='*60}")
        
        if method == 'grid':
            best_params, best_score, results = self.grid_search(max_combinations)
        elif method == 'random':
            best_params, best_score, results = self.random_search(n_iterations)
        else:
            raise ValueError("Method must be 'grid' or 'random'")
        
        self.best_params = best_params
        self.best_score = best_score
        self.results = results
        
        self.save_results()
        
        print(f"\nBest parameters for Dense model:")
        for param, value in best_params.items():
            print(f"  {param}: {value}")
        print(f"Best validation loss: {best_score:.6f}")
        
        return best_params, best_score
    
    def _convert_to_json_serializable(self, obj):
        """Convert numpy types to native Python types for JSON serialization"""
        if isinstance(obj, dict):
            return {key: self._convert_to_json_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_to_json_serializable(item) for item in obj]
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return obj
    
    def save_results(self):
        """Save tuning results to files"""
        
        serializable_best_params = self._convert_to_json_serializable(self.best_params)
        serializable_results = self._convert_to_json_serializable(self.results)
        
        with open(os.path.join(self.output_dir, 'best_parameters.json'), 'w') as f:
            json.dump(serializable_best_params, f, indent=2)
        
        with open(os.path.join(self.output_dir, 'best_score.json'), 'w') as f:
            json.dump({'best_validation_loss': float(self.best_score)}, f, indent=2)
        
        with open(os.path.join(self.output_dir, 'detailed_results.json'), 'w') as f:
            json.dump(serializable_results, f, indent=2)
        
        self._create_summary_report()
        
        print(f"✓ Results saved to {self.output_dir}/")
    
    def _create_summary_report(self):
        """Create a summary report"""
        
        report_path = os.path.join(self.output_dir, 'summary_report.txt')
        
        with open(report_path, 'w') as f:
            f.write("DENSE MODEL HYPERPARAMETER TUNING SUMMARY REPORT\n")
            f.write("=" * 50 + "\n")
            f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Dataset: {self.csv_path}\n")
            f.write(f"Max horizon: {self.max_horizon}\n")
            f.write(f"Total experiments: {len(self.results)}\n\n")
            
            f.write(f"BEST VALIDATION LOSS: {self.best_score:.6f}\n\n")
            
            f.write(f"BEST PARAMETERS:\n")
            f.write("-" * 30 + "\n")
            for param, value in self.best_params.items():
                f.write(f"  {param:20}: {value}\n")
            
            f.write(f"\nTOP 5 RESULTS:\n")
            f.write("-" * 30 + "\n")
            sorted_results = sorted(self.results, key=lambda x: x['val_loss'])[:5]
            for i, result in enumerate(sorted_results, 1):
                f.write(f"{i}. Val Loss: {result['val_loss']:.6f}\n")
                f.write(f"   Parameters: {result['params']}\n\n")
    
    def get_best_model_config(self) -> Dict:
        """Get the best configuration for the Dense model"""
        if self.best_params is None:
            raise ValueError("No tuning results available. Run tune_hyperparameters() first.")
        
        return {
            'model_type': 'dense',
            'parameters': self.best_params,
            'validation_loss': self.best_score
        }


def main():
    """Main function to run hyperparameter tuning for Dense model"""
    
    print("Dense Model Hyperparameter Tuning")
    print("=" * 50)
    
    tuner = DenseHyperparameterTuner(
        csv_path=CSV_PATH,
        max_horizon=MAX_HORIZON,
        output_dir=OUTPUT_DIR
    )
    
    best_params, best_score = tuner.tune_hyperparameters(
        method=TUNING_METHOD,
        n_iterations=N_ITERATIONS,
        max_combinations=MAX_COMBINATIONS
    )
    
    print("\n" + "=" * 60)
    print("HYPERPARAMETER TUNING COMPLETED")
    print("=" * 60)
    
    print(f"\nBest Dense model validation loss: {best_score:.6f}")
    print(f"Results saved in: {tuner.output_dir}")
    
    return tuner


if __name__ == "__main__":
    np.random.seed(RANDOM_SEED)
    tf.random.set_seed(RANDOM_SEED)
    
    tuner = main()