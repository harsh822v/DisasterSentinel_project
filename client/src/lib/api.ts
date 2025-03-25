import { Disaster, DisasterType, AlertType, Location, EmergencyResource, SafetyGuide, DisasterStats } from './types';
import { apiRequest } from './queryClient';

// Location API
export async function searchLocation(query: string): Promise<Location[]> {
  const res = await fetch(`/api/geocode?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search locations');
  return await res.json();
}

export async function detectUserLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/reverseGeocode?lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error('Failed to get location name');
          const locationData = await res.json();
          resolve(locationData);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      }
    );
  });
}

// Disaster APIs
export async function getDisasters(filters?: {
  types?: DisasterType[],
  alertTypes?: AlertType[],
  timeRange?: string,
  location?: Location,
  radius?: number
}): Promise<Disaster[]> {
  const params = new URLSearchParams();
  
  if (filters?.types?.length) {
    params.append('types', filters.types.join(','));
  }
  if (filters?.alertTypes?.length) {
    params.append('alertTypes', filters.alertTypes.join(','));
  }
  if (filters?.timeRange) {
    params.append('timeRange', filters.timeRange);
  }
  if (filters?.location) {
    params.append('lat', filters.location.latitude.toString());
    params.append('lon', filters.location.longitude.toString());
  }
  if (filters?.radius) {
    params.append('radius', filters.radius.toString());
  }
  
  const res = await fetch(`/api/disasters?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch disasters');
  return await res.json();
}

export async function getDisasterById(id: string): Promise<Disaster> {
  const res = await fetch(`/api/disasters/${id}`);
  if (!res.ok) throw new Error('Failed to fetch disaster details');
  return await res.json();
}

export async function getDisasterStats(): Promise<DisasterStats> {
  const res = await fetch('/api/disasters/stats');
  if (!res.ok) throw new Error('Failed to fetch disaster statistics');
  return await res.json();
}

// Emergency Resources API
export async function getEmergencyResources(
  location: Location,
  radius: number = 10,
  types?: string[]
): Promise<EmergencyResource[]> {
  const params = new URLSearchParams({
    lat: location.latitude.toString(),
    lon: location.longitude.toString(),
    radius: radius.toString()
  });
  
  if (types?.length) {
    params.append('types', types.join(','));
  }
  
  const res = await fetch(`/api/resources?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch emergency resources');
  return await res.json();
}

// Safety Guides API
export async function getSafetyGuides(disasterType?: DisasterType): Promise<SafetyGuide[]> {
  const params = new URLSearchParams();
  if (disasterType) {
    params.append('type', disasterType);
  }
  
  const res = await fetch(`/api/guides?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch safety guides');
  return await res.json();
}

// User Preferences API
export async function saveAlertPreferences(preferences: {
  emergencyWarnings: boolean,
  watchesAdvisories: boolean,
  smsNotifications: boolean,
  emailAlerts: boolean,
  disasterTypes: DisasterType[],
  notificationRadius: number
}): Promise<void> {
  await apiRequest('POST', '/api/preferences', preferences);
}

export async function getAlertPreferences(): Promise<{
  emergencyWarnings: boolean,
  watchesAdvisories: boolean,
  smsNotifications: boolean,
  emailAlerts: boolean,
  disasterTypes: DisasterType[],
  notificationRadius: number
}> {
  const res = await fetch('/api/preferences');
  if (!res.ok) throw new Error('Failed to fetch alert preferences');
  return await res.json();
}

// Save Location API
export async function saveLocation(location: {
  name: string,
  latitude: number,
  longitude: number
}): Promise<void> {
  await apiRequest('POST', '/api/locations', location);
}

export async function getSavedLocations(): Promise<Location[]> {
  const res = await fetch('/api/locations');
  if (!res.ok) throw new Error('Failed to fetch saved locations');
  return await res.json();
}

export async function deleteSavedLocation(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/locations/${id}`);
}
