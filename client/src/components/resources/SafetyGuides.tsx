import { useQuery } from '@tanstack/react-query';
import { SafetyGuide, DisasterType } from '@/lib/types';
import { getSafetyGuides } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const SafetyGuides = () => {
  const { data: guides, isLoading } = useQuery<SafetyGuide[]>({
    queryKey: ['/api/guides'],
    queryFn: () => getSafetyGuides(),
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Get gradient colors based on disaster type
  const getGradient = (type: DisasterType) => {
    switch (type) {
      case DisasterType.Storm:
        return 'from-blue-500 to-blue-700';
      case DisasterType.Earthquake:
        return 'from-amber-500 to-amber-700';
      case DisasterType.Flood:
        return 'from-cyan-500 to-cyan-700';
      case DisasterType.Wildfire:
        return 'from-red-500 to-red-700';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case DisasterType.Storm: return 'flash_on';
      case DisasterType.Earthquake: return 'vibration';
      case DisasterType.Flood: return 'water';
      case DisasterType.Wildfire: return 'local_fire_department';
      default: return 'warning';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Safety Guides</h2>
        <Button variant="link" className="text-primary hover:text-blue-700 text-sm font-medium p-0">
          View All
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 h-40">
              <Skeleton className="h-6 w-36 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {guides?.slice(0, 4).map((guide) => (
            <motion.div
              key={guide.id}
              className={`bg-gradient-to-br ${getGradient(guide.disasterType)} text-white rounded-lg p-4 relative overflow-hidden`}
              variants={itemVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="absolute right-0 bottom-0 opacity-20">
                <span className="material-icons text-6xl">{getDisasterIcon(guide.disasterType)}</span>
              </div>
              <h3 className="text-lg font-medium mb-2">{guide.title}</h3>
              <p className="text-sm mb-4">{guide.description}</p>
              <Button
                variant="link"
                className="text-white text-sm font-medium flex items-center p-0"
                asChild
              >
                <a href={guide.url} target="_blank" rel="noopener noreferrer">
                  View Guide <span className="material-icons ml-1 text-sm">arrow_forward</span>
                </a>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default SafetyGuides;
