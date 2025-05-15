import math
import pandas as pd
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt
import argparse

def plot_merged_data(file_path='data/merged_dataset.csv', year=None, month=None):
    """
    Plots data from the merged dataset CSV file where all data is organized in columns.
    Each column represents a different data series.
    
    Parameters:
    file_path (str): Path to the merged CSV file
    year (int, optional): If provided, only plot data for this specific year
    month (int, optional): If provided, only plot data for this specific month
    """

    COLUMN_FEATURES = {
        'hydraulic_71': 'Hydraulic Generation',
        'hydraulic_36': 'Hydraulic Generation',
        'hydraulic_1': 'Hydraulic Generation',
        'solar_14': 'Solar Generation',
        'wind_12': 'Wind Generation',
        'nuclear_39': 'Nuclear Generation',
        'nuclear_4': 'Nuclear Generation',
        'nuclear_74': 'Nuclear Generation',
        'peninsula_forecast_460': 'Peninsula Energy Demand Forecast',
        'scheduled_demand_365': 'Scheduled Demand',
        'scheduled_demand_358': 'Scheduled Demand',
        'scheduled_demand_372': 'Scheduled Demand',
        'daily_spot_market_600_España': 'Daily Spot Market Price',
        'daily_spot_market_600_Portugal': 'Daily Spot Market Price',
        'average_demand_price_573_Baleares': 'Average Demand Price',
        'average_demand_price_573_Canarias': 'Average Demand Price',
        'average_demand_price_573_Ceuta': 'Average Demand Price',
        'average_demand_price_573_Melilla': 'Average Demand Price'
    }
    
    # Here I'm joining the data of the same feature on the same plot
    FEATURES = sorted(set(COLUMN_FEATURES.values()))
    
    try:
        df = pd.read_csv(file_path, parse_dates=['datetime_utc'])
        df.set_index('datetime_utc', inplace=True)
        
        if year is not None and month is not None:
            df = df[(df.index.year == year) & (df.index.month == month)]
            date_filter_str = f"{month}/{year}"
        elif year is not None:
            df = df[df.index.year == year]
            date_filter_str = f"Year {year}"
        elif month is not None:
            df = df[df.index.month == month]
            date_filter_str = f"Month {month} (all years)"
        else:
            date_filter_str = "All data"
            
        if df.empty:
            print(f"No data available for the specified time period: {date_filter_str}")
            return
        
        num_cats = len(FEATURES)
        cols = 2
        rows = math.ceil(num_cats / cols)
        fig, axes = plt.subplots(rows, cols, figsize=(15, rows * 4), sharex=True)
        axes = axes.flatten()
        
        for i, feature in enumerate(FEATURES):
            ax = axes[i]
            
            feature_columns = [col for col, cat in COLUMN_FEATURES.items() if cat == feature and col in df.columns]
            
            for column in feature_columns:
                ax.plot(df.index, df[column], label=column)
            
            title = feature
            if year is not None or month is not None:
                title += f" ({date_filter_str})"
            ax.set_title(title)
            ax.set_xlabel('Time')
            ax.set_ylabel('Value')
            ax.legend(loc='best', fontsize='small')
            
        # Handle any empty subplots
        for j in range(i+1, len(axes)):
            axes[j].axis('off')
            
        plt.tight_layout()
        plt.show()
        
    except Exception as e:
        print(f"Error processing merged dataset: {str(e)}")

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Plot energy data from merged dataset')
    parser.add_argument('--file', type=str, default='data/merged_dataset.csv',
                        help='Path to the merged dataset CSV file')
    parser.add_argument('--year', type=int, default=None,
                        help='Filter data to a specific year (e.g., 2023)')
    parser.add_argument('--month', type=int, default=None,
                        help='Filter data to a specific month (1-12)')
    
    args = parser.parse_args()
    
    if args.month is not None and (args.month < 1 or args.month > 12):
        print("Error: Month must be between 1 and 12")
        exit(1)
        
    plot_merged_data(file_path=args.file, year=args.year, month=args.month)
