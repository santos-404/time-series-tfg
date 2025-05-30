export interface MergeResponse {
  message: string;
  output_file: string;
  processed_files_count: number;
  data_categories: string[];
  merged_rows: number;
  merged_columns: number;
  date_range: {
    start: string | null;
    end: string | null;
  };
  errors: string[] | null;
}

