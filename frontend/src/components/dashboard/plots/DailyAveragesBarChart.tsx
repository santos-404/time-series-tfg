import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
  solar: '#FFD700',
  wind: '#87CEEB',
  hydraulic: '#4682B4',
  nuclear: '#FF6347'
};

const DailyAveragesBarChart = ({ data }) => {
  const dailyAverages = useMemo(() => {
    if (!data || data.length === 0) return [];

    const averages = data.reduce((acc, item) => {

      const hydraulicTotal = (item.hydraulic_71 || 0) + (item.hydraulic_36 || 0) + (item.hydraulic_1 || 0);
      const nuclearTotal = (item.nuclear_39 || 0) + (item.nuclear_4 || 0) + (item.nuclear_74 || 0);
      
      acc.solar += item.solar_14 || 0;
      acc.wind += item.wind_12 || 0;
      acc.hydraulic += hydraulicTotal;
      acc.nuclear += nuclearTotal;
      return acc;
    }, { solar: 0, wind: 0, hydraulic: 0, nuclear: 0 });

    const count = data.length;
    return [
      { source: 'Solar', average: averages.solar / count, color: COLORS.solar },
      { source: 'Eólica', average: averages.wind / count, color: COLORS.wind },
      { source: 'Hidráulica', average: averages.hydraulic / count, color: COLORS.hydraulic },
      { source: 'Nuclear', average: averages.nuclear / count, color: COLORS.nuclear }
    ].filter(item => item.average > 0);
  }, [data]);

  if (!dailyAverages.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg h-full">
        <h3 className="text-xl font-semibold mb-4">Generación diaria media por fuente de energía</h3>
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full">
      <h3 className="text-xl font-semibold mb-4">Generación diaria media por fuente de energía</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={dailyAverages} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="source" />
          <YAxis label={{ value: 'MW', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => [`${value.toFixed(0)} MW`, 'Generación media']} />
          <Bar dataKey="average" fill="#8884d8">
            {dailyAverages.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyAveragesBarChart;
