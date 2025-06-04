import { useMemo } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  solar: '#FFD700',
  wind: '#87CEEB',
  hydraulic: '#4682B4',
  nuclear: '#FF6347'
};

const HourlyGenerationTrends = ({ data }) => {
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
        <h3 className="text-xl font-semibold mb-4">Tendencias horarias de generación de energía</h3>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full">
      <h3 className="text-xl font-semibold mb-4">Tendencias horarias de generación de energía</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          <Area 
            type="monotone" 
            dataKey="solar" 
            stackId="1" 
            stroke={COLORS.solar} 
            fill={COLORS.solar} 
            name="Solar" 
          />
          <Area 
            type="monotone" 
            dataKey="wind" 
            stackId="1" 
            stroke={COLORS.wind} 
            fill={COLORS.wind} 
            name="Wind" 
          />
          <Area 
            type="monotone" 
            dataKey="totalHydraulic" 
            stackId="1" 
            stroke={COLORS.hydraulic} 
            fill={COLORS.hydraulic} 
            name="Hydraulic" 
          />
          <Area 
            type="monotone" 
            dataKey="totalNuclear" 
            stackId="1" 
            stroke={COLORS.nuclear} 
            fill={COLORS.nuclear} 
            name="Nuclear" 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HourlyGenerationTrends;
