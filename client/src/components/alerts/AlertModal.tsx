import { useEffect } from 'react';
import { Disaster } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertModalProps {
  disaster: Disaster | null;
  isOpen: boolean;
  onClose: () => void;
  onViewOnMap: (disaster: Disaster) => void;
}

const AlertModal = ({ disaster, isOpen, onClose, onViewOnMap }: AlertModalProps) => {
  // Play sound alert when the modal opens with a disaster
  useEffect(() => {
    if (isOpen && disaster) {
      const audio = new Audio('/alert-sound.mp3');
      audio.play().catch(e => console.log('Audio play prevented:', e));
    }
  }, [isOpen, disaster]);

  if (!disaster) return null;

  const getDisasterIcon = () => {
    switch (disaster.type) {
      case 'earthquake': return 'vibration';
      case 'flood': return 'water';
      case 'storm': return 'bolt';
      case 'wildfire': return 'local_fire_department';
      default: return 'warning';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <AnimatePresence>
          {isOpen && disaster && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-red-500 text-white p-4 rounded-t-lg -mt-6 -mx-6 mb-4 flex items-center">
                <span className="material-icons text-2xl mr-2">warning</span>
                <h2 className="text-xl font-bold">Emergency Alert</h2>
              </div>
              
              <DialogHeader>
                <DialogTitle className="text-lg font-medium mb-2">
                  {disaster.title}
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {disaster.description}
                </p>
              </DialogHeader>
              
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mb-4">
                <div className="flex justify-between text-sm">
                  <span>Location:</span>
                  <span className="font-medium">{disaster.location}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Time Issued:</span>
                  <span className="font-medium font-mono">{formatDate(disaster.timestamp)}</span>
                </div>
                {disaster.validUntil && (
                  <div className="flex justify-between text-sm mt-1">
                    <span>Valid Until:</span>
                    <span className="font-medium font-mono">{formatDate(disaster.validUntil)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-1">
                  <span>Source:</span>
                  <span className="font-medium">{disaster.source}</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  className="py-2 bg-red-500 text-white hover:bg-red-600"
                  onClick={() => {
                    onViewOnMap(disaster);
                    onClose();
                  }}
                >
                  View on Map
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                >
                  Dismiss
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;
