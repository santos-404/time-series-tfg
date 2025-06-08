import { useState } from 'react';
import PredictionDetailModal from '@/components/history/PredictionDetailModal';
import type { PredictionHistoryItem } from '@/types/PredictionHistory';

interface PredictionListProps {
  predictions: PredictionHistoryItem[];
  loading: boolean;
  error: string | null;
}

const PredictionList = ({ predictions, loading, error }: PredictionListProps) => {
  const [selectedPrediction, setSelectedPrediction] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModelDisplayName = (model: string) => {
    const modelNames: Record<string, string> = {
      'linear': 'Linear',
      'dense': 'Dense Neural Network',
      'conv': 'Convolutional NN',
      'lstm': 'LSTM Neural Network'
    };
    return modelNames[model] || model;
  };

  const getModelBadgeColor = (model: string) => {
    const colors: Record<string, string> = {
      'linear': 'bg-blue-100 text-blue-800',
      'dense': 'bg-green-100 text-green-800',
      'conv': 'bg-purple-100 text-purple-800',
      'lstm': 'bg-orange-100 text-orange-800'
    };
    return colors[model] || 'bg-gray-100 text-gray-800';
  };

  const handleDetailsClick = (predictionId: number) => {
    setSelectedPrediction(predictionId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrediction(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Error al cargar las predicciones</p>
      </div>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay predicciones</h3>
        <p className="text-gray-500">
          No se encontraron predicciones con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {predictions.map((prediction) => (
        <div
          key={prediction.id}
          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Predicción #{prediction.id}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModelBadgeColor(prediction.model_used)}`}>
                  {getModelDisplayName(prediction.model_used)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Creada el {formatDate(prediction.created_at)}
              </p>
            </div>
            <button
              onClick={() => handleDetailsClick(prediction.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Detalles
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Fecha predicción:</span>
              <p className="text-gray-600">{prediction.prediction_date}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Horas adelante:</span>
              <p className="text-gray-600">{prediction.hours_ahead}h</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Horas entrada:</span>
              <p className="text-gray-600">{prediction.input_hours}h</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Variables:</span>
              <p className="text-gray-600">
                {Array.isArray(prediction.predictions) 
                  ? `${prediction.predictions.length} valores`
                  : typeof prediction.predictions === 'object' && prediction.predictions
                    ? Object.keys(prediction.predictions).join(', ')
                    : 'N/A'
                }
              </p>
            </div>
          </div>

          {prediction.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <span className="font-medium">Error:</span> {prediction.error}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Modal */}
      {selectedPrediction && (
        <PredictionDetailModal
          predictionId={selectedPrediction}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default PredictionList;
