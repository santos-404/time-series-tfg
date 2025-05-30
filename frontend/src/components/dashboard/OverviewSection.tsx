import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MetricSelector from './MetricSelector';
import StatsGrid from './StatsGrid';

const OverviewSection = ({ data, selectedMetrics, setSelectedMetrics }) => {
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      <MetricSelector 
        selectedMetrics={selectedMetrics}
        setSelectedMetrics={setSelectedMetrics}
        availableMetrics={data.length > 0 ? Object.keys(data[0]).filter(k => !['datetime', 'date', 'day', 'fullDate'].includes(k)) : []}
      />
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Tendencias semanales
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value, name) => [value.toFixed(2), name]}
            />
            <Legend />
            {selectedMetrics.map((metric, index) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{ r: 6, cursor: 'pointer' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <StatsGrid data={data} selectedMetrics={selectedMetrics} />
    </div>
  );
};

export default OverviewSection;
