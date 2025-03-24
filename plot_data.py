import os
import glob
import math
import pandas as pd
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt

def load_and_concat(folder_path):
    """
    Loads and concatenates CSV files in the given folder.
    Assumes each CSV has a datetime column called `datetime_col` and at least one other column.
    The first non-datetime column is used as the data column.
    """
    all_files = glob.glob(os.path.join(folder_path, '*.csv'))
    files = [f for f in all_files if f != os.path.join(folder_path, 'indicators.csv')]
    dfs = []
    datetime_col = 'datetime'
    
    for file in files:
        try:
            df = pd.read_csv(file, parse_dates=[datetime_col])
            value_cols = [col for col in df.columns if col != datetime_col]
            if value_cols:  
                df = df[[datetime_col, value_cols[0]]]
                dfs.append(df)
            else:
                print(f"Skipping {file} - no value columns found")
        except Exception as e:
            print(f"Error processing {file}: {str(e)}")
    
    if dfs:
        combined_df = pd.concat(dfs).sort_values(datetime_col)
        combined_df.set_index(datetime_col, inplace=True)
        return combined_df
    else:
        return None

def plot():
    DIRECTORIES = {
        'Peninsula Forecast': 'data/energy_demand/peninsula_forecast',
        'Scheduled Demand': 'data/energy_demand/scheduled_demand',
        'Hydraulic Generation': 'data/energy_generation/hydraulic',
        'Nuclear Generation': 'data/energy_generation/nuclear',
        'Solar Generation': 'data/energy_generation/solar',
        'Wind Generation': 'data/energy_generation/wind',
        'Average Demand Price': 'data/price/average_demand_price',
        'Daily Spot Market Price': 'data/price/daily_spot_market'
    }

    num_vars = len(DIRECTORIES)
    cols = 2
    rows = math.ceil(num_vars / cols)

    fig, axes = plt.subplots(rows, cols, figsize=(15, rows * 3), sharex=True)
    axes = axes.flatten()

    for ax, (name, folder) in zip(axes, DIRECTORIES.items()):
        df = load_and_concat(folder)
        if df is not None:
            ax.plot(df.index, df.iloc[:, 0])
            ax.set_title(name)
            ax.set_xlabel('Time')
            ax.set_ylabel('Value')
        else:
            ax.set_title(name + " (No data)")
            ax.axis('off')

    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    plot()
