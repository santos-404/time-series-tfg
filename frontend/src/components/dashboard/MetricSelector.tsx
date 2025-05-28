const MetricSelector = ({ selectedMetrics, setSelectedMetrics, availableMetrics }) => {
  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Selecciona las métricas que deseas mostrar</h3>
      <div className="flex flex-wrap gap-2">
        {availableMetrics.map(metric => (
          <button
            key={metric}
            onClick={() => toggleMetric(metric)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedMetrics.includes(metric)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MetricSelector;
