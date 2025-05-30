import type { DownloadResponse } from '@/types/DownloadData';
import type { MergeResponse } from '@/types/MergeData';
import { useState } from 'react';

// I obviously know that is not a good practice. But this is not aim to be deployed
const API_URL = 'http://127.0.0.1:7777';

const DownloadData = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [downloadResults, setDownloadResults] = useState<DownloadResponse | null>(null);
  const [mergeResults, setMergeResults] = useState<MergeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [esiosToken, setEsiosToken] = useState('');
  const [downloadIndicators, setDownloadIndicators] = useState(false);
  const [yearsBack, setYearsBack] = useState(5);

  const dataCategories = [
    { name: 'Generación Hidraulica', description: 'Datos de generación de energía hidráulica', indicators: [1, 36, 71] },
    { name: 'Generación Nuclear', description: 'Datos de generación de energía nuclear', indicators: [4, 39, 74] },
    { name: 'Generación Eólica', description: 'Datos de generación de energía eólica', indicators: [12] },
    { name: 'Generación Solar', description: 'Datos de generación de energía solar', indicators: [14] },
    { name: 'Demanda Península', description: 'Previsión de demanda peninsular', indicators: [460] },
    { name: 'Demanda Programada', description: 'Demanda de energía programada', indicators: [358, 365, 372] },
    { name: 'Precio Mercado Diario', description: 'Precios del mercado spot diario', indicators: [600] },
    { name: 'Precio Medio Demanda', description: 'Precio medio ponderado de la demanda', indicators: [573] }
  ];

  const handleDownloadData = async () => {
    if (!esiosToken.trim()) {
      setError('Por favor, introduce tu token de ESIOS');
      return;
    }

    setIsDownloading(true);
    setError(null);
    setDownloadResults(null);
    setMergeResults(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/data/download/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          esios_token: esiosToken,
          download_indicators: downloadIndicators,
          years_back: yearsBack
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la descarga de datos');
      }

      const data = await response.json();
      setDownloadResults(data);
      
      // Scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }, 200);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMergeData = async () => {
    setIsMerging(true);
    setError(null);
    setMergeResults(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/data/merge/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al construir el dataset');
      }

      const data = await response.json();
      setMergeResults(data);
      
      // Scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }, 200);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Descargar datos de ESIOS
          </h1>
          <p className="mt-2 text-gray-600">
            Descarga los datos necesarios desde la API de ESIOS para entrenar los modelos de predicción del mercado eléctrico.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex">
            <div className="text-blue-400 text-xl">ℹ️</div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-blue-800 mb-3">Información sobre ESIOS</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>
                  Los datos se descargan desde <strong>ESIOS (Sistema de Información del Operador del Sistema)</strong>, 
                  la plataforma oficial de Red Eléctrica de España para datos del sistema eléctrico.
                </p>
                <p>
                  <strong>Documentación oficial:</strong>{' '}
                  <a 
                    href="https://api.esios.ree.es/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-800"
                  >
                    https://api.esios.ree.es/
                  </a>
                </p>
                <p>
                  <strong>Solicitar token:</strong> Envía un email a{' '}
                  <a 
                    href="mailto:consultasios@ree.es?subject=Personal token request"
                    className="underline hover:text-blue-800"
                  >
                    consultasios@ree.es
                  </a>{' '}
                  con el asunto "Personal token request"
                </p>
                <p>
                  <strong>Uso local:</strong> Este proyecto está diseñado para ejecutarse en tu máquina local. 
                  Los datos se descargarán en el directorio <code className="bg-blue-100 px-1 rounded">data/</code> en la raíz del proyecto.
                </p>
              </div>
            </div>
          </div>
        </div>

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
              onClick={handleDownloadData}
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-400">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {downloadResults && (
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
                  <p>✅ Datos descargados correctamente</p>
                  <p>📊 Ahora construye el dataset unificado</p>
                  <p>🤖 Después podrás entrenar los modelos</p>
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
              onClick={handleMergeData}
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
        )}

        {mergeResults && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6 text-green-700">
              Dataset construido exitosamente
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-3">Estadísticas del dataset</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Archivos procesados:</span>
                    <span className="font-medium">{mergeResults.processed_files_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Filas totales:</span>
                    <span className="font-medium">{mergeResults.merged_rows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Columnas:</span>
                    <span className="font-medium">{mergeResults.merged_columns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Categorías:</span>
                    <span className="font-medium">{mergeResults.data_categories.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-3">Rango temporal</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div>
                    <span className="font-medium">Inicio:</span>
                    <div className="text-xs">
                      {mergeResults.date_range.start ? new Date(mergeResults.date_range.start).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Final:</span>
                    <div className="text-xs">
                      {mergeResults.date_range.end ? new Date(mergeResults.date_range.end).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="text-green-400">✅</div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Dataset listo</h3>
                  <p className="text-sm text-green-700 mt-1">
                    El dataset se ha guardado como: <code className="bg-green-100 px-1 rounded font-mono text-xs">{mergeResults.output_file}</code>
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    Ahora puedes proceder a entrenar los modelos de predicción con este dataset unificado.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Categorías de datos incluidas</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  {mergeResults.data_categories.map((category, index) => (
                    <div key={index} className="text-gray-700 font-mono text-xs bg-white p-2 rounded">
                      {category}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {mergeResults.errors && mergeResults.errors.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-orange-700">Advertencias durante la construcción</h3>
                <div className="bg-orange-50 p-4 rounded-lg">
                  {mergeResults.errors.map((error, index) => (
                    <div key={index} className="text-sm text-orange-700 mb-2">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!downloadResults && !isDownloading && !error && (
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
        )}
      </div>
    </div>
  );
};

export default DownloadData;
