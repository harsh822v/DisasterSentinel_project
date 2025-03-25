import { Disaster } from '../../shared/schema';
import { fetchEarthquakeData, filterEarthquakesByLocation } from './usgs';
import { fetchWeatherAlerts, filterAlertsByLocation } from './noaa';
import { fetchCurrentWeather, fetchWeatherOneCall } from './openweathermap';
import { DisasterType, AlertType, mapTimeRangeToValue } from '../utils/alertUtils';

// Get all disasters from all sources
export async function getAllDisasters(options: {
  types?: DisasterType[],
  alertTypes?: AlertType[],
  timeRange?: string,
  latitude?: number,
  longitude?: number,
  radius?: number
} = {}): Promise<Disaster[]> {
  try {
    // Convert time range to the format each API needs
    const timeRange = mapTimeRangeToValue(options.timeRange || '24h');
    
    // Fetch data from all sources concurrently
    const [earthquakes, weatherAlerts, weatherData] = await Promise.all([
      fetchEarthquakeData(timeRange),
      fetchWeatherAlerts(),
      options.latitude && options.longitude
        ? fetchWeatherOneCall(options.latitude, options.longitude)
        : Promise.resolve([])
    ]);
    
    // Combine all disasters
    let allDisasters = [...earthquakes, ...weatherAlerts, ...weatherData];
    
    // Filter by disaster type if specified
    if (options.types && options.types.length > 0) {
      allDisasters = allDisasters.filter(disaster => 
        options.types!.includes(disaster.disasterType as DisasterType)
      );
    }
    
    // Filter by alert type if specified
    if (options.alertTypes && options.alertTypes.length > 0) {
      allDisasters = allDisasters.filter(disaster => 
        options.alertTypes!.includes(disaster.alertType as AlertType)
      );
    }
    
    // Filter by location if coordinates are provided
    if (options.latitude && options.longitude && options.radius) {
      allDisasters = allDisasters.filter(disaster => {
        if (!disaster.latitude || !disaster.longitude) return false;
        
        const distance = calculateDistance(
          options.latitude!,
          options.longitude!,
          parseFloat(disaster.latitude),
          parseFloat(disaster.longitude)
        );
        return distance <= options.radius!;
      });
    }
    
    return allDisasters;
  } catch (error) {
    console.error('Error fetching disasters:', error);
    throw new Error('Failed to fetch disaster data');
  }
}

// Get disasters by location
export async function getDisastersByLocation(
  latitude: number,
  longitude: number,
  radius: number = 100,
  options: {
    types?: DisasterType[],
    alertTypes?: AlertType[],
    timeRange?: string
  } = {}
): Promise<Disaster[]> {
  try {
    // Convert time range to the format each API needs
    const timeRange = mapTimeRangeToValue(options.timeRange || '24h');
    
    // Fetch data from all sources
    const earthquakes = await fetchEarthquakeData(timeRange);
    const weatherAlerts = await fetchWeatherAlerts();
    const weatherData = await fetchWeatherOneCall(latitude, longitude);
    
    // Filter data by location
    const filteredEarthquakes = filterEarthquakesByLocation(
      earthquakes, 
      latitude, 
      longitude, 
      radius
    );
    
    const filteredWeatherAlerts = filterAlertsByLocation(
      weatherAlerts,
      latitude,
      longitude,
      radius
    );
    
    // Combine all disasters
    let allDisasters = [...filteredEarthquakes, ...filteredWeatherAlerts, ...weatherData];
    
    // Apply additional filters
    if (options.types && options.types.length > 0) {
      allDisasters = allDisasters.filter(disaster => 
        options.types!.includes(disaster.disasterType as DisasterType)
      );
    }
    
    if (options.alertTypes && options.alertTypes.length > 0) {
      allDisasters = allDisasters.filter(disaster => 
        options.alertTypes!.includes(disaster.alertType as AlertType)
      );
    }
    
    return allDisasters;
  } catch (error) {
    console.error('Error fetching disasters by location:', error);
    throw new Error('Failed to fetch disaster data for location');
  }
}

// Get disaster statistics
export function getDisasterStats(disasters: Disaster[]): {
  warnings: number;
  watches: number;
  advisories: number;
  affectedAreas: number;
} {
  const warnings = disasters.filter(d => d.alertType === AlertType.Warning).length;
  const watches = disasters.filter(d => d.alertType === AlertType.Watch).length;
  const advisories = disasters.filter(d => d.alertType === AlertType.Advisory).length;
  
  // Count unique affected areas based on location string
  const uniqueAreas = new Set(disasters.map(d => d.location));
  
  return {
    warnings,
    watches,
    advisories,
    affectedAreas: uniqueAreas.size
  };
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get last updated timestamp
export function getLastUpdatedTime(): Date {
  return new Date();
}
