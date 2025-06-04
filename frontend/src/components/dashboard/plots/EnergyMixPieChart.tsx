import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  solar: '#FFD700',
  wind: '#87CEEB',
  hydraulic: '#4682B4',
  nuclear: '#FF6347'
};

const RADIAN = Math.PI / 180;

const EnergyMixPieChart = ({ data }) => {
  const energyMixData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const totals = data.reduce((acc, item) => {

      const hydraulicTotal = (item.hydraulic_71 || 0) + (item.hydraulic_36 || 0) + (item.hydraulic_1 || 0);
      const nuclearTotal = (item.nuclear_39 || 0) + (item.nuclear_4 || 0) + (item.nuclear_74 || 0);
      
      acc.solar += item.solar_14 || 0;
      acc.wind += item.wind_12 || 0;
      acc.hydraulic += hydraulicTotal;
      acc.nuclear += nuclearTotal;
      return acc;
    }, { solar: 0, wind: 0, hydraulic: 0, nuclear: 0 });

    const total = Object.values(totals).reduce((sum, val) => sum + val, 0);
    
    if (total === 0) return [];

    return [
      { name: 'Solar', value: totals.solar, percentage: ((totals.solar / total) * 100).toFixed(1) },
      { name: 'Eólica', value: totals.wind, percentage: ((totals.wind / total) * 100).toFixed(1) },
      { name: 'Hidráulica', value: totals.hydraulic, percentage: ((totals.hydraulic / total) * 100).toFixed(1) },
      { name: 'Nuclear', value: totals.nuclear, percentage: ((totals.nuclear / total) * 100).toFixed(1) }
    ].filter(item => item.value > 0);
  }, [data]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="black" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${name} ${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  if (!energyMixData.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg h-full">
        <h3 className="text-xl font-semibold mb-4">Fuentes de generación de energía</h3>
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full">
        <h3 className="text-xl font-semibold mb-4">Fuentes de generación de energía</h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={energyMixData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {energyMixData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value.toFixed(0)} MW`, 'Generación']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnergyMixPieChart;
