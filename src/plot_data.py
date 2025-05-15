import math
import pandas as pd
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt

def plot_merged_data(file_path='data/merged_dataset.csv'):
    """
    Plots data from the merged dataset CSV file where all data is organized in columns.
    Each column represents a different data series.
    """
    # Define category mappings for each column
    FEATURES_COLUMNS = {
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
    
    # Get unique categories
    FEATURES = sorted(set(FEATURES_COLUMNS.values()))
    
    try:
        # Load the merged dataset
        df = pd.read_csv(file_path, parse_dates=['datetime_utc'])
        df.set_index('datetime_utc', inplace=True)
        
        # Setup plots
        num_cats = len(FEATURES)
        cols = 2
        rows = math.ceil(num_cats / cols)
        fig, axes = plt.subplots(rows, cols, figsize=(15, rows * 4), sharex=True)
        axes = axes.flatten()
        
        # Plot each category in its own subplot
        for i, category in enumerate(FEATURES):
            ax = axes[i]
            
            # Get columns that belong to this category
            category_columns = [col for col, cat in FEATURES_COLUMNS.items() if cat == category and col in df.columns]
            
            # Plot each column in this category
            for column in category_columns:
                ax.plot(df.index, df[column], label=column)
            
            ax.set_title(category)
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
    plot_merged_data()
