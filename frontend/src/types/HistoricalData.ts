export interface HistoricalData {
  data: HistoricalDataRecord[];
  columns: EnergyDataColumn[];
  count: number;
  time_range: TimeRange;
}

interface HistoricalDataRecord {
  datetime: string; // ISO 8601 
  daily_spot_market_600_España: number;
  daily_spot_market_600_Portugal: number;
  scheduled_demand_365: number;
  scheduled_demand_358: number;
  scheduled_demand_372: number;
  peninsula_forecast_460: number;
  hydraulic_71: number;
  hydraulic_36: number;
  hydraulic_1: number;
  solar_14: number;
  wind_12: number;
  nuclear_39: number;
  nuclear_4: number;
  nuclear_74: number;
  average_demand_price_573_Baleares: number;
  average_demand_price_573_Canarias: number;
  average_demand_price_573_Ceuta: number;
  average_demand_price_573_Melilla: number;
}

interface TimeRange {
  start: string; // ISO 8601 
  end: string;   // ISO 8601 
}

type EnergyDataColumn = 
  | 'daily_spot_market_600_España'
  | 'daily_spot_market_600_Portugal'
  | 'scheduled_demand_365'
  | 'scheduled_demand_358'
  | 'scheduled_demand_372'
  | 'peninsula_forecast_460'
  | 'hydraulic_71'
  | 'hydraulic_36'
  | 'hydraulic_1'
  | 'solar_14'
  | 'wind_12'
  | 'nuclear_39'
  | 'nuclear_4'
  | 'nuclear_74'
  | 'average_demand_price_573_Baleares'
  | 'average_demand_price_573_Canarias'
  | 'average_demand_price_573_Ceuta'
  | 'average_demand_price_573_Melilla';

