export interface TrainingResponse {
  message: string;
  performance: {
    [modelName: string]: {
      loss: number;
      mean_absolute_error: number;
    };
  };
  models_saved: string[];
  database_records: number;
  database_populated: boolean;
  population_reason?: string;
}

