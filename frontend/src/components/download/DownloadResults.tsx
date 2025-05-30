import type { DownloadResultsProps } from "@/types/DownloadData";

const DownloadResults = ({ downloadResults, isMerging, onMergeData }: DownloadResultsProps) => (
  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
    <h2 className="text-xl font-semibold mb-6 text-green-700">
      Descarga completada
    </h2>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium text-green-800 mb-3">Resumen de la descarga</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700">Archivos descargados:</span>
            <span className="font-medium">{downloadResults.downloaded_files.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Directorio:</span>
            <span className="font-medium text-xs">{downloadResults.data_directory}</span>
          </div>
          {downloadResults.errors.length > 0 && (
            <div className="flex justify-between">
              <span className="text-orange-700">Errores:</span>
              <span className="font-medium text-orange-700">{downloadResults.errors.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-3">Siguiente paso</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>Datos descargados correctamente</p>
          <p>Ahora construye el dataset unificado</p>
          <p>Después podrás entrenar los modelos</p>
        </div>
      </div>
    </div>

    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex">
        <div className="text-orange-400">🔧</div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-orange-800">Construir dataset de entrenamiento</h3>
          <p className="text-sm text-orange-700 mt-1">
            Los datos se han descargado como archivos separados. Haz clic en el botón de abajo para unirlos, 
            limpiarlos y crear el dataset final listo para entrenar los modelos.
          </p>
        </div>
      </div>
    </div>

    <button
      onClick={onMergeData}
      disabled={isMerging}
      className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg mb-6"
    >
      {isMerging ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
          Construyendo dataset...
        </div>
      ) : (
        'Construir dataset de entrenamiento'
      )}
    </button>

    {downloadResults.downloaded_files.length > 0 && (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Archivos descargados</h3>
        <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {downloadResults.downloaded_files.map((file, index) => (
              <div key={index} className="text-gray-700 font-mono text-xs">
                {file}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {downloadResults.errors.length > 0 && (
      <div>
        <h3 className="text-lg font-medium mb-4 text-orange-700">Errores durante la descarga</h3>
        <div className="bg-orange-50 p-4 rounded-lg">
          {downloadResults.errors.map((error, index) => (
            <div key={index} className="text-sm text-orange-700 mb-2">
              • {error}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default DownloadResults;
