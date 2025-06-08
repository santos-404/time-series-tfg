import { useState } from 'react';
import type { PredictionHistoryFilters } from '@/types/PredictionHistory';

interface PredictionFiltersProps {
  filters: PredictionHistoryFilters;
  onFiltersChange: (filters: Partial<PredictionHistoryFilters>) => void;
  onRefresh: () => void;
  loading: boolean;
}

const PredictionFilters = ({ filters, onFiltersChange, onRefresh, loading }: PredictionFiltersProps) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleInputChange = (key: keyof PredictionHistoryFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: PredictionHistoryFilters = {
      limit: 20,
      page_size: 20
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modelo
          </label>
          <select
            value={localFilters.model_used || ''}
            onChange={(e) => handleInputChange('model_used', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los modelos</option>
            <option value="linear">Linear</option>
            <option value="dense">Dense</option>
            <option value="conv">Conv</option>
            <option value="lstm">LSTM</option>
          </select>
        </div>

        {/* Hours Ahead Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horas adelante
          </label>
          <input
            type="number"
            value={localFilters.hours_ahead || ''}
            onChange={(e) => handleInputChange('hours_ahead', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="ej: 24"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date From Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desde fecha
          </label>
          <input
            type="date"
            value={localFilters.date_from || ''}
            onChange={(e) => handleInputChange('date_from', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date To Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hasta fecha
          </label>
          <input
            type="date"
            value={localFilters.date_to || ''}
            onChange={(e) => handleInputChange('date_to', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Prediction Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de predicción
          </label>
          <input
            type="date"
            value={localFilters.prediction_date || ''}
            onChange={(e) => handleInputChange('prediction_date', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Limit Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Límite de resultados
          </label>
          <select
            value={localFilters.limit || 20}
            onChange={(e) => handleInputChange('limit', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Empty space for alignment */}
        <div></div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleApplyFilters}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Aplicando...' : 'Aplicar Filtros'}
        </button>
        <button
          onClick={handleClearFilters}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
};

export default PredictionFilters;
