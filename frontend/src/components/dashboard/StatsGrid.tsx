import React from 'react';

const StatsGrid = ({ data, selectedMetrics }) => {
  const calculateStats = (metric) => {
    const values = data.map(d => d[metric]).filter(v => v != null);
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {selectedMetrics.slice(0, 3).map(metric => {
        const stats = calculateStats(metric);
        return (
          <div key={metric} className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="font-medium text-gray-900 mb-3">
              {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Actual:</span>
                <span className="font-semibold text-blue-600">{stats.latest?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Media:</span>
                <span className="font-medium">{stats.avg?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rango:</span>
                <span className="font-medium">{stats.min?.toFixed(1)} - {stats.max?.toFixed(1)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
