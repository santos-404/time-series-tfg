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
        <Header />
        <ESIOSInfo />
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
          <DownloadResults
            downloadResults={downloadResults}
            isMerging={isMerging}
            onMergeData={handleMergeData}
          />
        )}

        {mergeResults && <MergeResults mergeResults={mergeResults} />}

        {!downloadResults && !isDownloading && !error && <EmptyState />}
      </div>
    </div>
  );
};

export default DownloadData;
