import { Eye } from 'lucide-react';

//TODO: Implement this properly. The backend is still needed.
const DetailedSection = ({ selectedDay, onBack }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Eye className="text-purple-600" />
        Daily Analysis - {selectedDay?.date}
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Key Metrics</h4>
          {selectedDay && Object.entries(selectedDay)
            .filter(([key]) => !['datetime', 'date', 'day', 'fullDate'].includes(key))
            .map(([key, value]) => (
              <div key={key} className="flex justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</span>
              </div>
            ))
          }
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Explainability Analysis</h4>
          <div className="text-center py-8">
            <Eye className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600">
              Explainability features will be implemented here.<br/>
              This will show AI model predictions and feature importance.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DetailedSection;
