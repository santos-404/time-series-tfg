import pandas as pd
import requests
import os

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


def get_indicators() -> pd.core.frame.DataFrame:
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
           )


def get_data_by_id(indicator_id: int):
    """Get data for a specific indicator by ID."""
    endpoint = f"{BASE_ENDPOINT}/{indicator_id}"
    response = requests.get(endpoint, headers=HEADERS).json()
    return pd.json_normalize(data=response['indicator'], errors='ignore') 

def save_data(data: pd.DataFrame, file_path: str) -> None:
    """Save DataFrame to CSV file."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    data.to_csv(file_path, index=False)

def main():
    """Main function to orchestrate data downloading."""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    if input("Do you want to download and save the indicators? [y/N] ").lower() == 'y':
        indicators = get_indicators()
        file_path = os.path.join(DATA_DIR, "indicators.csv")
        save_data(indicators, file_path)
 
    for category, indicator_ids in DATA_TO_DOWNLOAD.items():
        category_dir_name = os.path.join(DATA_DIR, category)
        os.makedirs(category_dir_name, exist_ok=True)

        for indicator_id in indicator_ids:
            print(f"Downloading indicator {indicator_id} for {category}...")
            data = get_data_by_id(indicator_id)
            file_path_name = os.path.join(category_dir_name, f"{indicator_id}.csv")
            save_data(data, file_path_name) 
            

if __name__ == "__main__":
    main()
