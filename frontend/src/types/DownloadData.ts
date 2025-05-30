export interface DownloadResponse {
  message: string;
  data_directory: string;
  downloaded_files: string[];
  errors: string[];
}

export interface DownloadResultsProps {
  downloadResults: DownloadResponse;
  isMerging: boolean;
  onMergeData: () => void;
}

