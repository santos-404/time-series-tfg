import { useState, useMemo, useEffect } from 'react';
import { useFetch } from '@/hooks/useFetch';
import OverviewSection from '@/components/dashboard/OverviewSection';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Loading from '@/components/ui/loading';
import WelcomeMessage from '@/components/ui/welcomeMessage';
import EnergyMixPieChart from '@/components/dashboard/plots/EnergyMixPieChart';
import DailyAveragesBarChart from '@/components/dashboard/plots/DailyAveragesBarChart';
import HourlyGenerationTrends from '@/components/dashboard/plots/HourlyGenerationTrends';
import GenerationLineChart from '@/components/dashboard/plots/GenerationLineChart';
import RegionalPriceComparison from '@/components/dashboard/plots/RegionalPriceComparision';
import RegionalAveragesBar from '@/components/dashboard/plots/AverageRegionalPrices';
import PriceGenerationScatter from '@/components/dashboard/plots/PriceGenerationScatter';
import DateNavigation from '@/components/dashboard/DateNavigation';
import type { HistoricalData } from '@/types/HistoricalData';

// I obviously know that is not a good practice. But this is not aim to be deployed
const API_URL = 'http://127.0.0.1:7777'

const TimeSeriesDashboard = () => {
  // These are the default values, They might be changed. And I think is a good idea to set groups of features 
  const [selectedMetrics, setSelectedMetrics] = useState(['average_demand_price_573_Canarias', 'average_demand_price_573_Ceuta', 
                                             'average_demand_price_573_Melilla', 'average_demand_price_573_Baleares', 
                                            'daily_spot_market_600_España', 'daily_spot_market_600_Portugal']);
  
  const [latestDateInfo, setLatestDateInfo] = useState(null);
  const [maxDate, setMaxDate] = useState(new Date(2025, 3, 30)); // Fallback default
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 30)); 
  const [daysToShow, setDaysToShow] = useState(7); 
  const [isLoadingLatestDate, setIsLoadingLatestDate] = useState(true);
  
  useEffect(() => {
    const fetchLatestDate = async () => {
      try {
        setIsLoadingLatestDate(true);
        const response = await fetch(`${API_URL}/api/v1/data/latest-date/`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setLatestDateInfo(data);
        
        const latestDate = new Date(data.latest_date + 'T23:59:59');
        setMaxDate(latestDate);
        setCurrentDate(latestDate);
        
      } catch (error) {
        console.error('Error fetching latest date:', error);
      } finally {
        setIsLoadingLatestDate(false);
      }
    };

    fetchLatestDate();
  }, []);
  
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Build API URL with date parameters - only make the call if we have date info
  const apiUrl = currentDate ? `${API_URL}/api/v1/historical?end_date=${formatDateForAPI(currentDate)}&days=${daysToShow}` : null;
  
  const { data: historicalData, loading: historicalLoading, error } = useFetch<HistoricalData>(apiUrl);
  
  const loading = isLoadingLatestDate || historicalLoading;
  
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

  const goToLatestDate = () => {
    setCurrentDate(new Date(maxDate)); 
  };

  const canGoToNextWeek = () => {
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
        
        <DateNavigation
          currentDate={currentDate}
          onPreviousDate={goToPreviousWeek}
          onNextDate={goToNextWeek}
          onGoToLatestDate={goToLatestDate} 
          canGoToNextDate={canGoToNextWeek()}
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

        <div className="space-y-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <HourlyGenerationTrends data={processedData}/> 
            </div>
            <div className="lg:col-span-1">
              <EnergyMixPieChart data={processedData}/>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <RegionalPriceComparison data={processedData}/> 
            </div>
            <div className="lg:col-span-2">
              <RegionalAveragesBar data={processedData}/>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <GenerationLineChart data={processedData}/> 
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <DailyAveragesBarChart data={processedData}/>
            </div>
            <div className="lg:col-span-2">
              <PriceGenerationScatter data={processedData}/> 
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TimeSeriesDashboard;
