const DataCategories = () => {
  const dataCategories = [
    { name: 'Generación hidraulica', description: 'Datos de generación de energía hidráulica', indicators: [1, 36, 71] },
    { name: 'Generación nuclear', description: 'Datos de generación de energía nuclear', indicators: [4, 39, 74] },
    { name: 'Generación eólica', description: 'Datos de generación de energía eólica', indicators: [12] },
    { name: 'Generación solar', description: 'Datos de generación de energía solar', indicators: [14] },
    { name: 'Demanda península', description: 'Previsión de demanda peninsular', indicators: [460] },
    { name: 'Demanda programada', description: 'Demanda de energía programada', indicators: [358, 365, 372] },
    { name: 'Precio mercado diario', description: 'Precios del mercado spot diario', indicators: [600] },
    { name: 'Precio medio demanda', description: 'Precio medio de la demanda en Baleares, Canarias, Ceuta y Melilla', indicators: [573] }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Datos que se descargarán</h2>
      <p className="text-gray-600 mb-4">
        El sistema descargará automáticamente los siguientes tipos de datos del mercado eléctrico español:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataCategories.map((category, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <h4 className="font-medium text-gray-800">{category.name}</h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
            <div className="text-xs text-gray-500">
              Indicadores: {category.indicators.join(', ')}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Resolución temporal:</strong> Datos cada 5 minutos. 
          Si ESIOS no dispone de datos con tanta precisión se descargan en el máximo permitido</p>
        <p><strong>Formato:</strong> Archivos CSV organizados por categoría, indicador y año</p>
      </div>
    </div>
  );
};

export default DataCategories;
