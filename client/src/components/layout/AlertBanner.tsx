import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertBannerProps {
  message: string;
  onClose: () => void;
}

const AlertBanner = ({ message, onClose }: AlertBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
    }
  }, [message]);

  const handleClose = () => {
    setIsVisible(false);
    // Delay the execution of onClose until after the animation
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-red-500 text-white py-2 px-4 alert-pulse"
        >
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <span className="material-icons mr-2">warning</span>
              <span>{message}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-gray-200"
              onClick={handleClose}
            >
              <span className="material-icons">close</span>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertBanner;
