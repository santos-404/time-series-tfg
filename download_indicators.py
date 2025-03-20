import pandas as pd
import requests
import os

import html

from env import TOKEN_ESIOS


INDICATORS_ENDPOINT = 'https://api.esios.ree.es/indicators'
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
FILE_PATH = os.path.join(DATA_DIR, "indicators.csv")


def _get_indicators() -> pd.core.frame.DataFrame:
    response = requests.get(INDICATORS_ENDPOINT, headers=HEADERS).json()

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

def save_data(file_path: str) -> None:
    indicators = _get_indicators()
    indicators.to_csv(file_path, index=False)

if __name__ == "__main__":
    save_data(FILE_PATH)

