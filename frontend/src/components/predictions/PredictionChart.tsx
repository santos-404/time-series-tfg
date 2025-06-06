import type { PredictionChartProps } from '@/types/PredictionData';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const PredictionChart: React.FC<PredictionChartProps> = ({
  predictionData,
  historicalData = [],
  showHistorical = true,
}) => {

  // Chart data for Spot Market (España & Portugal)
  const spotMarketChartData = React.useMemo(() => {
    const data: Array<{
      timestamp: string;
      time: string;
      historicalEspana?: number;
      historicalPortugal?: number;
      predictedEspana?: number;
      predictedPortugal?: number;
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
          historicalEspana: point.daily_spot_market_600_España,
          historicalPortugal: point.daily_spot_market_600_Portugal,
          isPrediction: false
        });
      });
    }

    predictionData.predictions.daily_spot_market_600_España?.forEach((prediction, index) => {
      const timestamp = predictionData.timestamps[index];
      const date = new Date(timestamp);
      const existingPoint = data.find(d => d.timestamp === timestamp);
      
      if (existingPoint) {
        existingPoint.predictedEspana = prediction;
        existingPoint.predictedPortugal = predictionData.predictions.daily_spot_market_600_Portugal?.[index];
        existingPoint.isPrediction = true;
      } else {
        data.push({
          timestamp,
          time: date.toLocaleString('es-ES', { 
            month: 'short', 
            day: '2-digit', 
            hour: '2-digit',
            minute: '2-digit'
          }),
          predictedEspana: prediction,
          predictedPortugal: predictionData.predictions.daily_spot_market_600_Portugal?.[index],
          isPrediction: true
        });
      }
    });

    // I guess here is not needed to re-sort the data again
    return data
    return data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [predictionData, historicalData, showHistorical]);


  const demandChartData = React.useMemo(() => {
    const data: Array<{
      timestamp: string;
      time: string;
      historicalDemand?: number;
      historicalForecast?: number;
      predictedDemand?: number;
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
          historicalDemand: point.scheduled_demand_372, 
          historicalForecast: point.peninsula_forecast_460,
          isPrediction: false
        });
      });
    }

    predictionData.predictions.scheduled_demand_372?.forEach((prediction, index) => {
      const timestamp = predictionData.timestamps[index];
      const date = new Date(timestamp);
      const existingPoint = data.find(d => d.timestamp === timestamp);
      
      if (existingPoint) {
        existingPoint.predictedDemand = prediction;
        existingPoint.isPrediction = true;
      } else {
        data.push({
          timestamp,
          time: date.toLocaleString('es-ES', { 
            month: 'short', 
            day: '2-digit', 
            hour: '2-digit',
            minute: '2-digit'
          }),
          predictedDemand: prediction,
          isPrediction: true
        });
      }
    });

    // I guess here is not needed to re-sort the data again
    return data
    return data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [predictionData, historicalData, showHistorical]);

  const spotPredictionStartIndex = spotMarketChartData.findIndex(point => point.isPrediction);
  const spotPredictionStartTime = spotPredictionStartIndex > 0 ? spotMarketChartData[spotPredictionStartIndex].timestamp : null;

  const demandPredictionStartIndex = demandChartData.findIndex(point => point.isPrediction);
  const demandPredictionStartTime = demandPredictionStartIndex > 0 ? demandChartData[demandPredictionStartIndex].timestamp : null;

  const SpotMarketTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {data.historicalEspana !== undefined && (
            <p className="text-blue-600">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              España histórico: {data.historicalEspana.toFixed(2)} €/MWh
            </p>
          )}
          {data.historicalPortugal !== undefined && (
            <p className="text-green-600">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Portugal histórico: {data.historicalPortugal.toFixed(2)} €/MWh
            </p>
          )}
          {data.predictedEspana !== undefined && (
            <p className="text-orange-600">
              <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
              España predicción: {data.predictedEspana.toFixed(2)} €/MWh
            </p>
          )}
          {data.predictedPortugal !== undefined && (
            <p className="text-red-600">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              Portugal predicción: {data.predictedPortugal.toFixed(2)} €/MWh
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const DemandTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {data.historicalDemand !== undefined && (
            <p className="text-purple-600">
              <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
              Demanda Histórica: {data.historicalDemand.toFixed(2)} MW
            </p>
          )}
          {data.historicalForecast !== undefined && (
            <p className="text-cyan-600">
              <span className="inline-block w-3 h-3 bg-cyan-500 rounded-full mr-2"></span>
              Previsión Histórica: {data.historicalForecast.toFixed(2)} MW
            </p>
          )}
          {data.predictedDemand !== undefined && (
            <p className="text-indigo-600">
              <span className="inline-block w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
              Demanda Predicha: {data.predictedDemand.toFixed(2)} MW
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const spotStats = React.useMemo(() => {
    const espanaPredictions = predictionData.predictions.daily_spot_market_600_España || [];
    const portugalPredictions = predictionData.predictions.daily_spot_market_600_Portugal || [];
    
    const stats = {
      espana: { max: 0, min: 0, avg: 0 },
      portugal: { max: 0, min: 0, avg: 0 }
    };

    if (espanaPredictions.length > 0) {
      stats.espana.max = Math.max(...espanaPredictions);
      stats.espana.min = Math.min(...espanaPredictions);
      stats.espana.avg = espanaPredictions.reduce((a, b) => a + b, 0) / espanaPredictions.length;
    }

    if (portugalPredictions.length > 0) {
      stats.portugal.max = Math.max(...portugalPredictions);
      stats.portugal.min = Math.min(...portugalPredictions);
      stats.portugal.avg = portugalPredictions.reduce((a, b) => a + b, 0) / portugalPredictions.length;
    }

    return stats;
  }, [predictionData]);

  const demandStats = React.useMemo(() => {
    const demandPredictions = predictionData.predictions.scheduled_demand_372 || [];
    
    const stats = {
      demand: { max: 0, min: 0, avg: 0 }
    };

    if (demandPredictions.length > 0) {
      stats.demand.max = Math.max(...demandPredictions);
      stats.demand.min = Math.min(...demandPredictions);
      stats.demand.avg = demandPredictions.reduce((a, b) => a + b, 0) / demandPredictions.length;
    }

    return stats;
  }, [predictionData]);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-4 rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-800">
              Modelo: <span className="text-blue-600">{predictionData.model_used.toUpperCase()}</span>
            </h3>
            <p className="text-sm text-gray-600">
              Ventana de entrada: {predictionData.input_data.hours_used} horas | 
              Predicciones: {predictionData.timestamps.length} horas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Demanda eléctrica</h3>
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-purple-500"></div>
            <span className="text-sm text-gray-700">Demanda Histórica</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-cyan-500"></div>
            <span className="text-sm text-gray-700">Previsión Histórica</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-indigo-500"></div>
            <span className="text-sm text-gray-700">Demanda Predicha</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={demandChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
              label={{ value: 'Demanda (MW)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<DemandTooltip />} />
            <Legend />
            
            {demandPredictionStartTime && (
              <ReferenceLine 
                x={new Date(demandPredictionStartTime).toLocaleString('es-ES', { 
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
            
            <Line
              type="monotone"
              dataKey="historicalDemand"
              stroke="#1A237E"
              strokeWidth={2}
              dot={false}
              name="Demanda Histórica"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="historicalForecast"
              stroke="#F1C40F"
              strokeWidth={2}
              dot={false}
              name="Previsión Histórica"
              connectNulls={false}
            />
            
            <Line
              type="monotone"
              dataKey="predictedDemand"
              stroke="#3498DB"
              strokeWidth={3}
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
              name="Demanda Predicha"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Mercado SPOT - España y Portugal</h3>
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-sm text-gray-700">España Histórico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500"></div>
            <span className="text-sm text-gray-700">Portugal Histórico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500"></div>
            <span className="text-sm text-gray-700">España Predicción</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span className="text-sm text-gray-700">Portugal Predicción</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={spotMarketChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
            <Tooltip content={<SpotMarketTooltip />} />
            <Legend />
            
            {spotPredictionStartTime && (
              <ReferenceLine 
                x={new Date(spotPredictionStartTime).toLocaleString('es-ES', { 
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
            
            <Line
              type="monotone"
              dataKey="historicalEspana"
              stroke="#E63946"
              strokeWidth={2}
              dot={false}
              name="España histórico"
              connectNulls={false}
            />

            <Line
              type="monotone"
              dataKey="historicalPortugal"
              stroke="#008000"
              strokeWidth={2}
              dot={false}
              name="Portugal histórico"
              connectNulls={false}
            /> 
            <Line
              type="monotone"
              dataKey="predictedEspana"
              stroke="#E63946"
              strokeWidth={3}
              dot={{ fill: '#E63946', strokeWidth: 2, r: 4 }}
              name="España Predicción"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="predictedPortugal"
              stroke="#2ECC71"
              strokeWidth={3}
              dot={{ fill: '#2ECC71', strokeWidth: 2, r: 4 }}
              name="Portugal Predicción"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Estadísticas mercado spot</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h5 className="font-semibold text-red-800 mb-3 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                España
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Máximo:</span>
                  <span className="font-medium">{spotStats.espana.max.toFixed(2)} €/MWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mínimo:</span>
                  <span className="font-medium">{spotStats.espana.min.toFixed(2)} €/MWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Promedio:</span>
                  <span className="font-medium">{spotStats.espana.avg.toFixed(2)} €/MWh</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-semibold text-green-800 mb-3 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Portugal
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Máximo:</span>
                  <span className="font-medium">{spotStats.portugal.max.toFixed(2)} €/MWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mínimo:</span>
                  <span className="font-medium">{spotStats.portugal.min.toFixed(2)} €/MWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Promedio:</span>
                  <span className="font-medium">{spotStats.portugal.avg.toFixed(2)} €/MWh</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Estadísticas demanda</h4>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-semibold text-blue-800 mb-3 flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Demanda predicha
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Máximo:</span>
                <span className="font-medium">{demandStats.demand.max.toFixed(2)} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mínimo:</span>
                <span className="font-medium">{demandStats.demand.min.toFixed(2)} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Promedio:</span>
                <span className="font-medium">{demandStats.demand.avg.toFixed(2)} MW</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="font-semibold text-gray-800 mb-3">Cronología de predicciones</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {predictionData.timestamps.map((timestamp, index) => {
            const date = new Date(timestamp);
            return (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-700 mb-2">
                  {date.toLocaleString('es-ES', { 
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="space-y-1">
                  <div className="text-red-600 font-semibold">
                    ES: {predictionData.predictions.daily_spot_market_600_España?.[index]?.toFixed(1) || 'N/A'} €/MWh
                  </div>
                  <div className="text-green-600 font-semibold">
                    PT: {predictionData.predictions.daily_spot_market_600_Portugal?.[index]?.toFixed(1) || 'N/A'} €/MWh
                  </div>
                  <div className="text-blue-600 font-semibold">
                    Demanda: {predictionData.predictions.scheduled_demand_372?.[index]?.toFixed(0) || 'N/A'} MW
                  </div>
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
