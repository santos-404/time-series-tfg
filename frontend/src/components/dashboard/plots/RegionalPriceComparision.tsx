import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RegionalPriceComparison = ({ data }) => {
  const regionalData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      time: new Date(item.datetime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      date: new Date(item.datetime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      datetime_display: `${new Date(item.datetime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })} ${new Date(item.datetime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`,
      hour: new Date(item.datetime).getHours(),
      Baleares: item.average_demand_price_573_Baleares || 0,
      Canarias: item.average_demand_price_573_Canarias || 0,
      Ceuta: item.average_demand_price_573_Ceuta || 0,
      Melilla: item.average_demand_price_573_Melilla || 0
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`${dataPoint?.datetime_display || label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value.toFixed(2)} €/MWh`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!regionalData.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Comparación de precios regionales</h3>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full">
      <h3 className="text-xl font-semibold mb-4">Comparación de precios regionales</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={regionalData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="datetime_display"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis label={{ value: '€/MWh', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Baleares" 
            stroke="#FF8042" 
            strokeWidth={2} 
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="Canarias" 
            stroke="#00C49F" 
            strokeWidth={2} 
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="Ceuta" 
            stroke="#FFBB28" 
            strokeWidth={2} 
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="Melilla" 
            stroke="#FF8888" 
            strokeWidth={2} 
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RegionalPriceComparison;
