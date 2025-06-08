export interface PredictionHistoryItem {
  id: number;
  model_used: string;
  hours_ahead: number;
  input_hours: number;
  prediction_date: string;
  predictions: any[] | Record<string, any> | null;
  error: string | null;
  created_at: string;
}

export interface PredictionHistoryResponse {
  count: number;
  results: PredictionHistoryItem[];
  filters_applied: PredictionHistoryFilters;
  returned_count: number;
}

export interface PredictionHistoryFilters {
  model_used?: string;
  date_from?: string;
  date_to?: string;
  prediction_date?: string;
  hours_ahead?: number;
  limit?: number;
  page_size?: number;
}

export interface PredictionHistoryStats {
  total_predictions: number;
  models_used: Record<string, number>;
  date_range: {
    oldest: string;
    newest: string;
  } | null;
  average_hours_ahead: number;
  recent_predictions_7_days: number;
  prediction_formats: {
    legacy_list: number;
    multi_label: number;
    unknown: number;
  };
}
