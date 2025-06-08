import { useEffect, useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import PredictionFilters from '@/components/history/PredictionFilters';
import PredictionList from '@/components/history/PredictionList';
import PredictionStats from '@/components/history/PredictionStats';
import type { PredictionHistoryResponse, PredictionHistoryFilters, PredictionHistoryStats } from '@/types/PredictionHistory';

const API_URL = 'http://127.0.0.1:7777';

const PredictionHistory = () => {
  const [filters, setFilters] = useState<PredictionHistoryFilters>({
    limit: 20,
    page_size: 20
  });

  const [queryParams, setQueryParams] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    setQueryParams(params.toString());
  }, [filters]);

  const historyUrl = `${API_URL}/api/v1/predictions/history/${queryParams ? `?${queryParams}` : ''}`;
  const statsUrl = `${API_URL}/api/v1/predictions/history/stats/`;

  const { 
    data: historyData, 
    loading: historyLoading, 
    error: historyError,
    refetch: refetchHistory 
  } = useFetch<PredictionHistoryResponse>(historyUrl);

  const { 
    data: statsData, 
    loading: statsLoading 
  } = useFetch<PredictionHistoryStats>(statsUrl);

  const handleFiltersChange = (newFilters: Partial<PredictionHistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    refetchHistory();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Historial de predicciones
          </h1>
          <p className="mt-2 text-gray-600">
            Revisa todas las predicciones realizadas en la plataforma.
          </p>
        </div>

        {statsData && (
          <PredictionStats 
            stats={statsData} 
            loading={statsLoading} 
          />
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Filtros</h2>
          <PredictionFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
            loading={historyLoading}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Predicciones
              {historyData && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({historyData.returned_count} de {historyData.count} total)
                </span>
              )}
            </h2>
            <button
              onClick={handleRefresh}
              disabled={historyLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {historyLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {historyError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">Error al cargar el historial: {historyError}</p>
            </div>
          )}

          <PredictionList
            predictions={historyData?.results || []}
            loading={historyLoading}
            error={historyError}
          />
        </div>
      </div>
    </div>
  );
};

export default PredictionHistory;
