const EmptyState = () => (
  <div className="bg-white rounded-lg shadow-lg p-12 text-center">
    <div className="text-gray-400 mb-4">
      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Listo para descargar
    </h3>
    <p className="text-gray-600">
      Introduce tu token de ESIOS y configura las opciones para comenzar la descarga.
    </p>
  </div>
);

export default EmptyState;
