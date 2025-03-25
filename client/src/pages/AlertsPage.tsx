import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Disaster, AlertType, DisasterType } from '@/lib/types';
import { getDisasters } from '@/lib/api';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const AlertsPage = () => {
  const [activeTab, setActiveTab] = useState<AlertType | 'all'>('all');
  
  const { data: disasters = [], isLoading } = useQuery<Disaster[]>({
    queryKey: ['/api/disasters', { period: '30d' }],
    queryFn: () => getDisasters({ timeRange: '30d' }),
  });
  
  const filteredDisasters = activeTab === 'all' 
    ? disasters 
    : disasters.filter(d => d.alertType === activeTab);
  
  // Group disasters by type
  const groupedDisasters = filteredDisasters.reduce<Record<DisasterType, Disaster[]>>((acc, disaster) => {
    if (!acc[disaster.type]) {
      acc[disaster.type] = [];
    }
    acc[disaster.type].push(disaster);
    return acc;
  }, {} as Record<DisasterType, Disaster[]>);
  
  const getAlertTypeColor = (alertType: AlertType) => {
    switch (alertType) {
      case 'warning': return 'bg-red-500 text-white';
      case 'watch': return 'bg-amber-500 text-white';
      case 'advisory': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
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
  
  const getDisasterTypeTitle = (type: DisasterType) => {
    switch (type) {
      case DisasterType.Storm: return 'Storms & Severe Weather';
      case DisasterType.Earthquake: return 'Earthquakes & Seismic Activity';
      case DisasterType.Flood: return 'Floods & Water Hazards';
      case DisasterType.Wildfire: return 'Wildfires & Fire Hazards';
      default: return 'Other Hazards';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Alert Center</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Stay informed about all active and recent natural disaster alerts in your area.
        </p>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as AlertType | 'all')}>
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all" className="flex items-center">
              <span className="material-icons text-sm mr-1">notifications</span>
              All Alerts
              <Badge variant="outline" className="ml-2">{disasters.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="warning" className="flex items-center">
              <span className="material-icons text-sm mr-1 text-red-500">warning</span>
              Warnings
              <Badge variant="outline" className="ml-2 bg-red-100 dark:bg-red-900/20 text-red-500">
                {disasters.filter(d => d.alertType === 'warning').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="watch" className="flex items-center">
              <span className="material-icons text-sm mr-1 text-amber-500">visibility</span>
              Watches
              <Badge variant="outline" className="ml-2 bg-amber-100 dark:bg-amber-900/20 text-amber-500">
                {disasters.filter(d => d.alertType === 'watch').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="advisory" className="flex items-center">
              <span className="material-icons text-sm mr-1 text-green-500">info</span>
              Advisories
              <Badge variant="outline" className="ml-2 bg-green-100 dark:bg-green-900/20 text-green-500">
                {disasters.filter(d => d.alertType === 'advisory').length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-7 w-64 mb-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-28 w-full" />
                      <Skeleton className="h-28 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {Object.entries(groupedDisasters).length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-icons text-5xl text-gray-400 mb-4">notifications_off</span>
                  <h3 className="text-xl font-medium mb-2">No Alerts Found</h3>
                  <p className="text-gray-500">
                    There are no active alerts matching your current filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedDisasters).map(([type, disasters]) => (
                    <Card key={type}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-xl">
                          <span className="material-icons mr-2">{getDisasterIcon(type as DisasterType)}</span>
                          {getDisasterTypeTitle(type as DisasterType)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {disasters.map((disaster) => (
                            <div 
                              key={disaster.id}
                              className="border border-gray-200 dark:border-gray-700 rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium">{disaster.title}</h3>
                                <Badge className={getAlertTypeColor(disaster.alertType)}>
                                  {disaster.alertType.charAt(0).toUpperCase() + disaster.alertType.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {disaster.description.length > 120 
                                  ? `${disaster.description.substring(0, 120)}...` 
                                  : disaster.description}
                              </p>
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>{disaster.location}</span>
                                <span>{new Date(disaster.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertsPage;
