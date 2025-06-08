import { useEffect, useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PredictionDetail } from '@/types/PredictionHistory';

interface PredictionDetailModalProps {
  predictionId: number;
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = 'http://127.0.0.1:7777';

const PredictionDetailModal = ({ predictionId, isOpen, onClose }: PredictionDetailModalProps) => {
  const [showContent, setShowContent] = useState(false);
  
  const { data: predictionDetail, loading, error } = useFetch<PredictionDetail>(
    isOpen ? `${API_URL}/api/v1/predictions/history/${predictionId}/` : null
  );

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      'linear': 'Linear Regression',
      'dense': 'Dense Neural Network',
      'conv': 'Convolutional Neural Network',
      'lstm': 'LSTM Neural Network'
    };
    return modelNames[model] || model;
  };

  const prepareChartData = () => {
    if (!predictionDetail?.predictions || !predictionDetail?.timestamps) return [];
    
    return predictionDetail.timestamps.map((timestamp, index) => ({
      time: formatTimestamp(timestamp),
      fullTimestamp: timestamp,
      scheduled_demand_372: predictionDetail.predictions.scheduled_demand_372?.[index] || null,
      daily_spot_market_600_España: predictionDetail.predictions.daily_spot_market_600_España?.[index] || null,
      daily_spot_market_600_Portugal: predictionDetail.predictions.daily_spot_market_600_Portugal?.[index] || null,
    }));
  };

  const chartData = prepareChartData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className={'fixed inset-0 bg-black opacity-50 transition-opacity duration-300'}
        onClick={onClose}
      />
      
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className={`relative w-full max-w-6xl bg-white rounded-xl shadow-2xl transform transition-all duration-300 ${
            showContent 
              ? 'scale-100 opacity-100 translate-y-0' 
              : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles de predicción {predictionId}
              </h2>
              {predictionDetail && (
                <p className="text-sm text-gray-600 mt-1">
                  {getModelDisplayName(predictionDetail.model_used)} • {formatDate(predictionDetail.created_at)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando detalles...</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-700">Error al cargar los detalles: {error}</p>
              </div>
            )}

            {predictionDetail && (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-800">Modelo</div>
                    <div className="text-lg font-semibold text-blue-900">
                      {getModelDisplayName(predictionDetail.model_used)}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-800">Horas adelante</div>
                    <div className="text-lg font-semibold text-green-900">
                      {predictionDetail.hours_ahead}h
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-purple-800">Horas entrada</div>
                    <div className="text-lg font-semibold text-purple-900">
                      {predictionDetail.input_hours}h
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-orange-800">Predicciones</div>
                    <div className="text-lg font-semibold text-orange-900">
                      {predictionDetail.prediction_summary?.total_predictions || 0}
                    </div>
                  </div>
                </div>

                {chartData.length > 0 && (
                  <div className="space-y-8">
                    {predictionDetail.predictions.scheduled_demand_372 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Demanda Programada (MW)
                        </h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="time" 
                                stroke="#6b7280"
                                fontSize={12}
                              />
                              <YAxis 
                                stroke="#6b7280"
                                fontSize={12}
                                tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                              />
                              <Tooltip 
                                labelFormatter={(label) => `Tiempo: ${label}`}
                                formatter={(value: number) => [`${value.toFixed(2)} MW`, 'Demanda']}
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="scheduled_demand_372" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                                name="Demanda Programada"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Spot Market Chart */}
                    {(predictionDetail.predictions.daily_spot_market_600_España || 
                      predictionDetail.predictions.daily_spot_market_600_Portugal) && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Mercado Spot (€/MWh)
                        </h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="time" 
                                stroke="#6b7280"
                                fontSize={12}
                              />
                              <YAxis 
                                stroke="#6b7280"
                                fontSize={12}
                                tickFormatter={(value) => `€${value.toFixed(1)}`}
                              />
                              <Tooltip 
                                labelFormatter={(label) => `Tiempo: ${label}`}
                                formatter={(value: number, name: string) => [
                                  `€${value.toFixed(2)}/MWh`, 
                                  name === 'daily_spot_market_600_España' ? 'España' : 'Portugal'
                                ]}
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Legend />
                              {predictionDetail.predictions.daily_spot_market_600_España && (
                                <Line 
                                  type="monotone" 
                                  dataKey="daily_spot_market_600_España" 
                                  stroke="#ef4444" 
                                  strokeWidth={3}
                                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                                  name="España"
                                />
                              )}
                              {predictionDetail.predictions.daily_spot_market_600_Portugal && (
                                <Line 
                                  type="monotone" 
                                  dataKey="daily_spot_market_600_Portugal" 
                                  stroke="#10b981" 
                                  strokeWidth={3}
                                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                                  name="Portugal"
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary Statistics */}
                {predictionDetail.prediction_summary?.labels && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Resumen estadístico
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(predictionDetail.prediction_summary.labels).map(([label, stats]) => (
                        <div key={label} className="space-y-3">
                          <h4 className="font-medium text-gray-900">
                            {label === 'scheduled_demand_372' 
                              ? 'Demanda programada' 
                              : label === 'daily_spot_market_600_España'
                              ? 'Spot España'
                              : 'Spot Portugal'
                            }
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mínimo:</span>
                              <span className="font-medium">
                                {label.includes('spot') 
                                  ? `€${stats.min.toFixed(2)}`
                                  : `${stats.min.toFixed(0)} MW`
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Máximo:</span>
                              <span className="font-medium">
                                {label.includes('spot') 
                                  ? `€${stats.max.toFixed(2)}`
                                  : `${stats.max.toFixed(0)} MW`
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Promedio:</span>
                              <span className="font-medium">
                                {label.includes('spot') 
                                  ? `€${stats.avg.toFixed(2)}`
                                  : `${stats.avg.toFixed(0)} MW`
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionDetailModal;
