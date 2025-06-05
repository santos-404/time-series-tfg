import { useState, useEffect } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { useFetch } from '@/hooks/useFetch'; 
import type { PredictionRequest } from '@/types/PredictionData';
import type { HistoricalData } from '@/types/HistoricalData';
import ModelSelector from '@/components/predictions/ModelSelector';
import PredictionParameters from '@/components/predictions/PredictionParameters';
import InputFeatures from '@/components/predictions/InputFeatures';
import PredictionResults from '@/components/predictions/PredictionResults';
import EmptyState from '@/components/predictions/EmptyState';

// I obviously know that is not a good practice. But this is not aim to be deployed
const API_URL = 'http://127.0.0.1:7777'

const Predictions = () => {
  const [showHistorical, setShowHistorical] = useState<boolean>(true);
  const [latestDateInfo, setLatestDateInfo] = useState(null);
  const [isLoadingLatestDate, setIsLoadingLatestDate] = useState(true);
  
  const [predictionConfig, setPredictionConfig] = useState<PredictionRequest>({
    model_name: 'lstm',
    hours_ahead: 1,
    input_hours: 24,
    prediction_date: '' 
  });

  useEffect(() => {
    const fetchLatestDate = async () => {
      try {
        setIsLoadingLatestDate(true);
        const response = await fetch(`${API_URL}/api/v1/data/latest-date/`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setLatestDateInfo(data);
        
        setPredictionConfig(prev => ({
          ...prev,
          prediction_date: data.latest_date
        }));
        
      } catch (error) {
        console.error('Error fetching latest date:', error);
        // Keep the fallback date if API call fails
        setPredictionConfig(prev => ({
          ...prev,
          prediction_date: "2025-03-30"
        }));
      } finally {
        setIsLoadingLatestDate(false);
      }
    };

    fetchLatestDate();
  }, []);

  const { predictionData, loading: predictionLoading, error: predictionError, predict } = usePredictions(API_URL);
  
  // Build historical data URL with end_date parameter
  const historicalUrl = predictionConfig.prediction_date 
    ? `${API_URL}/api/v1/historical?days=7&columns=daily_spot_market_600_España&end_date=${predictionConfig.prediction_date}`
    : `${API_URL}/api/v1/historical?days=7&columns=daily_spot_market_600_España`;
  
  const { data: predictedHistoricalData, loading: historyLoading, refetch: refetchHistorical } = useFetch<HistoricalData>(historicalUrl);

  const handlePredict = async () => {
    // Use latest date as fallback if no date is selected
    const dateToUse = predictionConfig.prediction_date || latestDateInfo?.latest_date || "2025-03-30";
    
    const configWithDate = {
      ...predictionConfig,
      prediction_date: dateToUse
    };
    
    await predict(configWithDate);

    // Refetch historical data with the selected date
    if (refetchHistorical) {
      refetchHistorical();
    }

    // The point here is to scroll to the bottom of the screen. But the screen get bigger
    // when the plot is generated for the 1st time. Thats the reason behind waiting 200ms
    setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }, 200);
  };

  const handleConfigChange = (updates: Partial<PredictionRequest>) => {
    setPredictionConfig(prev => ({ ...prev, ...updates }));
  };

  const handleModelChange = (model: string) => {
    setPredictionConfig(prev => ({ ...prev, model_name: model }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Predicciones sobre el mercado eléctrico 
          </h1>
          <p className="mt-2 text-gray-600">
            Realiza predicciones con modelos ya entrenados. 
            <a href="/train-models" className='text-blue-800'> (Pulsa aquí si quieres entrenar los modelos con tus datos descargados)</a>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Configuración de la predicción</h2>
          
          {isLoadingLatestDate && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                Cargando fecha más reciente...
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ModelSelector
              selectedModel={predictionConfig.model_name}
              onModelChange={handleModelChange}
            />
            
            <PredictionParameters
              config={predictionConfig}
              onConfigChange={handleConfigChange}
              onPredict={handlePredict}
              isLoading={predictionLoading}
              error={predictionError}
              latestDateInfo={latestDateInfo} 
              isLatestDateLoading={isLoadingLatestDate}
            />
          </div>
        </div>

        <InputFeatures />

        {predictionData ? (
          <PredictionResults
            predictionData={predictionData}
            historicalData={predictedHistoricalData?.data}
            showHistorical={showHistorical}
            onToggleHistorical={setShowHistorical}
          />
        ) : !predictionLoading ? (
          <EmptyState />
        ) : null}
      </div>
    </div>
  );
};

export default Predictions;
