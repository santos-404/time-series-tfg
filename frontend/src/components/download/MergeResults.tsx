import type { MergeResponse } from "@/types/MergeData";

interface MergeResultsProps {
  mergeResults: MergeResponse;
}

const MergeResults = ({ mergeResults }: MergeResultsProps) => (
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
);

export default MergeResults;
