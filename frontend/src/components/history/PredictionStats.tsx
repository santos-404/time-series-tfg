import type { PredictionHistoryStats } from '@/types/PredictionHistory';

interface PredictionStatsProps {
  stats: PredictionHistoryStats;
  loading: boolean;
}

const PredictionStats = ({ stats, loading }: PredictionStatsProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getModelDisplayName = (model: string) => {
    const modelNames: Record<string, string> = {
      'linear': 'Linear',
      'dense': 'Dense NN',
      'conv': 'Conv NN',
      'lstm': 'LSTM NN'
    };
    return modelNames[model] || model;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Estadísticas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-6">Estadísticas del historial</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats.total_predictions.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Total Predicciones
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.recent_predictions_7_days}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Últimos 7 días
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {stats.average_hours_ahead}h
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Promedio horas adelante
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {Object.keys(stats.models_used).length}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Modelos utilizados
          </div>
        </div>
      </div>

      {/* Models Usage */}
      {Object.keys(stats.models_used).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uso por Modelo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.models_used).map(([model, count]) => (
              <div key={model} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {count}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {getModelDisplayName(model)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Range */}
      {stats.date_range && stats.date_range.oldest && stats.date_range.newest && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rango de Fechas</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="font-medium text-gray-700">Primera:</span>
                <span className="ml-2 text-gray-600">
                  {formatDate(stats.date_range.oldest)}
                </span>
              </div>
              <div className="text-gray-400">→</div>
              <div>
                <span className="font-medium text-gray-700">Última:</span>
                <span className="ml-2 text-gray-600">
                  {formatDate(stats.date_range.newest)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PredictionStats;
