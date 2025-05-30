import type { DownloadConfigProps } from "@/types/DownloadConfigProps";

const DownloadConfig = ({
  esiosToken,
  setEsiosToken,
  yearsBack,
  setYearsBack,
  downloadIndicators,
  setDownloadIndicators,
  isDownloading,
  onDownload
}: DownloadConfigProps) => (
  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
    <h2 className="text-xl font-semibold mb-6">Configuración de la descarga</h2>
    
    <div className="space-y-6">
      <div>
        <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
          Token de ESIOS *
        </label>
        <input
          type="password"
          id="token"
          value={esiosToken}
          onChange={(e) => setEsiosToken(e.target.value)}
          placeholder="Introduce tu token personal de ESIOS"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Tu token se usa únicamente para esta sesión y no se almacena permanentemente
        </p>
      </div>

      <div>
        <label htmlFor="years" className="block text-sm font-medium text-gray-700 mb-2">
          Años hacia atrás
        </label>
        <select
          id="years"
          value={yearsBack}
          onChange={(e) => setYearsBack(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={1}>1 año</option>
          <option value={2}>2 años</option>
          <option value={3}>3 años</option>
          <option value={4}>4 años</option>
          <option value={5}>5 años</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Cantidad de años de datos históricos a descargar
        </p>
      </div>

      <div className="flex items-center">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={downloadIndicators}
            onChange={(e) => setDownloadIndicators(e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Descargar lista de indicadores
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Descarga el catálogo completo de indicadores disponibles en ESIOS
            </p>
          </div>
        </label>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-yellow-400">⚠️</div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              <strong>Proceso de 2 pasos:</strong>
            </p>
            <ol className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>1. <strong>Descargar datos:</strong> Puede tardar varios minutos</li>
              <li>2. <strong>Construir dataset:</strong> Una vez descargados los datos, usa el botón "Construir dataset de entrenamiento" para unir y limpiar todos los archivos</li>
            </ol>
          </div>
        </div>
      </div>

      <button
        onClick={onDownload}
        disabled={isDownloading || !esiosToken.trim()}
        className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
      >
        {isDownloading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Descargando datos...
          </div>
        ) : (
          'Iniciar descarga'
        )}
      </button>
    </div>
  </div>
);

export default DownloadConfig; 
