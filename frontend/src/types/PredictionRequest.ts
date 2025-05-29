export interface PredictionRequest {
  model_name: 'linear' | 'dense' | 'conv' | 'lstm';
  hours_ahead: number;
  input_hours: number;
}
