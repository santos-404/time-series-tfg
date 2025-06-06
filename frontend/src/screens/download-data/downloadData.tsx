import DataCategories from "@/components/download/DataCategories";
import DownloadConfig from "@/components/download/DownloadConfig";
import Header from "@/components/download/DownloadHeader";
import DownloadResults from "@/components/download/DownloadResults";
import EmptyState from "@/components/download/EmptyState";
import ErrorDisplay from "@/components/download/ErrorDisplay";
import ESIOSInfo from "@/components/download/ESIOSInfo";
import MergeResults from "@/components/download/MergeResults";
import type { DownloadResponse } from "@/types/DownloadData";
import type { MergeResponse } from "@/types/MergeData";
import { useState } from "react";

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
  const [skipToMerge, setSkipToMerge] = useState(false);

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
      
      // Here I need to wait a bit so the fetch is fully processed and the 
      // div w/ id download-results got injected into the DOM
      setTimeout(() => {
        const el = document.getElementById('download-results');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);

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

  const handleSkipToMerge = () => {
    setSkipToMerge(true);
    setError(null);
    setDownloadResults(null);
    setMergeResults(null);
    
    const mockDownloadResult: DownloadResponse = {
      message: "Datos ya descargados",
      data_directory: "Los datos deben encontrarse en /data",
      downloaded_files: [],
      errors: []
    };
    
    setDownloadResults(mockDownloadResult);
    
    // Here I need to wait a bit so the fetch is fully processed and the 
    // div w/ id download-results got injected into the DOM
    setTimeout(() => {
      const el = document.getElementById('download-results');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Header />
        <ESIOSInfo />
        
        {/* Skip to Merge Option */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Ya tienes los datos descargados?
              </h3>
              <p className="text-gray-600 text-sm">
                Si ya has descargado los datos previamente, puedes ir directamente al proceso de construcción del dataset.
              </p>
            </div>
            <button
              onClick={handleSkipToMerge}
              disabled={isDownloading || isMerging}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap ml-4"
            >
              Ir a Construir Dataset
            </button>
          </div>
        </div>

        <DownloadConfig
          esiosToken={esiosToken}
          setEsiosToken={setEsiosToken}
          yearsBack={yearsBack}
          setYearsBack={setYearsBack}
          downloadIndicators={downloadIndicators}
          setDownloadIndicators={setDownloadIndicators}
          isDownloading={isDownloading}
          onDownload={handleDownloadData}
        />

        <DataCategories />

        {error && <ErrorDisplay error={error} />}

        {downloadResults && (
          <div id="download-results">
            <DownloadResults
              downloadResults={downloadResults}
              isMerging={isMerging}
              onMergeData={handleMergeData}
            />
          </div>
        )}

        {mergeResults && <MergeResults mergeResults={mergeResults} />}

        {!downloadResults && !isDownloading && !error && <EmptyState />}
      </div>
    </div>
  );
};

export default DownloadData;
