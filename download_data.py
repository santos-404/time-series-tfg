import pandas as pd
import requests
import os
from datetime import datetime, timedelta

import html

from env import TOKEN_ESIOS


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
                   )
           



def get_data_by_id_year(indicator_id: int, year: int) -> pd.DataFrame:
    """Get data for a specific indicator by ID for a given year."""

    # If the year selected is the current one it must go til today; not 31 Dec.
    # I'm currently saving 5 full years and the current one.
    start_date = datetime(year, 1, 1).strftime('%Y-%m-%d')
    if year == datetime.today().year:
        end_date = datetime.today().strftime('%Y-%m-%d')
    else:
        end_date = datetime(year, 12, 31).strftime('%Y-%m-%d')

    endpoint = (f"{BASE_ENDPOINT}/{indicator_id}?start_date={start_date}T00:00&end_date={end_date}T23:59&time_trunc=day")
    response = requests.get(endpoint, headers=HEADERS).json()
    return pd.json_normalize(data=response['indicator'], errors='ignore')

def save_data(data: pd.DataFrame, file_path: str) -> None:
    """Save DataFrame to CSV file."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    data.to_csv(file_path, index=False)

def main() -> None:
    """Main function to orchestrate data downloading."""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    if input("Do you want to download and save the indicators? [y/N] ").lower() == 'y':
        indicators = get_indicators()
        file_path = os.path.join(DATA_DIR, "indicators.csv")
        save_data(indicators, file_path)
 
    five_years_ago = datetime.today() - timedelta(days=5*365)
    start_year = five_years_ago.year
    current_year = datetime.today().year

    for category, indicator_ids in DATA_TO_DOWNLOAD.items():
        category_dir_name = os.path.join(DATA_DIR, category)
        os.makedirs(category_dir_name, exist_ok=True)
        for indicator_id in indicator_ids:
            if input(f"Do you want to download indicator {indicator_id} for {category}? [y/N] ").lower() == 'y':
                for year in range(start_year, current_year + 1):
                    print(f"Downloading indicator {indicator_id} for {category} for year {year}...")

                    data = get_data_by_id_year(indicator_id, year)
                    file_path_name = os.path.join(category_dir_name, f"{indicator_id}_{year}.csv")

                    save_data(data, file_path_name)
            

if __name__ == "__main__":
    main()
