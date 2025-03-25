import axios from 'axios';
import { Location } from '../../client/src/lib/types';

// Using OpenStreetMap Nominatim API for geocoding
// This is a free service with usage limits, for production use consider using
// Google Maps, Mapbox, or another commercial geocoding service
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
    [key: string]: string | undefined;
  };
  boundingbox: string[];
}

// Geocode an address to get coordinates
export async function geocodeAddress(query: string): Promise<Location[]> {
  try {
    const response = await axios.get<NominatimResponse[]>(`${NOMINATIM_API}/search`, {
      params: {
        q: query,
        format: 'json',
        limit: 5,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'DisasterTrack/1.0'
      }
    });
    
    // Map the response to our Location format
    return response.data.map(result => ({
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode the address');
  }
}

// Reverse geocode coordinates to get an address
export async function reverseGeocode(latitude: number, longitude: number): Promise<Location> {
  try {
    const response = await axios.get<NominatimResponse>(`${NOMINATIM_API}/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'DisasterTrack/1.0'
      }
    });
    
    const result = response.data;
    
    // Create a shorter display name for the location
    let locationName = '';
    
    if (result.address) {
      const address = result.address;
      
      if (address.city) {
        locationName += address.city;
      } else if (address.town) {
        locationName += address.town;
      } else if (address.village) {
        locationName += address.village;
      } else if (address.county) {
        locationName += address.county;
      }
      
      if (address.state) {
        if (locationName) locationName += ', ';
        locationName += address.state;
      }
      
      if (!locationName && address.country) {
        locationName = address.country;
      }
    }
    
    if (!locationName) {
      locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
    
    return {
      name: locationName,
      latitude,
      longitude
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // Return basic location with coordinates if reverse geocoding fails
    return {
      name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      latitude,
      longitude
    };
  }
}

// Get IP-based geolocation (fallback when GPS is not available)
export async function getIPBasedLocation(): Promise<Location> {
  try {
    // Using ipapi.co service (free tier)
    const response = await axios.get('https://ipapi.co/json/');
    const data = response.data;
    
    return {
      name: `${data.city}, ${data.region_code}`,
      latitude: data.latitude,
      longitude: data.longitude
    };
  } catch (error) {
    console.error('IP geolocation error:', error);
    throw new Error('Failed to detect location from IP');
  }
}
