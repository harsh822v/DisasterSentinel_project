import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Disaster, Location, DisasterType, AlertType } from '@/lib/types';
import { motion } from 'framer-motion';

// Components
import LocationSelector from '@/components/locations/LocationSelector';
import DisasterFilters from '@/components/disasters/DisasterFilters';
import DisasterList from '@/components/disasters/DisasterList';
import DisasterMap from '@/components/map/DisasterMap';
import DisasterStats from '@/components/disasters/DisasterStats';
import AlertPreferences from '@/components/alerts/AlertPreferences';
import EmergencyResources from '@/components/resources/EmergencyResources';
import SafetyGuides from '@/components/resources/SafetyGuides';
import AlertModal from '@/components/alerts/AlertModal';

// API
import { getDisasters, detectUserLocation } from '@/lib/api';

const Dashboard = () => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [filters, setFilters] = useState({
    types: [] as DisasterType[],
    alertTypes: [] as AlertType[],
    timeRange: '24h',
  });
  const [focusedDisaster, setFocusedDisaster] = useState<Disaster | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  
  // Auto-detect user location on first load
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const location = await detectUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.error("Failed to detect location:", error);
      }
    };
    
    loadLocation();
  }, []);
  
  // Fetch disasters based on location and filters
  const { data: disasters = [], isLoading } = useQuery<Disaster[]>({
    queryKey: ['/api/disasters', filters, userLocation],
    queryFn: () => getDisasters({
      types: filters.types.length > 0 ? filters.types : undefined,
      alertTypes: filters.alertTypes.length > 0 ? filters.alertTypes : undefined,
      timeRange: filters.timeRange,
      location: userLocation || undefined,
      radius: 100
    }),
    refetchInterval: 60000, // Refresh every minute
  });
  
  // Check for severe disasters and show alert modal
  useEffect(() => {
    if (disasters.length > 0) {
      const severeDisasters = disasters.filter(d => d.alertType === 'warning');
      if (severeDisasters.length > 0) {
        const latestSevere = severeDisasters.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        
        // Only show alert modal for new warnings
        if (new Date(latestSevere.timestamp).getTime() > Date.now() - 300000) { // 5 minutes
          setFocusedDisaster(latestSevere);
          setIsAlertModalOpen(true);
        }
      }
    }
  }, [disasters]);
  
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };
  
  const handleDisasterSelect = (disaster: Disaster) => {
    setFocusedDisaster(disaster);
  };
  
  const handleAlertModalClose = () => {
    setIsAlertModalOpen(false);
  };
  
  const handleViewOnMap = (disaster: Disaster) => {
    setFocusedDisaster(disaster);
  };

  return (
    <main className="container mx-auto px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Sidebar - Disaster List & Filters */}
        <div className="md:col-span-1 space-y-4">
          {/* Location Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
          >
            <div className="flex items-center space-x-2 mb-4">
              <span className="material-icons text-gray-500">location_on</span>
              <h2 className="text-lg font-medium">Your Location</h2>
            </div>
            
            <LocationSelector
              onLocationSelect={setUserLocation}
              initialLocation={userLocation}
            />
          </motion.div>
          
          {/* Disaster Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Disaster Filters</h2>
            </div>
            
            <DisasterFilters onFilterChange={handleFilterChange} />
          </motion.div>
          
          {/* Active Disasters List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Active Disasters</h2>
              {disasters.filter(d => d.alertType === 'warning').length > 0 && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                  {disasters.filter(d => d.alertType === 'warning').length} Warning{disasters.filter(d => d.alertType === 'warning').length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <DisasterList 
              disasters={disasters}
              onViewDetails={handleDisasterSelect}
            />
          </motion.div>
        </div>
        
        {/* Main Map Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="md:col-span-2"
        >
          <DisasterMap
            disasters={disasters}
            userLocation={userLocation || undefined}
            onMarkerClick={handleDisasterSelect}
            focusedDisaster={focusedDisaster || undefined}
          />
        </motion.div>
      </div>
      
      {/* Statistics and Analysis Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <DisasterStats />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <AlertPreferences />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <EmergencyResources 
            userLocation={userLocation} 
            onViewOnMap={() => {}} 
          />
        </motion.div>
      </div>
      
      {/* Safety Guides Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="mt-6"
      >
        <SafetyGuides />
      </motion.div>
      
      {/* Emergency Alert Modal */}
      <AlertModal
        disaster={focusedDisaster}
        isOpen={isAlertModalOpen}
        onClose={handleAlertModalClose}
        onViewOnMap={handleViewOnMap}
      />
    </main>
  );
};

export default Dashboard;
