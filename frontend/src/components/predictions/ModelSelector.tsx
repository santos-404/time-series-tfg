interface ModelOption {
  value: string;
  label: string;
  description: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  const modelOptions: ModelOption[] = [
    { value: 'linear', label: 'Modelo Lineal', description: 'Regresión lineal simple' },
    { value: 'dense', label: 'Red Neuronal Densa', description: 'Capas completamente conectadas' },
    { value: 'conv', label: 'Red Neuronal Convolucional', description: 'Reconocimiento de patrones' },
    { value: 'lstm', label: 'Red Neuronal LSTM', description: 'Dependencias temporales' }
  ];

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Selecciona el modelo</h3>
      <div className="grid grid-cols-1 gap-3">
        {modelOptions.map(option => (
          <label key={option.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="model"
              value={option.value}
              checked={selectedModel === option.value}
              onChange={(e) => onModelChange(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">{option.label}</span>
                {option.value === 'lstm' && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                    Recomendado
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;
