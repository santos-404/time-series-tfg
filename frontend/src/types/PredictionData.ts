export interface PredictionData {
  predictions: number[];
  timestamps: string[];
  model_used: string;
  input_data: {
    hours_used: number;
    start_time: string;
    end_time: string;
  };
}

export interface HistoricalDataPoint {
  datetime: string;
  daily_spot_market_600_España: number;
}

export interface PredictionChartProps {
  predictionData: PredictionData;
  historicalData?: HistoricalDataPoint[];
  showHistorical?: boolean;
  chartType?: 'line' | 'area';
}

