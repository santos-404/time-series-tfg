export interface LatestDateInfo {
  latest_date: string;
  oldest_date: string;
  total_days_available: number;
  total_records: number;
  timezone: string;
  suggested_defaults: {
    end_date: string;
    days_30: string;
    days_90: string;
    days_365: string;
  };
}
