import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 text-gray-800 mt-auto relative overflow-hidden">

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">
              Explorar la App
            </h3>
            <div className="space-y-3">
              <a 
                href="/history" 
                className="block text-gray-600 hover:text-gray-800 hover:translate-x-2 transition-all duration-300 group"
              >
                <span className="group-hover:text-blue-600">Historial de predicciones</span>
              </a>
              <a 
                href="/predict" 
                className="block text-gray-600 hover:text-gray-800 hover:translate-x-2 transition-all duration-300 group"
              >
                <span className="group-hover:text-blue-600">Realizar predicciones</span>
              </a>
              <a 
                href="/train-models" 
                className="block text-gray-600 hover:text-gray-800 hover:translate-x-2 transition-all duration-300 group"
              >
                <span className="group-hover:text-green-600">Entrenar modelos</span>
              </a>
              <a 
                href="/download-data" 
                className="block text-gray-600 hover:text-gray-800 hover:translate-x-2 transition-all duration-300 group"
              >
                <span className="group-hover:text-yellow-600">Descargar datos</span>
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">
              Sobre el proyecto
            </h3>
            <div className="space-y-2 text-gray-600">
              <p className="text-sm leading-relaxed">
                Aplicación de análisis y predicción de series temporales usando técnicas de Machine Learning.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">React - TSX</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">TensorFlow</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Django</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">
              Desarrollador
            </h3>
            <div className="space-y-3">
              <div className="text-gray-600">
                <p className="text-gray-800">Javier Santos</p>
                <p className="text-sm">Estudiante de Ingeniería Informática Software</p>
                <p className="text-sm">Trabajo Fin de Grado</p>
              </div>
              <div className="space-y-2">
                <a 
                  href="https://github.com/santos-404" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-300 group"
                >
                  <span>Github personal</span>
                </a>
                <a 
                  href="https://github.com/santos-404/time-series-tfg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-300 group"
                >
                  <span>Repositorio del proyecto</span>
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">
              Información Adicional
            </h3>
            <div className="space-y-3 text-gray-600 text-sm">
              <div className="flex items-center space-x-2">
                <span>Universidad de Sevilla</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Curso 2024-2025</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Predicciones personalizadas</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Open source</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 mb-6"></div>

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-gray-600 text-sm">
                2025 TFG - Aplicación web para el análisis del mercado eléctrico español
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Desarrollado por Javier Santos Martín 
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
