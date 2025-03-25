import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { saveAlertPreferences, getAlertPreferences } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DisasterType } from '@/lib/types';

const AlertPreferences = () => {
  const [preferences, setPreferences] = useState({
    emergencyWarnings: true,
    watchesAdvisories: true,
    smsNotifications: false,
    emailAlerts: true,
    disasterTypes: [
      DisasterType.Earthquake, 
      DisasterType.Storm, 
      DisasterType.Flood, 
      DisasterType.Wildfire
    ],
    notificationRadius: 50 // km
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/preferences'],
    queryFn: getAlertPreferences,
    onSuccess: (data) => {
      if (data) {
        setPreferences(data);
      }
    },
    onError: () => {
      toast({
        title: "Could not load preferences",
        description: "Using default notification settings",
        variant: "destructive",
      });
    }
  });

  const mutation = useMutation({
    mutationFn: (newPreferences: typeof preferences) => saveAlertPreferences(newPreferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
      toast({
        title: "Preferences saved",
        description: "Your alert preferences have been updated",
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

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePreferences = () => {
    mutation.mutate(preferences);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-medium mb-4">Alert Preferences</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="material-icons text-red-500 mr-2">notifications_active</span>
            <Label htmlFor="emergency-warnings" className="text-sm">Emergency Warnings</Label>
          </div>
          <Switch 
            id="emergency-warnings" 
            checked={preferences.emergencyWarnings}
            onCheckedChange={() => handleToggle('emergencyWarnings')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="material-icons text-amber-500 mr-2">notifications</span>
            <Label htmlFor="watches-advisories" className="text-sm">Watches & Advisories</Label>
          </div>
          <Switch 
            id="watches-advisories" 
            checked={preferences.watchesAdvisories}
            onCheckedChange={() => handleToggle('watchesAdvisories')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="material-icons text-gray-500 mr-2">sms</span>
            <Label htmlFor="sms-notifications" className="text-sm">SMS Notifications</Label>
          </div>
          <Switch 
            id="sms-notifications" 
            checked={preferences.smsNotifications}
            onCheckedChange={() => handleToggle('smsNotifications')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="material-icons text-gray-500 mr-2">email</span>
            <Label htmlFor="email-alerts" className="text-sm">Email Alerts</Label>
          </div>
          <Switch 
            id="email-alerts" 
            checked={preferences.emailAlerts}
            onCheckedChange={() => handleToggle('emailAlerts')}
          />
        </div>
      </div>
      
      <Button 
        className="w-full mt-4"
        onClick={handleSavePreferences}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );
};

export default AlertPreferences;
