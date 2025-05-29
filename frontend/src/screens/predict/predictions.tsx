import { useState } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { useFetch } from '@/hooks/useFetch'; 
import type { PredictionRequest } from '@/types/PredictionRequest';
import type { HistoricalData } from '@/types/HistoricalData';
import PredictionChart from '@/components/predictions/PredictionChart';

// I obviously know that is not a good practice. But this is not aim to be deployed
const API_URL = 'http://127.0.0.1:7777'

const Predictions = () => {
  const [showHistorical, setShowHistorical] = useState<boolean>(true);
  const [predictionConfig, setPredictionConfig] = useState<PredictionRequest>({
    model_name: 'lstm',
    hours_ahead: 1,
    input_hours: 24
  });

  const { predictionData, loading: predictionLoading, error: predictionError, predict } = usePredictions(API_URL);
  
  const { data: predictedHistoricalData, loading: historyLoading } = useFetch<HistoricalData>(`${API_URL}/api/v1/historical?days=7&columns=daily_spot_market_600_España`);

  const modelOptions = [
    { value: 'linear', label: 'Modelo Lineal', description: 'Regresión lineal simple' },
    { value: 'dense', label: 'Red Neuronal Densa', description: 'Capas completamente conectadas' },
    { value: 'conv', label: 'Red Neuronal Convolucional', description: 'Reconocimiento de patrones' },
    { value: 'lstm', label: 'Red Neuronal LSTM', description: 'Dependencias temporales' }
  ];

  const inputFeatures = {
    'Fuentes de energía': ['hydraulic_1', 'hydraulic_36', 'solar_14', 'wind_12', 'nuclear_4', 'nuclear_39'],
    'Demanda': ['scheduled_demand_365', 'peninsula_forecast_460'],
    'Precios regionales': ['average_demand_price_573_Baleares', 'average_demand_price_573_Canarias']
  };

  const handlePredict = async () => {
    await predict(predictionConfig);
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
            <a href="/train-models" className='text-blue-800'> (Pulsa aquí si todavía no los has entrenado)</a>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Configuración de la predicción</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Selecciona el modelo</h3>
              <div className="grid grid-cols-1 gap-3">
                {modelOptions.map(option => (
                  <label key={option.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="model"
                      value={option.value}
                      checked={predictionConfig.model_name === option.value}
                      onChange={(e) => setPredictionConfig(prev => ({
                        ...prev,
                        model_name: e.target.value as any
                      }))}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Parámetros</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    Horas a predecir: {predictionConfig.hours_ahead}
                    <div className="relative group">
                      <div className="w-4 h-4 bg-blue-100 border-2 border-blue-800 rounded-full flex items-center justify-center cursor-help">
                        <span className="text-blue-800 text-xs font-bold">i</span>
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-100 border-2 border-blue-800 text-blue-800 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-10">
                        <div className="text-center">
                          <strong>Horas a predecir:</strong> Define cuántas horas en el futuro quieres que el modelo haga la predicción. Por ejemplo, si seleccionas 6 horas, el modelo predecirá el consumo energético que ocurrirá 6 horas después del momento actual.
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-800"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={predictionConfig.hours_ahead}
                    onChange={(e) => setPredictionConfig(prev => ({
                      ...prev,
                      hours_ahead: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 hora</span>
                    <span>24 horas</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    Ventana de entrada: {predictionConfig.input_hours} horas
                    <div className="relative group">
                      <div className="w-4 h-4 bg-blue-100 border-2 border-blue-800 rounded-full flex items-center justify-center cursor-help">
                        <span className="text-blue-800 text-xs font-bold">i</span>
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-100 border-2 border-blue-800 text-blue-800 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-10">
                        <div className="text-center">
                          <strong>Ventana de entrada:</strong> Especifica cuántas horas de datos históricos utilizará el modelo para hacer la predicción. Una ventana más amplia permite capturar patrones a largo plazo, mientras que una ventana más pequeña se enfoca en tendencias recientes.
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-800"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="168"
                    value={predictionConfig.input_hours}
                    onChange={(e) => setPredictionConfig(prev => ({
                      ...prev,
                      input_hours: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 hora</span>
                    <span>168 horas</span>
                  </div>
                </div>
                <button
                  onClick={handlePredict}
                  disabled={predictionLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {predictionLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generando predicción...
                    </div>
                  ) : (
                    'Generar predicción'
                  )}
                </button>
              </div>
            </div>
          </div>

          {predictionError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="text-red-400">⚠️</div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">¡Hubo un fallo en la predicción!</h3>
                  <p className="text-sm text-red-700 mt-1">{predictionError}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Variables de entrada para la predicción</h2>
          <p className="text-gray-600 mb-4">
            El modelo utiliza las siguientes variables para predecir el precio spot de electricidad:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(inputFeatures).map(([groupName, features]) => (
              <div key={groupName} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">{groupName}</h4>
                <ul className="space-y-1">
                  {features.map(feature => (
                    <li key={feature} className="text-sm text-gray-600">
                      • {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>


{predictionData && (
  <>
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Datos históricos y predicciones</h2>
        <label className="flex items-center cursor-pointer">
          <span className="mr-3 text-sm font-medium text-gray-700">
            Mostrar históricos
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={showHistorical}
              onChange={(e) => setShowHistorical(e.target.checked)}
              className="sr-only"
            />
            <div className={`block w-14 h-8 rounded-full transition-colors ${
              showHistorical ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${
                showHistorical ? 'translate-x-6' : ''
              }`}></div>
            </div>
          </div>
        </label>
      </div>
      
      <PredictionChart
        predictionData={predictionData}
        historicalData={predictedHistoricalData?.data}
        showHistorical={showHistorical}
      />
    </div>
  </>
)}

        {!predictionData && !predictionLoading && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Genera predicciones 
            </h3>
            <p className="text-gray-600">
              Configura el modelo y pulsa el botón "Generar predicción" para ver los valores predichos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictions;
