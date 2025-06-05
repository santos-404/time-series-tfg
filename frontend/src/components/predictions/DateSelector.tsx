import React from 'react';
import InfoTooltip from '@/components/ui/infoTooltip';

interface DateSelectorProps {
  value: string;
  onChange: (date: string) => void;
  maxDate: string;
}

const DateSelector: React.FC<DateSelectorProps> = ({ value, onChange, maxDate }) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
        Fecha de predicción
        <InfoTooltip
          title="Fecha de predicción"
          content="Selecciona la fecha desde la cual quieres hacer la predicción. El modelo utilizará datos hasta esta fecha para predecir las horas siguientes. Por defecto se usa la fecha más reciente de datos descargados, en caso de no disponer de datos se usará 2025-03-30 para asegurar que los modelos pre-entrenados poseen los datos."
        />
      </label>
      <input
        type="date"
        value={value}
        max={maxDate}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Selecciona una fecha" 
      />
      <div className="text-xs text-gray-500 mt-1">
        {value ? 
          `Predecir desde: ${new Date(value).toLocaleDateString('es-ES')}` : 
          'Por defecto se usa la fecha más reciente de datos. En caso de no disponer de datos se usa 2025-03-30'
        }
      </div>
    </div>
  );
};

export default DateSelector;
