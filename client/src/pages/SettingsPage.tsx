import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertPreferences, DisasterType, Location } from '@/lib/types';
import { getSavedLocations, saveLocation, deleteSavedLocation, getAlertPreferences, saveAlertPreferences } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import LocationSelector from '@/components/locations/LocationSelector';

const SettingsPage = () => {
  const [preferences, setPreferences] = useState<AlertPreferences>({
    emergencyWarnings: true,
    watchesAdvisories: true,
    smsNotifications: false,
    emailAlerts: true,
    disasterTypes: [DisasterType.Earthquake, DisasterType.Storm, DisasterType.Flood, DisasterType.Wildfire],
    notificationRadius: 50
  });
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get saved preferences
  const { data: savedPreferences } = useQuery({
    queryKey: ['/api/preferences'],
    queryFn: getAlertPreferences,
    onSuccess: (data) => {
      if (data) {
        setPreferences(data);
      }
    },
    onError: () => {
      toast({
        title: "Error loading preferences",
        description: "Could not load your alert preferences. Using defaults.",
        variant: "destructive",
      });
    }
  });
  
  // Get saved locations
  const { data: savedLocations = [] } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: getSavedLocations,
  });
  
  // Save preferences mutation
  const savePrefsMutation = useMutation({
    mutationFn: (newPreferences: AlertPreferences) => saveAlertPreferences(newPreferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
      toast({
        title: "Preferences saved",
        description: "Your alert preferences have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save preferences",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Save location mutation
  const saveLocationMutation = useMutation({
    mutationFn: (location: { name: string, latitude: number, longitude: number }) => saveLocation(location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      setNewLocationName('');
      setSelectedLocation(null);
      toast({
        title: "Location saved",
        description: "Your monitoring location has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save location",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: (id: string) => deleteSavedLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({
        title: "Location removed",
        description: "The monitoring location has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove location",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleDisasterTypeToggle = (type: DisasterType) => {
    setPreferences(prev => {
      const disasterTypes = prev.disasterTypes.includes(type)
        ? prev.disasterTypes.filter(t => t !== type)
        : [...prev.disasterTypes, type];
      
      return {
        ...prev,
        disasterTypes
      };
    });
  };
  
  const handleNotificationRadiusChange = (value: number[]) => {
    setPreferences(prev => ({
      ...prev,
      notificationRadius: value[0]
    }));
  };
  
  const handleSavePreferences = () => {
    savePrefsMutation.mutate(preferences);
  };
  
  const handleSaveLocation = () => {
    if (!selectedLocation) {
      toast({
        title: "No location selected",
        description: "Please select a location first",
        variant: "destructive",
      });
      return;
    }
    
    if (!newLocationName.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for this location",
        variant: "destructive",
      });
      return;
    }
    
    saveLocationMutation.mutate({
      name: newLocationName,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your disaster monitoring preferences and saved locations
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="material-icons mr-2">notifications_active</span>
              Alert Preferences
            </CardTitle>
            <CardDescription>
              Choose which types of alerts you want to receive and how
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-red-500">warning</span>
                  <Label htmlFor="emergency-warnings">Emergency Warnings</Label>
                </div>
                <Switch
                  id="emergency-warnings"
                  checked={preferences.emergencyWarnings}
                  onCheckedChange={() => handleToggle('emergencyWarnings')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-amber-500">notifications</span>
                  <Label htmlFor="watches-advisories">Watches & Advisories</Label>
                </div>
                <Switch
                  id="watches-advisories"
                  checked={preferences.watchesAdvisories}
                  onCheckedChange={() => handleToggle('watchesAdvisories')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-gray-500">sms</span>
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={preferences.smsNotifications}
                  onCheckedChange={() => handleToggle('smsNotifications')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-gray-500">email</span>
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                </div>
                <Switch
                  id="email-alerts"
                  checked={preferences.emailAlerts}
                  onCheckedChange={() => handleToggle('emailAlerts')}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label className="mb-2 block">Notification Radius</Label>
              <div className="flex items-center space-x-2">
                <Slider 
                  value={[preferences.notificationRadius]} 
                  min={5} 
                  max={100} 
                  step={5}
                  onValueChange={handleNotificationRadiusChange}
                  className="flex-1"
                />
                <span className="w-12 text-right">{preferences.notificationRadius} km</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                You'll receive alerts for disasters within this distance from your locations
              </p>
            </div>
            
            <Separator />
            
            <div>
              <Label className="mb-2 block">Disaster Types</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="earthquake" 
                    checked={preferences.disasterTypes.includes(DisasterType.Earthquake)}
                    onCheckedChange={() => handleDisasterTypeToggle(DisasterType.Earthquake)}
                  />
                  <Label htmlFor="earthquake" className="flex items-center">
                    <span className="material-icons mr-1 text-sm">vibration</span>
                    Earthquakes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="storm" 
                    checked={preferences.disasterTypes.includes(DisasterType.Storm)}
                    onCheckedChange={() => handleDisasterTypeToggle(DisasterType.Storm)}
                  />
                  <Label htmlFor="storm" className="flex items-center">
                    <span className="material-icons mr-1 text-sm">bolt</span>
                    Storms
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="flood" 
                    checked={preferences.disasterTypes.includes(DisasterType.Flood)}
                    onCheckedChange={() => handleDisasterTypeToggle(DisasterType.Flood)}
                  />
                  <Label htmlFor="flood" className="flex items-center">
                    <span className="material-icons mr-1 text-sm">water</span>
                    Floods
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="wildfire" 
                    checked={preferences.disasterTypes.includes(DisasterType.Wildfire)}
                    onCheckedChange={() => handleDisasterTypeToggle(DisasterType.Wildfire)}
                  />
                  <Label htmlFor="wildfire" className="flex items-center">
                    <span className="material-icons mr-1 text-sm">local_fire_department</span>
                    Wildfires
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleSavePreferences}
              disabled={savePrefsMutation.isPending}
            >
              {savePrefsMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Locations Management */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="material-icons mr-2">location_on</span>
                Monitored Locations
              </CardTitle>
              <CardDescription>
                Add places you want to monitor for potential disasters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedLocations.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <span className="material-icons text-3xl mb-2">not_listed_location</span>
                    <p>No saved locations yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedLocations.map((location: Location & { id?: string }) => (
                      <div key={location.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          <span className="material-icons text-blue-500 mr-2">place</span>
                          <span>{location.name}</span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <span className="material-icons text-red-500">delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Location</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove "{location.name}" from your monitored locations?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => location.id && deleteLocationMutation.mutate(location.id)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Add New Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location-name">Location Name</Label>
                <Input 
                  id="location-name" 
                  placeholder="Home, Work, Family, etc."
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="mb-2 block">Choose Location</Label>
                <LocationSelector
                  onLocationSelect={setSelectedLocation}
                  initialLocation={selectedLocation}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={handleSaveLocation}
                disabled={saveLocationMutation.isPending || !selectedLocation || !newLocationName.trim()}
              >
                {saveLocationMutation.isPending ? 'Saving...' : 'Add Location'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Contact Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="material-icons mr-2">contact_phone</span>
            Contact Information
          </CardTitle>
          <CardDescription>
            Update your contact details for emergency notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex mt-1">
                <Input 
                  id="phone" 
                  placeholder="(123) 456-7890" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={!preferences.smsNotifications}
                />
              </div>
              {!preferences.smsNotifications && (
                <p className="text-xs text-gray-500 mt-1">
                  Enable SMS notifications to update your phone number
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex mt-1">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!preferences.emailAlerts}
                />
              </div>
              {!preferences.emailAlerts && (
                <p className="text-xs text-gray-500 mt-1">
                  Enable email alerts to update your email address
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Update Contact Information</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SettingsPage;
