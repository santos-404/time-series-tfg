export interface DownloadConfigProps {
  esiosToken: string;
  setEsiosToken: (token: string) => void;
  yearsBack: number;
  setYearsBack: (years: number) => void;
  downloadIndicators: boolean;
  setDownloadIndicators: (download: boolean) => void;
  isDownloading: boolean;
  onDownload: () => void;
}

