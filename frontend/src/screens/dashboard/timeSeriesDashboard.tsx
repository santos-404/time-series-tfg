import { useState, useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import OverviewSection from '@/components/dashboard/OverviewSection';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Loading from '@/components/ui/loading';
import WelcomeMessage from '@/components/ui/welcomeMessage';
import WeekNavigation from '@/components/dashboard/WeekNavigation';
import type { HistoricalData } from '@/types/HistoricalData';

// I obviously know that is not a good practice. But this is not aim to be deployed
const API_URL = 'http://127.0.0.1:7777'

const TimeSeriesDashboard = () => {
  // These are the default values, They might be changed. And I think is a good idea to set groups of features 
  const [selectedMetrics, setSelectedMetrics] = useState(['hydraulic_1', 'solar_14', 'wind_12', 'nuclear_4']);
  
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 30)); 
  const [daysToShow, setDaysToShow] = useState(7); 
  
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Build API URL with date parameters
  const apiUrl = `${API_URL}/api/v1/historical?end_date=${formatDateForAPI(currentDate)}&days=${daysToShow}`;
  
  const { data: historicalData, loading, error } = useFetch<HistoricalData>(apiUrl);
  
  const processedData = useMemo(() => {
    if (!historicalData?.data) return [];
    
    return historicalData.data.map(item => ({
      ...item,
      date: new Date(item.datetime).toLocaleDateString(),
      day: new Date(item.datetime).getDate(),
      fullDate: new Date(item.datetime)
    }));
  }, [historicalData]);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToLastWeekOfApril = () => {
    setCurrentDate(new Date(2025, 3, 30)); 
  };

  const canGoToNextWeek = () => {
    const maxDate = new Date(2025, 3, 30); 
    const nextWeekDate = new Date(currentDate);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    return nextWeekDate <= maxDate;
  };

  if (loading) return <Loading />;
  if (error || !historicalData?.data) return <WelcomeMessage />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader/>
        
        {/* Week Navigation Component */}
        <WeekNavigation
          currentDate={currentDate}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          onGoToLastWeekOfApril={goToLastWeekOfApril}
          canGoToNextWeek={canGoToNextWeek()}
          daysToShow={daysToShow}
          setDaysToShow={setDaysToShow}
        />
        
        <OverviewSection 
          data={processedData}
          selectedMetrics={selectedMetrics}
          setSelectedMetrics={setSelectedMetrics}
          currentDate={currentDate}
          daysToShow={daysToShow}
        />
      </div>
    </div>
  );
};

export default TimeSeriesDashboard;
