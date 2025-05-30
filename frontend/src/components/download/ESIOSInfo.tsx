const ESIOSInfo = () => (
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
);

export default ESIOSInfo;
