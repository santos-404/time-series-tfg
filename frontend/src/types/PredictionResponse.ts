export interface PredictionResponse {
  predictions: number[][];
  timestamps: string[];
  model_used: string;
  input_data: {
    hours_used: number;
    start_time: string;
    end_time: string;
  };
}

