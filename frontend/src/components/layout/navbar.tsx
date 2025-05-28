import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <nav className="p-6 border-b border-gray-300">      
      <div className="container mx-auto flex items-center justify-between">
        <a href="/" className="text-lg font-semibold">TFG - Javier Santos</a>
        
        <div> 
          <a href="/predict" className="mx-4 font-semibold">Predecir</a>
          <a href="/train-models" className="mx-4 font-semibold">Entrena un modelo</a>
          <a href="/downloads" className="mx-4 font-semibold">Descargar datos</a>
        </div>
      </div>
    </nav>
  );
};

