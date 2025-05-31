export interface PredictionData {
  predictions: number[];
  timestamps: string[];
  model_used: string;
  input_data: {
    hours_used: number;
    start_time: string;
    end_time: string;
    prediction_date: string;
  };
}

export interface PredictionRequest {
  model_name: 'linear' | 'dense' | 'conv' | 'lstm';
  hours_ahead: number;
  input_hours: number;
  prediction_date: string;
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

