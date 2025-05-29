import pandas as pd
import numpy as np
import tensorflow as tf
from typing import Optional

class WindowGenerator():
    def __init__(self, input_width, label_width, shift,
                 train_df, val_df, test_df,
                 label_columns=None):
        # Store the raw data.
        self.train_df = train_df
        self.val_df = val_df
        self.test_df = test_df

        # Work out the label column indices.
        self.label_columns = label_columns
        if label_columns is not None:
            self.label_columns_indices = {name: i for i, name in
                                          enumerate(label_columns)}
        self.column_indices = {name: i for i, name in
                               enumerate(train_df.columns)}

        # Work out the window parameters.
        self.input_width = input_width
        self.label_width = label_width
        self.shift = shift

        self.total_window_size = input_width + shift

        self.input_slice = slice(0, input_width)
        self.input_indices = np.arange(self.total_window_size)[self.input_slice]

        self.label_start = self.total_window_size - self.label_width
        self.labels_slice = slice(self.label_start, None)
        self.label_indices = np.arange(self.total_window_size)[self.labels_slice]

    def split_window(self, features):
        inputs = features[:, self.input_slice, :]
        labels = features[:, self.labels_slice, :]
        if self.label_columns is not None:
            labels = tf.stack(
                [labels[:, :, self.column_indices[name]] for name in self.label_columns],
                axis=-1)

      # Slicing doesn't preserve static shape information, so set the shapes
      # manually. This way the `tf.data.Datasets` are easier to inspect.
        inputs.set_shape([None, self.input_width, None])
        labels.set_shape([None, self.label_width, None])

        return inputs, labels

    def make_dataset(self, data):
        data = np.array(data, dtype=np.float32)
        ds = tf.keras.utils.timeseries_dataset_from_array(
            data=data,
            targets=None,
            sequence_length=self.total_window_size,
            sequence_stride=1,
            shuffle=True,
            batch_size=32,)

        ds = ds.map(self.split_window)

        return ds

    @property
    def train(self):
        return self.make_dataset(self.train_df)

    @property
    def val(self):
        return self.make_dataset(self.val_df)

    @property
    def test(self):
        return self.make_dataset(self.test_df)

    @property
    def example(self):
        """Get and cache an example batch of `inputs, labels` for plotting."""
        result = getattr(self, '_example', None)
        if result is None:
            # No example batch was found, so get one from the `.train` dataset
            result = next(iter(self.train))
            # And cache it for next time
            self._example = result
        return result

    def __repr__(self):
        return '\n'.join([
            f'Total window size: {self.total_window_size}',
            f'Input indices: {self.input_indices}',
            f'Label indices: {self.label_indices}',
            f'Label column name(s): {self.label_columns}'])


class TimeSeriesPredictor:
    def __init__(self):
        self.models = {}
        self.train_mean = None
        self.train_std = None
        self.column_indices = None
        
    def load_data_from_csv(self, csv_path: str) -> pd.DataFrame:
        """Load and preprocess data from CSV"""
        df = pd.read_csv(csv_path)
        date_time = pd.to_datetime(df.pop('datetime_utc'))
        
        # Fill missing values. I think my dataset doesn't need it though
        # It does need it XD
        df = df.ffill()

        # Split data. I'm using 60/20/20
        n = len(df)
        train_df = df[0:int(n*0.6)]
        val_df = df[int(n*0.6):int(n*0.8)]
        test_df = df[int(n*0.8):]
        
        # Normalize
        self.train_mean = train_df.mean()
        self.train_std = train_df.std()
        
        train_df = (train_df - self.train_mean) / self.train_std
        val_df = (val_df - self.train_mean) / self.train_std
        test_df = (test_df - self.train_mean) / self.train_std
        
        self.column_indices = {name: i for i, name in enumerate(df.columns)}
        
        return train_df, val_df, test_df, date_time
    
    def load_data_from_queryset(self, queryset) -> pd.DataFrame:
        """Load and preprocess data from Django queryset"""
        df = pd.DataFrame.from_records(queryset.values())
        date_time = pd.to_datetime(df.pop('datetime_utc'))
        
        # Fill missing values
        df = df.ffill()
        
        # Split data. I'm using 60/20/20
        n = len(df)
        train_df = df[0:int(n*0.6)]
        val_df = df[int(n*0.6):int(n*0.8)]
        test_df = df[int(n*0.8):]
        
        # Normalize
        self.train_mean = train_df.mean()
        self.train_std = train_df.std()
        
        train_df = (train_df - self.train_mean) / self.train_std
        val_df = (val_df - self.train_mean) / self.train_std
        test_df = (test_df - self.train_mean) / self.train_std
        
        self.column_indices = {name: i for i, name in enumerate(df.columns)}
        
        return train_df, val_df, test_df, date_time
    
    def create_models(self) -> dict[str, tf.keras.Model]:
        """Create all the models from the notebook"""
        models = {}
        
        # Linear model
        models['linear'] = tf.keras.Sequential([
            tf.keras.layers.Dense(units=1)
        ])
        
        # Dense model
        models['dense'] = tf.keras.Sequential([
            tf.keras.layers.Dense(units=64, activation='relu'),
            tf.keras.layers.Dense(units=64, activation='relu'),
            tf.keras.layers.Dense(units=1)
        ])
        
        # Conv model
        models['conv'] = tf.keras.Sequential([
            tf.keras.layers.Conv1D(filters=32, kernel_size=3, activation='relu'),
            tf.keras.layers.Dense(units=32, activation='relu'),
            tf.keras.layers.Dense(units=1),
        ])
        
        # LSTM model
        models['lstm'] = tf.keras.Sequential([
            tf.keras.layers.LSTM(32, return_sequences=True),
            tf.keras.layers.Dense(units=1)
        ])
        
        return models
        
    def compile_and_fit(self, model, window, patience=2, max_epochs=20):
        """Training function from your notebook"""
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss', patience=patience, mode='min')

        model.compile(
            loss=tf.keras.losses.MeanSquaredError(),
            optimizer=tf.keras.optimizers.Adam(),
            metrics=[tf.keras.metrics.MeanAbsoluteError()]
        )

        history = model.fit(
            window.train, 
            epochs=max_epochs,
            validation_data=window.val,
            callbacks=[early_stopping],
            verbose=0  # Silent training for web app
        )
        return history
    
    def predict(self, model_name: str, recent_data: np.ndarray, 
                hours_ahead: int = 1) -> dict:
        """Make predictions with a trained model"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")
            
        model = self.models[model_name]
        
        # Normalize input data
        normalized_data = (recent_data - self.train_mean.values) / self.train_std.values
        
        # Reshape for prediction
        input_data = normalized_data.reshape(1, -1, len(self.column_indices))
        
        # Make prediction
        prediction = model.predict(input_data, verbose=0)
        
        # Denormalize prediction
        price_col_idx = self.column_indices['daily_spot_market_600_España']
        denormalized_pred = (prediction[0, :, 0] * self.train_std.iloc[price_col_idx] + 
                           self.train_mean.iloc[price_col_idx])
        
        return {
            'predictions': denormalized_pred.tolist(),
            'model_used': model_name,
            'hours_ahead': hours_ahead
        }
    
    def train_all_models(self, train_df, val_df, test_df):
        """Train all models"""
        # Create window for single step prediction
        single_step_window = WindowGenerator(
            input_width=1, label_width=1, shift=1,
            train_df=train_df, val_df=val_df, test_df=test_df,
            label_columns=['daily_spot_market_600_España']
        )
        
        # Create window for multi-step prediction
        wide_window = WindowGenerator(
            input_width=24, label_width=24, shift=1,
            train_df=train_df, val_df=val_df, test_df=test_df,
            label_columns=['daily_spot_market_600_España']
        )
        
        models = self.create_models()
        performance = {}
        
        for name, model in models.items():
            print(f"Training {name} model...")
            
            # Use appropriate window based on model
            window = single_step_window if name in ['linear', 'dense'] else wide_window
            
            try:
                history = self.compile_and_fit(model, window)
                performance[name] = model.evaluate(window.test, verbose=0, return_dict=True)
                self.models[name] = model
                print(f"✓ {name} model trained successfully")
            except Exception as e:
                print(f"✗ Failed to train {name} model: {str(e)}")
                
        return performance

