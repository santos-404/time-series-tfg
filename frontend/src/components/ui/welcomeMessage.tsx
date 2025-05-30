import { Brain, Download, TrendingUp, ArrowRight } from 'lucide-react';

const WelcomeMessage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full">
      <div className="text-center mb-8">
        <div className="text-blue-500 mb-4">
          <Brain size={64} className="mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Bienvenido a la aplicación web del TFG de Javier Santos!
        </h1>
        <p className="text-gray-600 text-lg">
          Aquí podrás entrenar modelos de redes neuronales y realizar predicciones sobre 
          series temporales con datos reales.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="text-blue-500 mt-1">
              <TrendingUp size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Listo para hacer predicciones?
              </h3>
              <p className="text-gray-700 mb-3">
                Puedes empezar a usar los modelos pre-entrenados inmediatamente para generar predicciones en tiempo real.
              </p>
              <a 
                href="/predict" 
                className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                Ir a Predicciones
                <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <div className="flex items-start space-x-4">
            <div className="text-green-500 mt-1">
              <Download size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Quieres ver los datos históricos?
              </h3>
              <p className="text-gray-700 mb-3">
                Para acceder a todas las funcionalidades del dashboard, incluyendo visualizaciones históricas y análisis completos, descarga el conjunto de datos.
              </p>
              <a 
                href="/download-data" 
                className="inline-flex items-center text-green-600 font-medium hover:text-green-700 transition-colors"
              >
                Descargar Datos
                <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-gray-500 text-sm">
            Una vez descargados los datos, recarga la página para ver el dashboard completo
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default WelcomeMessage;
