import { useQuery } from '@tanstack/react-query';
import { EmergencyResource, Location } from '@/lib/types';
import { getEmergencyResources } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface EmergencyResourcesProps {
  userLocation: Location | null;
  onViewOnMap: () => void;
}

const EmergencyResources = ({ userLocation, onViewOnMap }: EmergencyResourcesProps) => {
  const { data: resources, isLoading } = useQuery<EmergencyResource[]>({
    queryKey: ['/api/resources', userLocation?.latitude, userLocation?.longitude],
    queryFn: () => userLocation ? getEmergencyResources(userLocation) : Promise.resolve([]),
    enabled: !!userLocation,
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'hospital': return 'local_hospital';
      case 'shelter': return 'meeting_room';
      case 'emergency': return 'emergency';
      case 'firestation': return 'local_fire_department';
      case 'policestation': return 'local_police';
      default: return 'help';
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'shelter': return 'bg-green-50 dark:bg-green-900/20';
      case 'emergency': return 'bg-red-50 dark:bg-red-900/20';
      case 'firestation': return 'bg-amber-50 dark:bg-amber-900/20';
      case 'policestation': return 'bg-purple-50 dark:bg-purple-900/20';
      default: return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  const getResourceIconColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'text-blue-500';
      case 'shelter': return 'text-green-500';
      case 'emergency': return 'text-red-500';
      case 'firestation': return 'text-amber-500';
      case 'policestation': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-medium mb-4">Emergency Resources</h2>
      
      <div className="space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        )}
        
        {!isLoading && (!resources || resources.length === 0) && (
          <div className="text-center py-6 text-gray-500">
            {!userLocation ? (
              <p>Set your location to see nearby emergency resources</p>
            ) : (
              <p>No emergency resources found in your area</p>
            )}
          </div>
        )}
        
        {resources && resources.length > 0 && (
          <>
            {/* Emergency Services */}
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              <h3 className="font-medium flex items-center">
                <span className="material-icons mr-1 text-red-500">emergency</span>
                Emergency Services
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Call 911 for immediate assistance</p>
            </div>
            
            {/* Nearest Hospital */}
            {resources.find(r => r.type === 'hospital') && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <h3 className="font-medium flex items-center">
                  <span className="material-icons mr-1 text-blue-500">local_hospital</span>
                  Nearest Hospital
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {resources.find(r => r.type === 'hospital')?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {resources.find(r => r.type === 'hospital')?.distance.toFixed(1)} miles away
                </p>
              </div>
            )}
            
            {/* Evacuation Shelters */}
            {resources.find(r => r.type === 'shelter') && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                <h3 className="font-medium flex items-center">
                  <span className="material-icons mr-1 text-green-500">meeting_room</span>
                  Evacuation Shelters
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {resources.find(r => r.type === 'shelter')?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {resources.find(r => r.type === 'shelter')?.distance.toFixed(1)} miles away • 
                  {resources.find(r => r.type === 'shelter')?.isOpen ? ' Currently open' : ' Currently closed'}
                </p>
              </div>
            )}
            
            <Button
              variant="outline"
              className="w-full mt-2 text-primary border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={onViewOnMap}
            >
              <span className="material-icons mr-1 text-sm">map</span>
              View All Resources on Map
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmergencyResources;
