import type { PredictionChartProps } from '@/types/PredictionData';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const PredictionChart: React.FC<PredictionChartProps> = ({
  predictionData,
  historicalData = [],
  showHistorical = true,
}) => {

  const chartData = React.useMemo(() => {
    const data: Array<{
      timestamp: string;
      time: string;
      historical?: number;
      predicted?: number;
      isPrediction: boolean;
    }> = [];

    if (showHistorical && historicalData.length > 0) {
      historicalData.forEach(point => {
        const date = new Date(point.datetime);
        data.push({
          timestamp: point.datetime,
          time: date.toLocaleString('es-ES', { 
            month: 'short', 
            day: '2-digit', 
            hour: '2-digit',
            minute: '2-digit'
          }),
          historical: point.daily_spot_market_600_España,
          isPrediction: false
        });
      });
    }

    predictionData.predictions.forEach((prediction, index) => {
      const timestamp = predictionData.timestamps[index];
      const date = new Date(timestamp);
      data.push({
        timestamp,
        time: date.toLocaleString('es-ES', { 
          month: 'short', 
          day: '2-digit', 
          hour: '2-digit',
          minute: '2-digit'
        }),
        predicted: prediction,
        isPrediction: true
      });
    });

    return data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [predictionData, historicalData, showHistorical]);

  const predictionStartIndex = chartData.findIndex(point => point.isPrediction);
  const predictionStartTime = predictionStartIndex > 0 ? chartData[predictionStartIndex].timestamp : null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isHistorical = data.historical !== undefined;
      const isPredicted = data.predicted !== undefined;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {isHistorical && (
            <p className="text-blue-600">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Histórico: {data.historical.toFixed(2)} €/MWh
            </p>
          )}
          {isPredicted && (
            <p className="text-orange-600">
              <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
              Predicción: {data.predicted.toFixed(2)} €/MWh
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const stats = React.useMemo(() => {
    const predictions = predictionData.predictions;
    const maxPredicted = Math.max(...predictions);
    const minPredicted = Math.min(...predictions);
    const avgPredicted = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    
    let maxHistorical = 0;
    let minHistorical = 0;
    let avgHistorical = 0;
    
    if (historicalData.length > 0) {
      const historicalValues = historicalData.map(d => d.daily_spot_market_600_España);
      maxHistorical = Math.max(...historicalValues);
      minHistorical = Math.min(...historicalValues);
      avgHistorical = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
    }
    
    return {
      predicted: { max: maxPredicted, min: minPredicted, avg: avgPredicted },
      historical: { max: maxHistorical, min: minHistorical, avg: avgHistorical }
    };
  }, [predictionData, historicalData]);

  return (
    <div className="space-y-6">
      {/* Model Info */}
      <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-4 rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-800">
              Modelo: <span className="text-blue-600">{predictionData.model_used.toUpperCase()}</span>
            </h3>
            <p className="text-sm text-gray-600">
              Ventana de entrada: {predictionData.input_data.hours_used} horas | 
              Predicciones: {predictionData.predictions.length} horas
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span className="text-sm text-gray-700">Datos históricos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-orange-500"></div>
              <span className="text-sm text-gray-700">Predicciones</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              stroke="#666"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              label={{ value: 'Precio (€/MWh)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Reference line to separate historical from predictions */}
            {predictionStartTime && (
              <ReferenceLine 
                x={new Date(predictionStartTime).toLocaleString('es-ES', { 
                  month: 'short', 
                  day: '2-digit', 
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                stroke="#666" 
                strokeDasharray="5 5" 
                label={{ value: "Inicio predicciones", position: "topRight" }}
              />
            )}
            
            {showHistorical && (
              <Line
                type="monotone"
                dataKey="historical"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Datos históricos"
                connectNulls={false}
              />
            )}
            
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#f97316"
              strokeWidth={3}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              name="Predicciones"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showHistorical && historicalData.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Estadísticas Históricas
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Máximo:</span>
                <span className="font-medium">{stats.historical.max.toFixed(2)} €/MWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mínimo:</span>
                <span className="font-medium">{stats.historical.min.toFixed(2)} €/MWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Promedio:</span>
                <span className="font-medium">{stats.historical.avg.toFixed(2)} €/MWh</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            Estadísticas Predicciones
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Máximo:</span>
              <span className="font-medium">{stats.predicted.max.toFixed(2)} €/MWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mínimo:</span>
              <span className="font-medium">{stats.predicted.min.toFixed(2)} €/MWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Promedio:</span>
              <span className="font-medium">{stats.predicted.avg.toFixed(2)} €/MWh</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="font-semibold text-gray-800 mb-3">Cronología de Predicciones</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          {predictionData.predictions.map((value, index) => {
            const timestamp = predictionData.timestamps[index];
            const date = new Date(timestamp);
            return (
              <div key={index} className="bg-white p-2 rounded border text-center">
                <div className="font-medium text-orange-600">
                  {date.toLocaleString('es-ES', { 
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="text-gray-800 font-semibold">
                  {value.toFixed(1)} €
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PredictionChart;
