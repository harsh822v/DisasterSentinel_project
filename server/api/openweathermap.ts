import axios from 'axios';
import { Disaster } from '../../shared/schema';
import { DisasterType, AlertType } from '../utils/alertUtils';

// OpenWeatherMap API endpoints
const OWM_API_URL = 'https://api.openweathermap.org/data/2.5';
const OWM_API_KEY = process.env.OPENWEATHERMAP_API_KEY || process.env.OWM_API_KEY || '';

// Weather conditions that may indicate severe weather
const SEVERE_WEATHER_CODES = [
  // Thunderstorm
  200, 201, 202, 210, 211, 212, 221, 230, 231, 232,
  // Rain (Extreme)
  502, 503, 504, 511, 522, 531,
  // Snow (Heavy)
  602, 622,
  // Atmosphere (Tornado, etc)
  771, 781
];

// Wind speed thresholds (m/s)
const WIND_WARNING_THRESHOLD = 17.2; // ~38 mph (tropical storm force)
const WIND_WATCH_THRESHOLD = 10.8; // ~24 mph (strong wind)

// Rainfall thresholds (mm/3h)
const RAIN_WARNING_THRESHOLD = 50; // ~2 inches in 3 hours
const RAIN_WATCH_THRESHOLD = 25; // ~1 inch in 3 hours

interface OWMWeather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface OWMCurrentWeather {
  coord: {
    lon: number;
    lat: number;
  };
  weather: OWMWeather[];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  snow?: {
    '1h'?: number;
    '3h'?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

interface OWMAlert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

interface OWMOneCall {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: OWMWeather[];
    rain?: { '1h': number };
    snow?: { '1h': number };
  };
  minutely?: {
    dt: number;
    precipitation: number;
  }[];
  hourly?: {
    dt: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: OWMWeather[];
    pop: number; // Probability of precipitation
    rain?: { '1h': number };
    snow?: { '1h': number };
  }[];
  daily?: {
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    moon_phase: number;
    temp: {
      day: number;
      min: number;
      max: number;
      night: number;
      eve: number;
      morn: number;
    };
    feels_like: {
      day: number;
      night: number;
      eve: number;
      morn: number;
    };
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: OWMWeather[];
    clouds: number;
    pop: number;
    rain?: number;
    snow?: number;
    uvi: number;
  }[];
  alerts?: OWMAlert[];
}

// Fetch current weather for a location
export async function fetchCurrentWeather(latitude: number, longitude: number): Promise<Disaster[]> {
  try {
    if (!OWM_API_KEY) {
      console.warn('OpenWeatherMap API key is missing');
      return [];
    }
    
    const response = await axios.get<OWMCurrentWeather>(`${OWM_API_URL}/weather`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: OWM_API_KEY,
        units: 'metric'
      }
    });
    
    const disasters = analyzeCurrentWeather(response.data);
    return disasters;
  } catch (error) {
    console.error('Error fetching current weather from OpenWeatherMap:', error);
    return [];
  }
}

// Fetch one-call weather data with alerts
export async function fetchWeatherOneCall(latitude: number, longitude: number): Promise<Disaster[]> {
  try {
    if (!OWM_API_KEY) {
      console.warn('OpenWeatherMap API key is missing');
      return [];
    }
    
    const response = await axios.get<OWMOneCall>(`${OWM_API_URL}/onecall`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: OWM_API_KEY,
        units: 'metric',
        exclude: 'minutely' // We don't need minute-by-minute data
      }
    });
    
    // Process both the alert data and current/forecast weather
    const alertDisasters = processWeatherAlerts(response.data);
    const conditionDisasters = analyzeWeatherConditions(response.data);
    
    return [...alertDisasters, ...conditionDisasters];
  } catch (error) {
    console.error('Error fetching one-call weather from OpenWeatherMap:', error);
    return [];
  }
}

// Process weather alerts from the one-call API
function processWeatherAlerts(data: OWMOneCall): Disaster[] {
  if (!data.alerts || data.alerts.length === 0) {
    return [];
  }
  
  return data.alerts.map(alert => {
    // Map the alert event to our disaster types
    let disasterType = DisasterType.Storm; // Default to storm
    
    if (alert.event.toLowerCase().includes('flood')) {
      disasterType = DisasterType.Flood;
    } else if (alert.event.toLowerCase().includes('fire')) {
      disasterType = DisasterType.Wildfire;
    }
    
    // Determine alert severity
    let alertType = AlertType.Advisory;
    
    if (alert.event.toLowerCase().includes('warning')) {
      alertType = AlertType.Warning;
    } else if (alert.event.toLowerCase().includes('watch')) {
      alertType = AlertType.Watch;
    } else if (alert.event.toLowerCase().includes('advisory')) {
      alertType = AlertType.Advisory;
    }
    
    // Generate a unique ID
    const id = `owm-alert-${data.lat}-${data.lon}-${alert.start}`;
    
    return {
      id,
      externalId: id,
      disasterType,
      alertType,
      title: alert.event,
      description: alert.description,
      location: data.timezone.replace('_', ' ').replace('/', ', '),
      latitude: data.lat.toString(),
      longitude: data.lon.toString(),
      source: 'OpenWeatherMap',
      timestamp: new Date(alert.start * 1000),
      validUntil: new Date(alert.end * 1000),
      data: {
        sender: alert.sender_name,
        tags: alert.tags
      }
    };
  });
}

// Analyze the current weather for potential severe conditions
function analyzeCurrentWeather(data: OWMCurrentWeather): Disaster[] {
  const disasters: Disaster[] = [];
  
  // Check for severe weather conditions by code
  const severeCondition = data.weather.find(w => SEVERE_WEATHER_CODES.includes(w.id));
  
  if (severeCondition) {
    // Generate ID
    const id = `owm-current-${data.id}-${data.dt}`;
    
    // Determine severity
    let alertType = AlertType.Advisory;
    
    // Check wind speed for severity
    if (data.wind.speed >= WIND_WARNING_THRESHOLD) {
      alertType = AlertType.Warning;
    } else if (data.wind.speed >= WIND_WATCH_THRESHOLD) {
      alertType = AlertType.Watch;
    }
    
    // Check rainfall for flooding potential
    if (data.rain && data.rain['3h']) {
      if (data.rain['3h'] >= RAIN_WARNING_THRESHOLD) {
        alertType = AlertType.Warning;
      } else if (data.rain['3h'] >= RAIN_WATCH_THRESHOLD) {
        alertType = AlertType.Watch;
      }
    }
    
    // Create disaster object
    disasters.push({
      id,
      externalId: id,
      disasterType: getSevereWeatherType(severeCondition.id),
      alertType,
      title: `Severe Weather: ${severeCondition.main}`,
      description: `Severe weather conditions: ${severeCondition.description} with wind speed of ${data.wind.speed} m/s.`,
      location: `${data.name}, ${data.sys.country}`,
      latitude: data.coord.lat.toString(),
      longitude: data.coord.lon.toString(),
      source: 'OpenWeatherMap',
      timestamp: new Date(data.dt * 1000),
      data: {
        temperature: data.main.temp,
        windSpeed: data.wind.speed,
        rainfall: data.rain ? data.rain['1h'] || data.rain['3h'] : 0,
        pressure: data.main.pressure,
        humidity: data.main.humidity,
        weatherId: severeCondition.id
      }
    });
  }
  
  return disasters;
}

// Analyze one-call weather data for potential disasters
function analyzeWeatherConditions(data: OWMOneCall): Disaster[] {
  const disasters: Disaster[] = [];
  
  // Check current conditions
  const severeCondition = data.current.weather.find(w => SEVERE_WEATHER_CODES.includes(w.id));
  
  if (severeCondition) {
    // Similar logic to analyzeCurrentWeather but with one-call data
    const id = `owm-onecall-${data.lat}-${data.lon}-${data.current.dt}`;
    
    let alertType = AlertType.Advisory;
    
    if (data.current.wind_speed >= WIND_WARNING_THRESHOLD) {
      alertType = AlertType.Warning;
    } else if (data.current.wind_speed >= WIND_WATCH_THRESHOLD) {
      alertType = AlertType.Watch;
    }
    
    // Check hourly forecast for heavy precipitation
    if (data.hourly) {
      const nextFewHours = data.hourly.slice(0, 12); // Next 12 hours
      
      // Check for heavy rain in forecast
      const heavyRainForecast = nextFewHours.some(hour => 
        hour.rain && hour.rain['1h'] && hour.rain['1h'] >= RAIN_WATCH_THRESHOLD/3
      );
      
      if (heavyRainForecast) {
        alertType = AlertType.Watch;
      }
    }
    
    disasters.push({
      id,
      externalId: id,
      disasterType: getSevereWeatherType(severeCondition.id),
      alertType,
      title: `Severe Weather: ${severeCondition.main}`,
      description: `Severe weather conditions: ${severeCondition.description} with wind speed of ${data.current.wind_speed} m/s.`,
      location: data.timezone.replace('_', ' ').replace('/', ', '),
      latitude: data.lat.toString(),
      longitude: data.lon.toString(),
      source: 'OpenWeatherMap',
      timestamp: new Date(data.current.dt * 1000),
      data: {
        temperature: data.current.temp,
        windSpeed: data.current.wind_speed,
        rainfall: data.current.rain ? data.current.rain['1h'] : 0,
        pressure: data.current.pressure,
        humidity: data.current.humidity,
        weatherId: severeCondition.id
      }
    });
  }
  
  return disasters;
}

// Map OpenWeatherMap condition codes to our disaster types
function getSevereWeatherType(weatherId: number): DisasterType {
  // Thunderstorm
  if (weatherId >= 200 && weatherId < 300) {
    return DisasterType.Storm;
  }
  // Rain - potential flooding
  else if ((weatherId >= 500 && weatherId < 600) && 
          [502, 503, 504, 511, 522, 531].includes(weatherId)) {
    return DisasterType.Flood;
  }
  // Snow - severe winter storm
  else if ((weatherId >= 600 && weatherId < 700) && 
          [602, 622].includes(weatherId)) {
    return DisasterType.Storm;
  }
  // Tornado
  else if (weatherId === 781) {
    return DisasterType.Storm;
  }
  // Default
  else {
    return DisasterType.Storm;
  }
}
