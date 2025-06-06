import React from 'react';
import PredictionChart from '@/components/predictions/PredictionChart';

interface PredictionResultsProps {
  predictionData: any;
  historicalData: any;
  showHistorical: boolean;
  onToggleHistorical: (show: boolean) => void;
  selectedVariables: string[];
}

const PredictionResults: React.FC<PredictionResultsProps> = ({
  predictionData,
  historicalData,
  showHistorical,
  onToggleHistorical,
}) => {

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Mercado Spot - España y Portugal
            </h2>
            <label className="flex items-center cursor-pointer">
              <span className="mr-3 text-sm font-medium text-gray-700">
                Mostrar históricos
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showHistorical}
                  onChange={(e) => onToggleHistorical(e.target.checked)}
                  className="sr-only"
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${
                  showHistorical ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${
                    showHistorical ? 'translate-x-6' : ''
                  }`}></div>
                </div>
              </div>
            </label>
          </div>
          
          <PredictionChart
            predictionData={predictionData}
            historicalData={historicalData}
            showHistorical={showHistorical}
          />
        </div>

    </div>
  );
};

export default PredictionResults;
