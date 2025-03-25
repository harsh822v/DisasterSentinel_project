// API Response Types
export interface USGSEarthquake {
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
    coordinates: [number, number, number]; // longitude, latitude, depth
  };
  type: string;
}

export interface USGSResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSEarthquake[];
}

export interface NOAAAlert {
  id: string;
  properties: {
    event: string;
    headline: string;
    description: string;
    severity: string;
    certainty: string;
    urgency: string;
    onset: string;
    expires: string;
    senderName: string;
    areaDesc: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | [number, number][];
  };
}

export interface NOAAResponse {
  type: string;
  features: NOAAAlert[];
}

export interface OpenWeatherMapResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  rain?: {
    "1h"?: number;
    "3h"?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  name: string;
}

// Application Types
export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export interface Disaster {
  id: string;
  type: DisasterType;
  alertType: AlertType;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  source: string;
  timestamp: Date;
  validUntil?: Date;
  data: {
    magnitude?: number;
    windSpeed?: number;
    rainfall?: number;
    temperature?: number;
    pressure?: number;
    [key: string]: any;
  };
}

export enum DisasterType {
  Earthquake = "earthquake",
  Flood = "flood",
  Storm = "storm",
  Wildfire = "wildfire"
}

export enum AlertType {
  Warning = "warning",
  Watch = "watch",
  Advisory = "advisory"
}

export interface AlertPreferences {
  emergencyWarnings: boolean;
  watchesAdvisories: boolean;
  smsNotifications: boolean;
  emailAlerts: boolean;
  disasterTypes: DisasterType[];
  notificationRadius: number;
}

export interface EmergencyResource {
  id: string;
  name: string;
  type: "hospital" | "shelter" | "emergency" | "firestation" | "policestation";
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
  isOpen: boolean;
}

export interface SafetyGuide {
  id: string;
  title: string;
  description: string;
  disasterType: DisasterType;
  icon: string;
  url: string;
}

export interface DisasterStats {
  warnings: number;
  watches: number;
  advisories: number;
  affectedAreas: number;
}
