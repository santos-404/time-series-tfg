import React from 'react';
import DateSelector from './DateSelector';
import RangeInput from './RangeInput';
import type { PredictionRequest } from '@/types/PredictionData';

interface PredictionParametersProps {
  config: PredictionRequest;
  onConfigChange: (config: Partial<PredictionRequest>) => void;
  onPredict: () => void;
  isLoading: boolean;
  error: string | null;
}

const PredictionParameters: React.FC<PredictionParametersProps> = ({
  config,
  onConfigChange,
  onPredict,
  isLoading,
  error
}) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Parámetros</h3>
      <div className="space-y-4">
        <DateSelector
          value={config.prediction_date}
          onChange={(date) => onConfigChange({ prediction_date: date })}
          maxDate={today}
        />
        
        <RangeInput
          label="Horas a predecir"
          value={config.hours_ahead}
          min={1}
          max={24}
          onChange={(hours) => onConfigChange({ hours_ahead: hours })}
          unit="horas"
          tooltipTitle="Horas a predecir"
          tooltipContent="Define cuántas horas en el futuro quieres que el modelo haga la predicción. Por ejemplo, si seleccionas 6 horas, el modelo predecirá el consumo energético que ocurrirá 6 horas después del momento actual."
          minLabel="1 hora"
          maxLabel="24 horas"
        />
        
        <RangeInput
          label="Ventana de entrada"
          value={config.input_hours}
          min={1}
          max={168}
          onChange={(hours) => onConfigChange({ input_hours: hours })}
          unit="horas"
          tooltipTitle="Ventana de entrada"
          tooltipContent="Especifica cuántas horas de datos históricos utilizará el modelo para hacer la predicción. Una ventana más amplia permite capturar patrones a largo plazo, mientras que una ventana más pequeña se enfoca en tendencias recientes."
          minLabel="1 hora"
          maxLabel="168 horas"
        />
        
        <button
          onClick={onPredict}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generando predicción...
            </div>
          ) : (
            'Generar predicción'
          )}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">¡Hubo un fallo en la predicción!</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionParameters;
