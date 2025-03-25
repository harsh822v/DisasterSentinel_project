import axios from 'axios';
import { Disaster } from '../../shared/schema';
import { DisasterType, AlertType } from '../utils/alertUtils';

// NOAA Weather API endpoints
const NOAA_ALERTS_API = 'https://api.weather.gov/alerts/active';

interface NOAAAlert {
  id: string;
  properties: {
    event: string;
    headline: string;
    description: string;
    severity: string;
    certainty: string;
    urgency: string;
    effective: string;
    expires: string;
    ends: string | null;
    status: string;
    messageType: string;
    category: string;
    sender: string;
    senderName: string;
    areaDesc: string;
    parameters: {
      BLOCKCHANNEL?: string[];
      EAS_ORG?: string[];
      VTEC?: string[];
      eventEndingTime?: string[];
      expiredReferences?: string[];
    };
  };
  geometry: {
    type: string;
    coordinates: number[][][] | [number, number][]; // Could be MultiPolygon or Point
  };
}

interface NOAAResponse {
  type: string;
  features: NOAAAlert[];
  title: string;
  updated: string;
}

// Map disaster types from NOAA events
const noaaEventToDisasterType: Record<string, DisasterType> = {
  'Tornado': DisasterType.Storm,
  'Tornado Warning': DisasterType.Storm,
  'Tornado Watch': DisasterType.Storm,
  'Severe Thunderstorm': DisasterType.Storm,
  'Severe Thunderstorm Warning': DisasterType.Storm,
  'Severe Thunderstorm Watch': DisasterType.Storm,
  'Flash Flood': DisasterType.Flood,
  'Flash Flood Warning': DisasterType.Flood,
  'Flash Flood Watch': DisasterType.Flood,
  'Flood': DisasterType.Flood,
  'Flood Warning': DisasterType.Flood,
  'Flood Watch': DisasterType.Flood,
  'Hurricane': DisasterType.Storm,
  'Hurricane Warning': DisasterType.Storm,
  'Hurricane Watch': DisasterType.Storm,
  'Tropical Storm': DisasterType.Storm,
  'Tropical Storm Warning': DisasterType.Storm,
  'Tropical Storm Watch': DisasterType.Storm,
  'Winter Storm': DisasterType.Storm,
  'Winter Storm Warning': DisasterType.Storm,
  'Winter Storm Watch': DisasterType.Storm,
  'Blizzard': DisasterType.Storm,
  'Blizzard Warning': DisasterType.Storm,
  'Blizzard Watch': DisasterType.Storm,
  'Tsunami': DisasterType.Flood,
  'Tsunami Warning': DisasterType.Flood,
  'Tsunami Watch': DisasterType.Flood,
  'Red Flag': DisasterType.Wildfire,
  'Fire Weather': DisasterType.Wildfire,
  'Fire Warning': DisasterType.Wildfire,
  'Wildfire': DisasterType.Wildfire,
};

// Map NOAA severity to our alert types
const noaaSeverityToAlertType: Record<string, AlertType> = {
  'Extreme': AlertType.Warning,
  'Severe': AlertType.Warning,
  'Moderate': AlertType.Watch,
  'Minor': AlertType.Advisory,
  'Unknown': AlertType.Advisory,
};

// Fetch active weather alerts from NOAA
export async function fetchWeatherAlerts(area?: string): Promise<Disaster[]> {
  try {
    // If area is provided, filter by area
    const url = area 
      ? `${NOAA_ALERTS_API}?area=${area}`
      : NOAA_ALERTS_API;
    
    const response = await axios.get<NOAAResponse>(url);
    return mapNOAAResponseToDisasters(response.data);
  } catch (error) {
    console.error('Error fetching weather alerts from NOAA:', error);
    throw new Error('Failed to fetch weather alerts');
  }
}

// Map NOAA response to our Disaster format
function mapNOAAResponseToDisasters(data: NOAAResponse): Disaster[] {
  return data.features
    .filter(feature => {
      // Only include relevant severe weather events
      const event = feature.properties.event;
      return Object.keys(noaaEventToDisasterType).some(key => 
        event.toLowerCase().includes(key.toLowerCase())
      );
    })
    .map(feature => {
      // Determine disaster type based on event description
      const event = feature.properties.event;
      let disasterType = DisasterType.Storm; // Default
      
      for (const [key, value] of Object.entries(noaaEventToDisasterType)) {
        if (event.toLowerCase().includes(key.toLowerCase())) {
          disasterType = value;
          break;
        }
      }
      
      // Determine alert type from severity
      const alertType = noaaSeverityToAlertType[feature.properties.severity] || AlertType.Advisory;
      
      // Extract coordinates (center point of the affected area)
      let latitude = 0;
      let longitude = 0;
      
      if (feature.geometry) {
        // Handle different geometry types
        if (feature.geometry.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
          // Point: [longitude, latitude]
          [longitude, latitude] = feature.geometry.coordinates as [number, number];
        } else if (feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates)) {
          // Polygon: Calculate centroid from first ring of coordinates
          const coordinates = feature.geometry.coordinates[0] as [number, number][];
          const sumLat = coordinates.reduce((sum, coord) => sum + coord[1], 0);
          const sumLng = coordinates.reduce((sum, coord) => sum + coord[0], 0);
          latitude = sumLat / coordinates.length;
          longitude = sumLng / coordinates.length;
        } else if (feature.geometry.type === 'MultiPolygon' && Array.isArray(feature.geometry.coordinates)) {
          // MultiPolygon: Use the first polygon's first ring for centroid
          const coordinates = feature.geometry.coordinates[0][0] as [number, number][];
          const sumLat = coordinates.reduce((sum, coord) => sum + coord[1], 0);
          const sumLng = coordinates.reduce((sum, coord) => sum + coord[0], 0);
          latitude = sumLat / coordinates.length;
          longitude = sumLng / coordinates.length;
        }
      }
      
      // Parse the effective and expiry dates
      const timestamp = new Date(feature.properties.effective);
      const validUntil = feature.properties.expires ? new Date(feature.properties.expires) : undefined;
      
      // Create disaster object
      return {
        id: feature.id,
        externalId: feature.id,
        disasterType,
        alertType,
        title: feature.properties.headline,
        description: feature.properties.description,
        location: feature.properties.areaDesc,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        source: 'NOAA',
        timestamp,
        validUntil,
        data: {
          event: feature.properties.event,
          severity: feature.properties.severity,
          urgency: feature.properties.urgency,
          certainty: feature.properties.certainty
        }
      };
    });
}

// Filter alerts by location (within radius)
export function filterAlertsByLocation(
  alerts: Disaster[],
  latitude: number,
  longitude: number,
  radiusKm: number = 100
): Disaster[] {
  return alerts.filter(alert => {
    // Skip alerts without coordinates
    if (!alert.latitude || !alert.longitude) return false;
    
    const distance = calculateDistance(
      latitude,
      longitude,
      parseFloat(alert.latitude),
      parseFloat(alert.longitude)
    );
    return distance <= radiusKm;
  });
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
