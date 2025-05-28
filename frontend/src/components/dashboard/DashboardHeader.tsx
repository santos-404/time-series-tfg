import { Calendar } from 'lucide-react';

const DashboardHeader = ({ viewMode, setViewMode, selectedDay }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Análisis del mercado eléctrico   
        </h1>
        <p className="text-gray-600 mt-1">
          {viewMode === 'overview' ? 
            'Vista semanal de los datos elétricos' : 
            `Análisis detallado del día ${selectedDay?.date || 'seleccionado'}`
          }
        </p>
      </div>
      
      {viewMode === 'detailed' && (
        <button
          onClick={() => setViewMode('overview')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Calendar size={20} />
          Vuelta a la vista semanal 
        </button>
      )}
    </div>
  </div>
);

export default DashboardHeader;
