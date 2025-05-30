import { useState, useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import OverviewSection from '@/components/dashboard/OverviewSection';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Loading from '@/components/ui/loading';
import WelcomeMessage from '@/components/ui/welcomeMessage';
import type { HistoricalData } from '@/types/HistoricalData';

// I obviously know that is not a good practice. But this is not aim to be deployed
const API_URL = 'http://127.0.0.1:7777'

const TimeSeriesDashboard = () => {
  // These are the default values, They might be changed. And I think is a good idea to set groups of features 
  const [selectedMetrics, setSelectedMetrics] = useState(['hydraulic_1', 'solar_14', 'wind_12', 'nuclear_4']);
  
  const { data: historicalData, loading, error } = useFetch<HistoricalData>(`${API_URL}/api/v1/historical`);

  const processedData = useMemo(() => {
    if (!historicalData?.data) return [];
    
    return historicalData.data.map(item => ({
      ...item,
      date: new Date(item.datetime).toLocaleDateString(),
      day: new Date(item.datetime).getDate(),
      fullDate: new Date(item.datetime)
    }));
  }, [historicalData]);

  if (loading) return <Loading />;
  if (error || !historicalData?.data) return <WelcomeMessage />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader/>
        <OverviewSection 
          data={processedData}
          selectedMetrics={selectedMetrics}
          setSelectedMetrics={setSelectedMetrics}
        />
      </div>
    </div>
  );
};

export default TimeSeriesDashboard;
