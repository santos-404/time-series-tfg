import { ChevronLeft, ChevronRight, Calendar, Home } from 'lucide-react';

const DateNavigation = ({ 
  currentDate, 
  onPreviousDate, 
  onNextDate, 
  onGoToLatestDate, 
  canGoToNextDate,
  daysToShow,
  setDaysToShow 
}) => {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  const isLastWeekOfApril = currentDate.getFullYear() === 2025 && 
                           currentDate.getMonth() === 3 && 
                           currentDate.getDate() >= 24; 

  const getWeekRange = () => {
    const endDate = new Date(currentDate);
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - (daysToShow - 1));
    
    return {
      start: startDate,
      end: endDate
    };
  };

  const weekRange = getWeekRange();

  const periodOptions = [
    { value: 7, label: 'Semana' },
    { value: 14, label: '2 Semanas' },
    { value: 30, label: 'Mes' },
    { value: 90, label: '3 Meses' }
  ];

  const formatDateRange = (start, end) => {
    const options = { day: 'numeric', month: 'short' };
    const startStr = start.toLocaleDateString('es-ES', options);
    const endStr = end.toLocaleDateString('es-ES', options);
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${monthNames[end.getMonth()]}`;
    } else {
      return `${startStr} - ${endStr}`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">
          <button
            onClick={onPreviousDate}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-blue-600" />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {formatDateRange(weekRange.start, weekRange.end)} {currentYear}
              </h2>
              <p className="text-sm text-gray-500">
                {currentMonth} {currentYear}
              </p>
            </div>
            {!isLastWeekOfApril && (
              <button
                onClick={onGoToLatestDate}
                className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Ir a última semana de Abril 2025"
              >
                <Home size={16} />
                <span className="hidden sm:inline">Más reciente</span>
              </button>
            )}
          </div>

          <button
            onClick={onNextDate}
            disabled={!canGoToNextDate}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              canGoToNextDate 
                ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">Período:</span>
          <select
            value={daysToShow}
            onChange={(e) => setDaysToShow(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Mostrando datos desde {weekRange.start.toLocaleDateString('es-ES')} hasta {weekRange.end.toLocaleDateString('es-ES')}
            {daysToShow === 7 && ' (1 semana)'}
            {daysToShow === 14 && ' (2 semanas)'}
            {daysToShow === 30 && ' (1 mes)'}
            {daysToShow === 90 && ' (3 meses)'}
          </span>
          <span className="text-sm text-gray-500">
            Por defecto se muestran los datos descargados más recientes. 
          </span>
          {isLastWeekOfApril && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Período más reciente
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateNavigation;
