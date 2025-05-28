import type { PredictionRequest } from '@/types/PredictionRequest';
import type { PredictionResponse } from '@/types/PredictionResponse';
import { useState, useCallback } from 'react';

interface UsePredictionsReturn {
  predictionData: PredictionResponse | null;
  loading: boolean;
  error: string | null;
  predict: (config: PredictionRequest) => Promise<void>;
  clearPrediction: () => void;
  clearError: () => void;
}

export const usePredictions = (baseUrl: string): UsePredictionsReturn => {
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(async (config: PredictionRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/v1/predict/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Prediction failed`);
      }
      
      const data = await response.json();
      setPredictionData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setPredictionData(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const clearPrediction = useCallback(() => {
    setPredictionData(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    predictionData,
    loading,
    error,
    predict,
    clearPrediction,
    clearError
  };
};

// Additional hook for training models (one-time setup)
interface TrainingResponse {
  message: string;
  performance: Record<string, any>;
  models_saved: string[];
  database_records: number;
  database_populated: boolean;
  population_reason?: string;
}

interface UseModelTrainingReturn {
  trainingData: TrainingResponse | null;
  loading: boolean;
  error: string | null;
  trainModels: (populateDatabase?: boolean) => Promise<void>;
  clearTraining: () => void;
}

export const useModelTraining = (baseUrl: string): UseModelTrainingReturn => {
  const [trainingData, setTrainingData] = useState<TrainingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trainModels = useCallback(async (populateDatabase = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/v1/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ populate_database: populateDatabase })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Training failed`);
      }
      
      const data = await response.json();
      setTrainingData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setTrainingData(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const clearTraining = useCallback(() => {
    setTrainingData(null);
    setError(null);
  }, []);

  return {
    trainingData,
    loading,
    error,
    trainModels,
    clearTraining
  };
};
