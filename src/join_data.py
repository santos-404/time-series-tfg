import os
import pandas as pd
from collections import defaultdict

DATA_DIR = "data"  

def get_data_id(path):
    parts = path.replace("\\", "/").split("/")
    if len(parts) < 2:
        return None
    category = parts[-2]
    filename = os.path.splitext(parts[-1])[0]  
    sensor_id = filename.split("_")[0] 
    return f"{category}_{sensor_id}"


def main():
    data = defaultdict(list)

    for root, _, files in os.walk(DATA_DIR):
        for file in files:
            path = os.path.join(root, file)
            if not file.endswith(".csv") or os.path.dirname(path) == DATA_DIR:
                continue

            data_id = get_data_id(path)

            try:
                df = pd.read_csv(path)

                df = df[['datetime_utc', 'value']]
                df['datetime_utc'] = pd.to_datetime(df['datetime_utc'], utc=True)
                data[data_id].append(df)
            except Exception as e:
                print(f"Error leyendo {path}: {e}")

    all_dfs = []

    for data_id, dfs in data.items():
        combined = pd.concat(dfs)
        combined = combined.sort_values("datetime_utc").drop_duplicates("datetime_utc")
        combined.rename(columns={'value': data_id}, inplace=True)
        all_dfs.append(combined)

    merged_df = None
    for df in all_dfs:
        if merged_df is None:
            merged_df = df
        else:
            merged_df = pd.merge(merged_df, df, on="datetime_utc", how="outer")

    # merged_df.sort_values("datetime", inplace=True)
    file_name = os.path.join(DATA_DIR, "merged_dataset.csv")
    merged_df.to_csv(file_name, index=False)
    print(f"File joined correctly on {file_name}")

if __name__ == "__main__":
    main()
