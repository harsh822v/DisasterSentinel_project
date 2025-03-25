import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SafetyGuide, EmergencyResource, DisasterType, Location } from '@/lib/types';
import { getSafetyGuides, getEmergencyResources, detectUserLocation } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const ResourcesPage = () => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  
  // Fetch user location on component mount
  useState(() => {
    detectUserLocation()
      .then(location => setUserLocation(location))
      .catch(err => console.error("Failed to detect location:", err));
  });

  // Fetch safety guides
  const { data: guides = [], isLoading: isLoadingGuides } = useQuery<SafetyGuide[]>({
    queryKey: ['/api/guides'],
    queryFn: () => getSafetyGuides(),
  });

  // Fetch emergency resources based on user location
  const { data: resources = [], isLoading: isLoadingResources } = useQuery<EmergencyResource[]>({
    queryKey: ['/api/resources', userLocation?.latitude, userLocation?.longitude],
    queryFn: () => userLocation ? getEmergencyResources(userLocation, 20) : Promise.resolve([]),
    enabled: !!userLocation,
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Emergency Resources & Safety Guides</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Access critical information and services to help prepare for and respond to natural disasters.
        </p>
      </div>
      
      <Tabs defaultValue="guides" className="mb-6">
        <TabsList className="w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="guides" className="flex-1">
            <span className="material-icons mr-2">menu_book</span>
            Safety Guides
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex-1">
            <span className="material-icons mr-2">local_hospital</span>
            Emergency Services
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="guides">
          <Card>
            <CardHeader>
              <CardTitle>Disaster Preparedness Guides</CardTitle>
              <CardDescription>
                Learn how to prepare for, respond to, and recover from different types of natural disasters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingGuides ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="rounded-lg bg-gray-200 dark:bg-gray-700 h-64">
                      <Skeleton className="h-full w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {guides.map((guide) => (
                    <motion.div
                      key={guide.id}
                      className={`bg-gradient-to-br ${getGradient(guide.disasterType)} text-white rounded-lg p-6 relative overflow-hidden h-full`}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    >
                      <div className="absolute right-0 bottom-0 opacity-20">
                        <span className="material-icons text-8xl">{getDisasterIcon(guide.disasterType)}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{guide.title}</h3>
                      <p className="text-sm mb-6 opacity-90">{guide.description}</p>
                      <Button
                        variant="outline"
                        className="text-white border-white hover:bg-white/20"
                        asChild
                      >
                        <a href={guide.url} target="_blank" rel="noopener noreferrer">
                          <span className="material-icons mr-2 text-sm">open_in_new</span>
                          Read Full Guide
                        </a>
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Emergency Services Near You</span>
                {userLocation && (
                  <Badge variant="outline" className="ml-2">
                    <span className="material-icons text-xs mr-1">location_on</span>
                    {userLocation.name}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Find nearby emergency shelters, hospitals, and other critical services
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!userLocation && !isLoadingResources && (
                <div className="text-center py-10">
                  <span className="material-icons text-5xl text-gray-400 mb-4">location_off</span>
                  <h3 className="text-lg font-medium mb-2">Location Required</h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">
                    We need your location to show nearby emergency services.
                  </p>
                  <Button onClick={() => detectUserLocation().then(setUserLocation)}>
                    <span className="material-icons mr-2">my_location</span>
                    Detect My Location
                  </Button>
                </div>
              )}
              
              {userLocation && isLoadingResources && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <div className="flex items-center">
                        <Skeleton className="h-5 w-5 rounded-full mr-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {userLocation && !isLoadingResources && resources.length === 0 && (
                <div className="text-center py-10">
                  <span className="material-icons text-5xl text-gray-400 mb-4">search_off</span>
                  <h3 className="text-lg font-medium mb-2">No Resources Found</h3>
                  <p className="text-gray-500">
                    We couldn't find any emergency resources in your area.
                  </p>
                </div>
              )}
              
              {userLocation && !isLoadingResources && resources.length > 0 && (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Emergency Services First */}
                  <motion.div
                    variants={itemVariants}
                    className="col-span-full bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-2"
                  >
                    <h3 className="font-bold flex items-center text-lg">
                      <span className="material-icons mr-2 text-red-500">emergency</span>
                      Emergency Services
                    </h3>
                    <p className="text-lg font-bold text-red-600 mt-1">Call 911 for immediate assistance</p>
                  </motion.div>
                  
                  {/* Resource Cards */}
                  {resources.map((resource) => (
                    <motion.div
                      key={resource.id}
                      variants={itemVariants}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <div className="flex items-start mb-2">
                        <span className="material-icons mr-2 text-blue-500">
                          {getResourceIcon(resource.type)}
                        </span>
                        <div>
                          <h3 className="font-medium">{resource.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{resource.address}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-4 text-sm">
                        <span className="text-gray-500">
                          {resource.distance.toFixed(1)} miles away
                        </span>
                        <Badge variant={resource.isOpen ? "default" : "outline"}>
                          {resource.isOpen ? 'Open Now' : 'Closed'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Additional Emergency Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center">
                <span className="material-icons mr-2 text-amber-500">phone</span>
                Emergency Contacts
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="material-icons mr-2 text-red-500">emergency</span>
                <div>
                  <p className="font-medium">Emergency Services</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Call 911</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-blue-500">local_police</span>
                <div>
                  <p className="font-medium">Poison Control</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">1-800-222-1222</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-amber-500">support_agent</span>
                <div>
                  <p className="font-medium">FEMA Helpline</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">1-800-621-3362</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-green-500">psychology</span>
                <div>
                  <p className="font-medium">Disaster Distress Helpline</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">1-800-985-5990</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center">
                <span className="material-icons mr-2 text-blue-500">medical_services</span>
                First Aid Tips
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="material-icons mr-2 text-red-500">healing</span>
                <div>
                  <p className="font-medium">Bleeding</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Apply firm pressure with clean cloth and elevate the wound.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-amber-500">health_and_safety</span>
                <div>
                  <p className="font-medium">CPR</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Push hard and fast in center of chest, about 100-120 compressions per minute.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-green-500">air</span>
                <div>
                  <p className="font-medium">Choking</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Perform abdominal thrusts (Heimlich maneuver) until object is expelled.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-blue-500">water_drop</span>
                <div>
                  <p className="font-medium">Burns</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cool the burn with cool (not cold) running water for 10-15 minutes.</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResourcesPage;
