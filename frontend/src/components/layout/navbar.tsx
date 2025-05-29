import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <nav className="bg-white backdrop-filter backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto flex items-center justify-between p-6">
        <a
          href="/"
          className="text-2xl font-extrabold text-gray-800 hover:text-blue-600 transition-colors duration-200"
        >
          TFG - Javier Santos
        </a>

        <div className="flex space-x-6">
          <a
            href="/predict"
            className="relative text-gray-600 font-medium hover:text-blue-600 transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-600 hover:after:w-full hover:after:transition-all hover:after:duration-300"
          >
            Predecir
          </a>
          <a
            href="/train-models"
            className="relative text-gray-600 font-medium hover:text-blue-600 transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-600 hover:after:w-full hover:after:transition-all hover:after:duration-300"
          >
            Entrena un modelo
          </a>
          <a
            href="/downloads"
            className="relative text-gray-600 font-medium hover:text-blue-600 transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-600 hover:after:w-full hover:after:transition-all hover:after:duration-300"
          >
            Descargar datos
          </a>
        </div>
      </div>
    </nav>
  );
};
