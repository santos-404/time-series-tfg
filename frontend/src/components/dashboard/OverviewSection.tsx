// Updated OverviewSection.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MetricSelector from './MetricSelector';
import StatsGrid from './StatsGrid';

const OverviewSection = ({ data, selectedMetrics, setSelectedMetrics, currentDate, daysToShow }) => {
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  
  const getPeriodLabel = () => {
    switch(daysToShow) {
      case 7: return 'semanales';
      case 14: return 'quincenales';
      case 30: return 'mensuales';
      case 90: return 'trimestrales';
      default: return `de ${daysToShow} días`;
    }
  };

  const customTooltipFormatter = (value, name, props) => {
    return [
      `${value.toFixed(2)}`,
      name
    ];
  };

  const customLabelFormatter = (label, payload) => {
    if (payload && payload.length > 0) {
      const date = payload[0].payload.fullDate;
      return `Fecha: ${date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`;
    }
    return `Fecha: ${label}`;
  };

  return (
    <div className="space-y-6">
      <MetricSelector 
        selectedMetrics={selectedMetrics}
        setSelectedMetrics={setSelectedMetrics}
        availableMetrics={data.length > 0 ? Object.keys(data[0]).filter(k => !['datetime', 'date', 'day', 'fullDate'].includes(k)) : []}
      />
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            Tendencias {getPeriodLabel()}
          </h3>
          <div className="text-sm text-gray-500">
            {data.length} puntos de datos
          </div>
        </div>
        
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No hay datos disponibles</p>
              <p className="text-sm">para el período seleccionado</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={Math.max(0, Math.floor(data.length / 10))} // Show fewer labels if too many points
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={customLabelFormatter}
                formatter={customTooltipFormatter}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {selectedMetrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3, cursor: 'pointer' }}
                  activeDot={{ r: 5, cursor: 'pointer' }}
                  connectNulls={false} // think there's no null data though.
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <StatsGrid data={data} selectedMetrics={selectedMetrics} />
    </div>
  );
};

export default OverviewSection;
