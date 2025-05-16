# TFG – Time Series Pattern Search

## Private Repository for TFG – Time Series Pattern Search with Evolutionary Algorithms & Machine Learning

This repository contains my Final Year Project (TFG) focused on pattern search in time series using evolutionary algorithms and machine learning techniques. The project explores advanced methods for identifying meaningful patterns in sequential data, optimizing search processes, and improving predictive capabilities.

Additionally, I developed a web application to visualize and interact with the results, providing an intuitive interface for analysis and experimentation.

The web app is in Spanish, as is the language of the final report.

## Data

Check out the `data/` directory for details on the variables used.

To access and work with the data, you'll need to follow these steps:

### Prerequisites

1. You'll need an ESIOS token as described in `data/README.md`
2. Add your token to the `.env` file (use `.env.example` as a template)
3. Install dependencies:
   ```bash
   # Create and activate a virtual environment (recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows, use venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

## Usage

Once set up, you can:

1. Run the data download script:
   ```bash
   python download_data.py
   ```

2. Generate visualizations from the downloaded data

## Minimal Setup

If you only need to download the data without visualization capabilities, you can install just the core dependencies:
```bash
pip install pandas requests dotenv
```
