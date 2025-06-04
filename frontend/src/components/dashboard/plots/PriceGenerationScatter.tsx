import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PriceGenerationScatter = ({ data }) => {
  const correlationData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => {
      const totalHydraulic = (item.hydraulic_71 || 0) + (item.hydraulic_36 || 0) + (item.hydraulic_1 || 0);
      const totalNuclear = (item.nuclear_39 || 0) + (item.nuclear_4 || 0) + (item.nuclear_74 || 0);
      const solar = item.solar_14 || 0;
      const wind = item.wind_12 || 0;
      
      return {
        totalGeneration: solar + wind + totalHydraulic + totalNuclear,
        spotPrice: item.daily_spot_market_600_España || 0,
        hour: new Date(item.datetime).getHours(),
        renewable: solar + wind,
        datetime: item.datetime
      };
    }).filter(item => item.totalGeneration > 0);
  }, [data]);

  if (!correlationData.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Precio SPOT vs Generación total</h3>
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full">
      <h3 className="text-xl font-semibold mb-4">Precio SPOT vs Generación total</h3>
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart data={correlationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="totalGeneration" 
            type="number" 
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Total Generation (MW)', position: 'insideBottom', offset: -10 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            dataKey="spotPrice" 
            type="number"
            label={{ value: 'Spot Price (€/MWh)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value, name) => [
              `${value.toFixed(2)}${name === 'spotPrice' ? ' €/MWh' : ' MW'}`, 
              name === 'spotPrice' ? 'Spot Price' : 'Total Generation'
            ]}
            labelFormatter={() => ''}
          />
          <Scatter dataKey="spotPrice" fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceGenerationScatter;
