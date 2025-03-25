import axios from 'axios';
import { DisasterType, AlertType } from '../utils/alertUtils';
import { Disaster } from '../../shared/schema';

// USGS Earthquake API
const USGS_API_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
const MAGNITUDE_WARNING_THRESHOLD = 5.0;
const MAGNITUDE_WATCH_THRESHOLD = 4.0;
const MAGNITUDE_ADVISORY_THRESHOLD = 2.5;

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    detail: string;
    title: string;
    alert: string | null;
    tsunami: number;
    type: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
}

interface USGSResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSFeature[];
}

// Fetch earthquake data from USGS
export async function fetchEarthquakeData(timeRange: string = '1day'): Promise<Disaster[]> {
  try {
    // Available time ranges: 'hour', '1day', '7days', '30days'
    let endpoint;
    switch (timeRange) {
      case '1h':
      case 'hour':
        endpoint = 'all_hour.geojson';
        break;
      case '24h':
      case '1day':
        endpoint = 'all_day.geojson';
        break;
      case '7d':
      case '7days':
        endpoint = 'all_week.geojson';
        break;
      case '30d':
      case '30days':
        endpoint = 'all_month.geojson';
        break;
      default:
        endpoint = 'all_day.geojson';
    }

    const response = await axios.get<USGSResponse>(`${USGS_API_URL}/${endpoint}`);
    return mapUSGSResponseToDisasters(response.data);
  } catch (error) {
    console.error('Error fetching earthquake data from USGS:', error);
    throw new Error('Failed to fetch earthquake data');
  }
}

// Map USGS response to our Disaster format
function mapUSGSResponseToDisasters(data: USGSResponse): Disaster[] {
  return data.features.map(feature => {
    // Determine alert type based on magnitude
    let alertType: AlertType;
    if (feature.properties.mag >= MAGNITUDE_WARNING_THRESHOLD) {
      alertType = AlertType.Warning;
    } else if (feature.properties.mag >= MAGNITUDE_WATCH_THRESHOLD) {
      alertType = AlertType.Watch;
    } else {
      alertType = AlertType.Advisory;
    }
    
    // Extract coordinates (USGS provides [longitude, latitude, depth])
    const [longitude, latitude] = feature.geometry.coordinates;
    
    // Create disaster object
    return {
      id: feature.id,
      externalId: feature.id,
      disasterType: DisasterType.Earthquake,
      alertType,
      title: `Magnitude ${feature.properties.mag.toFixed(1)} Earthquake`,
      description: feature.properties.title,
      location: feature.properties.place,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      source: 'USGS',
      timestamp: new Date(feature.properties.time),
      data: {
        magnitude: feature.properties.mag,
        depth: feature.geometry.coordinates[2],
        url: feature.properties.url,
        tsunami: feature.properties.tsunami === 1
      }
    };
  });
}

// Filter earthquakes by location (within radius)
export function filterEarthquakesByLocation(
  earthquakes: Disaster[],
  latitude: number,
  longitude: number,
  radiusKm: number = 100
): Disaster[] {
  return earthquakes.filter(earthquake => {
    const distance = calculateDistance(
      latitude,
      longitude,
      parseFloat(earthquake.latitude),
      parseFloat(earthquake.longitude)
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
