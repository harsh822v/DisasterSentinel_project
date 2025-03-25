import { useState } from 'react';
import { Disaster, AlertType, DisasterType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface DisasterListProps {
  disasters: Disaster[];
  onViewDetails: (disaster: Disaster) => void;
}

const DisasterList = ({ disasters, onViewDetails }: DisasterListProps) => {
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewDetails = (disaster: Disaster) => {
    setSelectedDisaster(disaster);
    setIsDialogOpen(true);
    onViewDetails(disaster);
  };

  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case DisasterType.Storm: return 'bolt';
      case DisasterType.Earthquake: return 'vibration';
      case DisasterType.Flood: return 'water';
      case DisasterType.Wildfire: return 'local_fire_department';
      default: return 'warning';
    }
  };

  const getAlertStyleClasses = (alertType: AlertType) => {
    switch (alertType) {
      case AlertType.Warning:
        return {
          border: 'border-l-4 border-red-500',
          bg: 'bg-red-50 dark:bg-red-900/20',
          badge: 'text-red-500 bg-red-100 dark:bg-red-900/40',
          icon: 'text-red-500'
        };
      case AlertType.Watch:
        return {
          border: 'border-l-4 border-amber-500',
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          badge: 'text-amber-500 bg-amber-100 dark:bg-amber-900/40',
          icon: 'text-amber-500'
        };
      case AlertType.Advisory:
        return {
          border: 'border-l-4 border-green-500',
          bg: 'bg-green-50 dark:bg-green-900/20',
          badge: 'text-green-500 bg-green-100 dark:bg-green-900/40',
          icon: 'text-green-500'
        };
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffMins < 60) {
      return `Updated ${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHrs < 24) {
      return `Updated ${diffHrs} hr${diffHrs !== 1 ? 's' : ''} ago`;
    } else {
      return `Updated ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="space-y-3">
      <ScrollArea className="h-[400px] pr-4">
        <AnimatePresence>
          {disasters.map((disaster) => {
            const styles = getAlertStyleClasses(disaster.alertType);
            
            return (
              <motion.div
                key={disaster.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`${styles.border} ${styles.bg} p-3 rounded-r-md mb-3`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium flex items-center">
                      <span className={`material-icons mr-1 ${styles.icon}`}>
                        {getDisasterIcon(disaster.type)}
                      </span>
                      <span>{disaster.title}</span>
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {disaster.location}
                    </p>
                  </div>
                  <span className={`${styles.badge} px-2 py-0.5 rounded-full text-xs font-medium`}>
                    {disaster.alertType.charAt(0).toUpperCase() + disaster.alertType.slice(1)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {formatTimeAgo(disaster.timestamp)}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary p-0 h-auto"
                    onClick={() => handleViewDetails(disaster)}
                  >
                    View Details
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </ScrollArea>

      {disasters.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <span className="material-icons text-3xl mb-2">search_off</span>
          <p>No disasters found with current filters</p>
        </div>
      )}

      {/* Disaster Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedDisaster && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <span className="material-icons mr-2">
                    {getDisasterIcon(selectedDisaster.type)}
                  </span>
                  {selectedDisaster.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedDisaster.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Location:</span>
                  <span className="font-medium">{selectedDisaster.location}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Reported:</span>
                  <span className="font-medium font-mono">
                    {new Date(selectedDisaster.timestamp).toLocaleString()}
                  </span>
                </div>
                {selectedDisaster.validUntil && (
                  <div className="flex justify-between text-sm mt-1">
                    <span>Valid Until:</span>
                    <span className="font-medium font-mono">
                      {new Date(selectedDisaster.validUntil).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-1">
                  <span>Source:</span>
                  <span className="font-medium">{selectedDisaster.source}</span>
                </div>
                
                {/* Additional details based on disaster type */}
                {selectedDisaster.type === DisasterType.Earthquake && selectedDisaster.data.magnitude && (
                  <div className="flex justify-between text-sm mt-1">
                    <span>Magnitude:</span>
                    <span className="font-medium">{selectedDisaster.data.magnitude}</span>
                  </div>
                )}
                
                {selectedDisaster.type === DisasterType.Storm && selectedDisaster.data.windSpeed && (
                  <div className="flex justify-between text-sm mt-1">
                    <span>Wind Speed:</span>
                    <span className="font-medium">{selectedDisaster.data.windSpeed} mph</span>
                  </div>
                )}
                
                {selectedDisaster.type === DisasterType.Flood && selectedDisaster.data.rainfall && (
                  <div className="flex justify-between text-sm mt-1">
                    <span>Rainfall:</span>
                    <span className="font-medium">{selectedDisaster.data.rainfall} inches</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2 mt-4">
                <Button 
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    setIsDialogOpen(false);
                    // Trigger map focus on this disaster
                  }}
                >
                  <span className="material-icons mr-2">map</span>
                  View on Map
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisasterList;
