import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  solar: '#FFD700',
  wind: '#87CEEB',
  hydraulic: '#4682B4',
  nuclear: '#FF6347'
};

const GenerationLineChart = ({ data }) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      ...item,
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
      totalHydraulic: (item.hydraulic_71 || 0) + (item.hydraulic_36 || 0) + (item.hydraulic_1 || 0),
      totalNuclear: (item.nuclear_39 || 0) + (item.nuclear_4 || 0) + (item.nuclear_74 || 0),
      solar: item.solar_14 || 0,
      wind: item.wind_12 || 0
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
              {`${entry.name}: ${entry.value.toFixed(0)} MW`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!processedData.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Fuentes de energía a lo largo del día</h3>
        <div className="flex items-center justify-center h-72">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full">
      <h3 className="text-xl font-semibold mb-4">Fuentes de energía a lo largo del día</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="datetime_display"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis label={{ value: 'MW', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="solar" 
            stroke={COLORS.solar} 
            strokeWidth={3} 
            name="Solar" 
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="wind" 
            stroke={COLORS.wind} 
            strokeWidth={3} 
            name="Wind" 
            dot={{ r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="totalHydraulic" 
            stroke={COLORS.hydraulic} 
            strokeWidth={2} 
            name="Hydraulic" 
            dot={{ r: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="totalNuclear" 
            stroke={COLORS.nuclear} 
            strokeWidth={2} 
            name="Nuclear" 
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GenerationLineChart;
