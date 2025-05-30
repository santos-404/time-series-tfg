import type { TrainingResponse } from '@/types/TrainingData';
import { useState } from 'react';

// I obviously know that is not a good practice. But this is not aim to be deployed
const API_URL = 'http://127.0.0.1:7777';

const TrainModels = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResults, setTrainingResults] = useState<TrainingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [populateDatabase, setPopulateDatabase] = useState(false);

  const modelDescriptions = [
    { name: 'linear', label: 'Modelo Lineal', description: 'Regresión lineal simple para capturar relaciones básicas'},
    { name: 'dense', label: 'Red Neuronal Densa', description: 'Capas completamente conectadas para patrones complejos'},
    { name: 'conv', label: 'Red Neuronal Convolucional', description: 'Reconocimiento de patrones espaciales y temporales'},
    { name: 'lstm', label: 'Red Neuronal LSTM', description: 'Especializada en dependencias temporales a largo plazo'}
  ];

  const handleTrainModels = async () => {
    setIsTraining(true);
    setError(null);
    setTrainingResults(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/train/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          populate_database: populateDatabase
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el entrenamiento');
      }

      const data = await response.json();
      setTrainingResults(data);
      
      // Scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }, 200);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsTraining(false);
    }
  };

  const formatMetricValue = (value: number): string => {
    return value.toFixed(4);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Entrenar modelos de predicción
          </h1>
          <p className="mt-2 text-gray-600">
            Entrena todos los modelos de machine learning para predicciones del mercado eléctrico con los datos descargados.
            <a href="/download-data" className='text-blue-800'> (Pulsa aquí si todavía no has descargado los datos)</a>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Configuración del entrenamiento</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-blue-400">ℹ️</div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Información importante</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    El proceso de entrenamiento puede tardar varios minutos dependiendo del tamaño de los datos. 
                    Se entrenarán automáticamente todos los modelos disponibles: Linear, Dense, Convolutional y LSTM.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={populateDatabase}
                  onChange={(e) => setPopulateDatabase(e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Poblar base de datos desde CSV
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Marca esta opción si quieres forzar la carga de datos desde el archivo CSV a la base de datos
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={handleTrainModels}
              disabled={isTraining}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
            >
              {isTraining ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Entrenando modelos...
                </div>
              ) : (
                'Iniciar entrenamiento'
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Modelos que se entrenarán</h2>
          <p className="text-gray-600 mb-4">
            El sistema entrenará los siguientes modelos de machine learning:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelDescriptions.map((model) => (
              <div key={model.name} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <h4 className="font-medium text-gray-800">{model.label}</h4>
                </div>
                <p className="text-sm text-gray-600">{model.description}</p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-400">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error en el entrenamiento</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {trainingResults && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6 text-green-700">
              ✅ Entrenamiento completado exitosamente
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-3">Resumen del entrenamiento</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Modelos entrenados:</span>
                    <span className="font-medium">{trainingResults.models_saved.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Registros en BD:</span>
                    <span className="font-medium">{trainingResults.database_records.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">BD poblada:</span>
                    <span className="font-medium">{trainingResults.database_populated ? 'Sí' : 'No'}</span>
                  </div>
                  {trainingResults.population_reason && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Razón:</span>
                      <span className="font-medium text-xs">
                        {trainingResults.population_reason === 'empty_database' ? 'BD vacía' : 'Solicitado'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-3">Modelos guardados</h3>
                <div className="space-y-1">
                  {trainingResults.models_saved.map((modelName) => (
                    <div key={modelName} className="flex items-center text-sm text-blue-700">
                      <span className="capitalize">{modelName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Rendimiento de los modelos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Modelo</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Loss</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">MAE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(trainingResults.performance).map(([modelName, metrics]) => (
                      <tr key={modelName} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="font-medium capitalize">{modelName}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-mono text-sm">
                          {formatMetricValue(metrics.loss)}
                        </td>
                        <td className="text-right py-3 px-4 font-mono text-sm">
                          {formatMetricValue(metrics.mean_absolute_error)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                <p><strong>Loss:</strong> Función de pérdida utilizada durante el entrenamiento</p>
                <p><strong>MAE:</strong> Error Absoluto Medio - Promedio de errores absolutos</p>
              </div>
            </div>
          </div>
        )}

        {!trainingResults && !isTraining && !error && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Listo para entrenar
            </h3>
            <p className="text-gray-600">
              Configura las opciones y pulsa "Iniciar entrenamiento" para comenzar el proceso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainModels;
