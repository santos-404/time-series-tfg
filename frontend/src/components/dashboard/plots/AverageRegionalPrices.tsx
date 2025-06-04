import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RegionalAveragesBar = ({ data }) => {
  const regionalAverages = useMemo(() => {
    if (!data || data.length === 0) return [];

    const totals = data.reduce((acc, item) => {
      acc.Baleares += item.average_demand_price_573_Baleares || 0;
      acc.Canarias += item.average_demand_price_573_Canarias || 0;
      acc.Ceuta += item.average_demand_price_573_Ceuta || 0;
      acc.Melilla += item.average_demand_price_573_Melilla || 0;
      return acc;
    }, { Baleares: 0, Canarias: 0, Ceuta: 0, Melilla: 0 });

    const count = data.length;
    
    return [
      { region: 'Baleares', price: totals.Baleares / count },
      { region: 'Canarias', price: totals.Canarias / count },
      { region: 'Ceuta', price: totals.Ceuta / count },
      { region: 'Melilla', price: totals.Melilla / count }
    ].filter(item => item.price > 0);
  }, [data]);

  if (!regionalAverages.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg h-full">
        <h3 className="text-xl font-semibold mb-4">Precios medios por zonas</h3>
        <div className="flex items-center justify-center h-72">
          <p className="text-gray-500">No hay datos diponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full">
      <h3 className="text-xl font-semibold mb-4">Precios medios por zonas</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={regionalAverages}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="region" />
          <YAxis label={{ value: '€/MWh', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => [`${value.toFixed(2)} €/MWh`, 'Average Price']} />
          <Bar dataKey="price" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RegionalAveragesBar;
