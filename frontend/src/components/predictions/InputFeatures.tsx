import React from 'react';

const InputFeatures: React.FC = () => {
  const inputFeatures = {
    'Fuentes de energía': ['hydraulic_1', 'hydraulic_36', 'solar_14', 'wind_12', 'nuclear_4', 'nuclear_39'],
    'Demanda': ['scheduled_demand_365', 'peninsula_forecast_460'],
    'Precios regionales': ['average_demand_price_573_Baleares', 'average_demand_price_573_Canarias']
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Variables de entrada para la predicción</h2>
      <p className="text-gray-600 mb-4">
        El modelo utiliza las siguientes variables para predecir el precio spot de electricidad:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(inputFeatures).map(([groupName, features]) => (
          <div key={groupName} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">{groupName}</h4>
            <ul className="space-y-1">
              {features.map(feature => (
                <li key={feature} className="text-sm text-gray-600">
                  • {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InputFeatures;
