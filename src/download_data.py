import pandas as pd
import requests
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

import html

# from env import TOKEN_ESIOS

load_dotenv()
TOKEN_ESIOS = os.getenv("TOKEN_ESIOS")

BASE_ENDPOINT = 'https://api.esios.ree.es/indicators'
HEADERS = {'Accept': 'application/json; application/vnd.esios-api-v2+json',
           'Content-Type': 'application/json',
           'Host': 'api.esios.ree.es',
           'Cookie': '',
           'Authorization': f'Token token={TOKEN_ESIOS}',
           'x-api-key': f'{TOKEN_ESIOS}',
           'Cache-Control': 'no-cache',
           'Pragma': 'no-cache'
           }

DATA_DIR = os.path.join("data")

# The format of this dicc is: path -> [ids]
# Price vars are the variables to predict
DATA_TO_DOWNLOAD = {
        "energy_generation/hydraulic" : [1, 36, 71],
        "energy_generation/nuclear" : [4, 39, 74],
        "energy_generation/wind" : [12],
        "energy_generation/solar" : [14],
        "energy_demand/peninsula_forecast": [460],
        "energy_demand/scheduled_demand": [358, 365, 372],
        "price/daily_spot_market": [600],
        "price/average_demand_price": [573]
        }

def get_indicators() -> pd.DataFrame:
    """Get all available indicators from the API."""
    response = requests.get(BASE_ENDPOINT, headers=HEADERS).json()

    return (pd
            .json_normalize(data=response['indicators'], errors='ignore')
            .assign(description = lambda df_: df_.apply(lambda df__: html.unescape(df__['description']
                                                            .replace('<p>','')
                                                            .replace('</p>','')
                                                            .replace('<b>','')
                                                            .replace('</b>',''))
                                                        # Gotta add this cuz sometimes i was tryn to .replace a float var
                                                        # I've just noticed that html.unescape() also expect only strings (solved too)
                                                        if isinstance(df__['description'], str) else df__['description'],
                                                  axis=1)
                   ))
           



def get_data_by_id_month(indicator_id: int, year: int, month: int) -> pd.DataFrame:
    """Get data for a specific indicator by ID for a given month."""
    start_date = datetime(year, month, 1)
    
    # If it's the current year and month, use today as the end date
    if year == datetime.today().year and month == datetime.today().month:
        end_date = datetime.today()
    else:
        # Otherwise, use the last day of the month. We use the -1day cuz is the easiest way to
        # know the last day of each mont dynamically
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)

    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')

    endpoint = (f"{BASE_ENDPOINT}/{indicator_id}?start_date={start_date_str}T00:00&end_date={end_date_str}T23:59&time_trunc=five_minutes")
    response = requests.get(endpoint, headers=HEADERS).json()

    return pd.json_normalize(data=response['indicator'], record_path='values', errors='ignore')


def save_or_append_data(data: pd.DataFrame, file_path: str) -> None:
    """Save or append DataFrame to CSV file."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    data.to_csv(file_path, index=False)


def main() -> None:
    """Main function to orchestrate data downloading."""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    if input("Do you want to download and save the indicators? [y/N] ").lower() == 'y':
        indicators = get_indicators()
        file_path = os.path.join(DATA_DIR, "indicators.csv")
        save_or_append_data(indicators, file_path)
 
    five_years_ago = datetime.today() - timedelta(days=5*365)
    start_year = five_years_ago.year
    current_year = datetime.today().year

    for category, indicator_ids in DATA_TO_DOWNLOAD.items():
        category_dir_name = os.path.join(DATA_DIR, category)
        os.makedirs(category_dir_name, exist_ok=True)
        for indicator_id in indicator_ids:
            if input(f"Do you want to download indicator {indicator_id} for {category}? [y/N] ").lower() == 'y':
                for year in range(start_year, current_year + 1):
                    yearly_data = []
                    for month in range(1, 13):
                        # Skip future months for the current year
                        if year == current_year and month > datetime.today().month:
                            break
                        
                        print(f"Downloading indicator {indicator_id} for {category} for {year}-{month:02d}...")
                        try:
                            monthly_data = get_data_by_id_month(indicator_id, year, month)
                            
                            # If data is not empty, add to yearly data
                            if not monthly_data.empty:
                                yearly_data.append(monthly_data)
                        except Exception as e:
                            print(f"Error downloading data for {year}-{month:02d}: {e}")
                    
                    # Combine monthly data for the year
                    if yearly_data:
                        combined_yearly_data = pd.concat(yearly_data, ignore_index=True)
                        file_path_name = os.path.join(category_dir_name, f"{indicator_id}_{year}.csv")
                        save_or_append_data(combined_yearly_data, file_path_name)

if __name__ == "__main__":
    print(TOKEN_ESIOS)
    # main()
