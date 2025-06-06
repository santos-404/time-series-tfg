import React from 'react';

interface VariableSelectorProps {
  selectedVariables: string[];
  onVariablesChange: (variables: string[]) => void;
}

const AVAILABLE_VARIABLES = [
  {
    key: 'showDemand',
    label: 'Demanda programada',
    description: 'Precio estimado de la demanda.'
  },
  {
    key: 'showSPOT',
    label: 'Mercado SPOT',
    description: 'Precio en el mercado SPOT de España y Portugal.'
  },
];

const LabelSelector: React.FC<VariableSelectorProps> = ({
  selectedVariables,
  onVariablesChange
}) => {
  const handleVariableToggle = (variableKey: string) => {
    if (selectedVariables.includes(variableKey)) {
      // Remove variable if already selected
      onVariablesChange(selectedVariables.filter(v => v !== variableKey));
    } else {
      // Add variable if not selected
      onVariablesChange([...selectedVariables, variableKey]);
    }
  };

  const handleSelectAll = () => {
    if (selectedVariables.length === AVAILABLE_VARIABLES.length) {
      // Deselect all
      onVariablesChange([]);
    } else {
      // Select all
      onVariablesChange(AVAILABLE_VARIABLES.map(v => v.key));
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Variables a predecir</h3>
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {selectedVariables.length === AVAILABLE_VARIABLES.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-4 w-full">
        {AVAILABLE_VARIABLES.map((variable) => (
          <label
            key={variable.key}
            className="flex flex-1 items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedVariables.includes(variable.key)}
              onChange={() => handleVariableToggle(variable.key)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {variable.label}
              </div>
              <div className='text-xs text-gray-500'>
                {variable.description}
              </div>
            </div>
          </label>
        ))}
      </div>
      
      {selectedVariables.length === 0 && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          Debes seleccionar al menos una variable para realizar predicciones.
        </div>
      )}
    </div>
  );
};

export default LabelSelector;
