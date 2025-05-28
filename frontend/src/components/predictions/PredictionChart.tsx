import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';

const PredictionChart = ({ 
  predictionData, 
  historicalData = [], 
  loading = false,
  showHistorical = true,
  chartType = 'line' // 'line' or 'area'
}) => {
  // Procesar datos históricos
  const processedHistorical = React.useMemo(() => {
    if (!showHistorical || !historicalData?.length) return [];
    
    return historicalData.slice(-48).map(item => ({
      datetime: item.datetime,
      timestamp: new Date(item.datetime).getTime(),
      time: new Date(item.datetime).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      price: item.daily_spot_market_600_España || item.price,
      type: 'historical'
    }));
  }, [historicalData, showHistorical]);

  // Procesar datos de predicción
  const processedPredictions = React.useMemo(() => {
    if (!predictionData?.predictions?.length) return [];

    const baseTime = new Date(predictionData.input_data.end_time);
    
    return predictionData.predictions.map((prediction, index) => {
      const predictionTime = new Date(baseTime.getTime() + (index + 1) * 60 * 60 * 1000);
      
      return {
        datetime: predictionTime.toISOString(),
        timestamp: predictionTime.getTime(),
        time: predictionTime.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        price: prediction,
        type: 'prediction'
      };
    });
  }, [predictionData]);

  // Combinar datos
  const chartData = React.useMemo(() => {
    const combined = [...processedHistorical, ...processedPredictions];
    return combined.sort((a, b) => a.timestamp - b.timestamp);
  }, [processedHistorical, processedPredictions]);

  // Encontrar punto donde empiezan las predicciones
  const predictionStartIndex = chartData.findIndex(item => item.type === 'prediction');
  const predictionStartTime = predictionStartIndex > 0 ? chartData[predictionStartIndex]?.time : null;

  // Estadísticas de las predicciones
  const predictionStats = React.useMemo(() => {
    if (!processedPredictions.length) return null;
    
    const prices = processedPredictions.map(p => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      count: prices.length
    };
  }, [processedPredictions]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPrediction = data.type === 'prediction';
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className={`text-sm ${isPrediction ? 'text-red-600' : 'text-blue-600'}`}>
            <span className="font-medium">
              {isPrediction ? 'Predicción: ' : 'Histórico: '}
            </span>
            {payload[0].value.toFixed(2)} €/MWh
          </p>
          {isPrediction && (
            <p className="text-xs text-gray-500 mt-1">
              Predicho por modelo {predictionData?.model_used?.toUpperCase()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p className="text-gray-600">No hay datos para mostrar</p>
        </div>
      </div>
    );
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
  const DataComponent = chartType === 'area' ? Area : Line;

  return (
    <div className="space-y-4">
      {/* Estadísticas de la predicción */}
      {predictionStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">
              {predictionStats.count}
            </div>
            <div className="text-xs text-blue-800">Horas predichas</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">
              {predictionStats.min.toFixed(1)}€
            </div>
            <div className="text-xs text-green-800">Precio mínimo</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-red-600">
              {predictionStats.max.toFixed(1)}€
            </div>
            <div className="text-xs text-red-800">Precio máximo</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">
              {predictionStats.avg.toFixed(1)}€
            </div>
            <div className="text-xs text-purple-800">Precio promedio</div>
          </div>
        </div>
      )}

      {/* Gráfico principal */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Predicción de Precios - Mercado Eléctrico Español
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            {showHistorical && processedHistorical.length > 0 && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Histórico</span>
              </div>
            )}
            {processedPredictions.length > 0 && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Predicción</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent 
              data={chartData} 
              margin={{ top: 10, right: 30, left: 40, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                label={{ 
                  value: 'Precio (€/MWh)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
                tick={{ fontSize: 12 }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Datos históricos */}
              {showHistorical && processedHistorical.length > 0 && (
                <DataComponent
                  dataKey="price"
                  stroke="#3b82f6"
                  fill={chartType === 'area' ? "#3b82f620" : undefined}
                  strokeWidth={2}
                  dot={(props) => {
                    const { payload } = props;
                    return payload?.type === 'historical' ? 
                      <circle {...props} fill="#3b82f6" r={0} /> : null;
                  }}
                  connectNulls={false}
                  name="Precio Histórico"
                />
              )}

              {/* Datos de predicción */}
              {processedPredictions.length > 0 && (
                <DataComponent
                  dataKey="price"
                  stroke="#ef4444"
                  fill={chartType === 'area' ? "#ef444420" : undefined}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={(props) => {
                    const { payload } = props;
                    return payload?.type === 'prediction' ? 
                      <circle {...props} fill="#ef4444" r={3} /> : null;
                  }}
                  connectNulls={false}
                  name="Precio Predicho"
                />
              )}
              
              {/* Línea de referencia para inicio de predicción */}
              {predictionStartTime && (
                <ReferenceLine 
                  x={predictionStartTime}
                  stroke="#6b7280" 
                  strokeDasharray="3 3"
                  label={{ 
                    value: "Inicio predicción", 
                    position: "topLeft",
                    style: { fontSize: '12px', fill: '#6b7280' }
                  }}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>

        {/* Información adicional */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Modelo utilizado:</strong> {predictionData?.model_used?.toUpperCase() || 'N/A'}
            </div>
            <div>
              <strong>Ventana de entrada:</strong> {predictionData?.input_data?.hours_used || 0} horas
            </div>
            <div>
              <strong>Período histórico:</strong> {predictionData?.input_data?.start_time ? 
                new Date(predictionData.input_data.start_time).toLocaleString('es-ES') : 'N/A'
              }
            </div>
            <div>
              <strong>Fin del histórico:</strong> {predictionData?.input_data?.end_time ? 
                new Date(predictionData.input_data.end_time).toLocaleString('es-ES') : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionChart;
