import { useState, useEffect, useRef } from 'react';
import { Disaster, Location } from '@/lib/types';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

// Using Leaflet as a component
const DisasterMap = ({ 
  disasters, 
  userLocation,
  onMarkerClick,
  focusedDisaster 
}: {
  disasters: Disaster[];
  userLocation?: Location;
  onMarkerClick: (disaster: Disaster) => void;
  focusedDisaster?: Disaster;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain'>('standard');
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Initialize the map only once
    if (!mapInstance) {
      // @ts-ignore
      const L = window.L;
      if (!L) {
        console.error('Leaflet not loaded');
        return;
      }
      
      const map = L.map(mapRef.current).setView([37.7749, -122.4194], 8);
      
      // Add base tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      setMapInstance(map);
    }
    
    return () => {
      // Cleanup map on component unmount
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null);
      }
    };
  }, []);

  // Update map tiles when map type changes
  useEffect(() => {
    if (!mapInstance) return;
    
    // @ts-ignore
    const L = window.L;
    
    // Remove existing tile layers
    mapInstance.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        mapInstance.removeLayer(layer);
      }
    });
    
    // Add new tile layer based on selected map type
    let tileLayer;
    switch (mapType) {
      case 'satellite':
        tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });
        break;
      case 'terrain':
        tileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        });
        break;
      default:
        tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
    }
    
    tileLayer.addTo(mapInstance);
  }, [mapInstance, mapType]);

  // Update markers when disasters change
  useEffect(() => {
    if (!mapInstance) return;
    
    // @ts-ignore
    const L = window.L;
    
    // Remove existing markers
    markersRef.current.forEach(marker => {
      mapInstance.removeLayer(marker);
    });
    markersRef.current = [];
    
    // Add new markers for each disaster
    disasters.forEach(disaster => {
      const icon = getDisasterIcon(disaster);
      
      const marker = L.marker([disaster.latitude, disaster.longitude], { icon })
        .addTo(mapInstance)
        .bindPopup(`
          <div class="disaster-popup">
            <h3 class="font-semibold">${disaster.title}</h3>
            <p class="text-sm">${disaster.location}</p>
            <p class="text-xs">${new Date(disaster.timestamp).toLocaleString()}</p>
          </div>
        `);
      
      marker.on('click', () => {
        onMarkerClick(disaster);
      });
      
      // Add circular animation for impact radius based on severity
      let radius = 1000; // base radius in meters
      
      switch (disaster.alertType) {
        case 'warning':
          radius = 10000; // 10km radius for warnings
          break;
        case 'watch':
          radius = 5000; // 5km for watches
          break;
        case 'advisory':
          radius = 2000; // 2km for advisories
          break;
      }
      
      const circleColor = getCircleColorForDisaster(disaster);
      
      const circle = L.circle([disaster.latitude, disaster.longitude], {
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.2,
        radius: radius
      }).addTo(mapInstance);
      
      markersRef.current.push(marker, circle);
    });
  }, [mapInstance, disasters, onMarkerClick]);

  // Update user location marker
  useEffect(() => {
    if (!mapInstance || !userLocation) return;
    
    // @ts-ignore
    const L = window.L;
    
    // Remove existing user marker
    if (userMarkerRef.current) {
      mapInstance.removeLayer(userMarkerRef.current);
    }
    
    // Create a custom user location icon
    const userIcon = L.divIcon({
      html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
              <span class="material-icons text-white text-xs">person_pin_circle</span>
            </div>`,
      className: 'user-location-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    // Add new user marker
    userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
      .addTo(mapInstance)
      .bindPopup(`<div>Your location: ${userLocation.name}</div>`);
    
    // Center map on user location if available
    mapInstance.setView([userLocation.latitude, userLocation.longitude], 10);
    
  }, [mapInstance, userLocation]);

  // Focus on a specific disaster when requested
  useEffect(() => {
    if (!mapInstance || !focusedDisaster) return;
    
    // Center map on the focused disaster
    mapInstance.setView([focusedDisaster.latitude, focusedDisaster.longitude], 12);
    
    // Find and open the popup for this disaster
    markersRef.current.forEach(marker => {
      if (marker.getLatLng && 
          marker.getLatLng().lat === focusedDisaster.latitude && 
          marker.getLatLng().lng === focusedDisaster.longitude) {
        marker.openPopup();
      }
    });
  }, [mapInstance, focusedDisaster]);

  const getDisasterIcon = (disaster: Disaster) => {
    // @ts-ignore
    const L = window.L;
    
    let iconName = '';
    let bgColor = '';
    
    // Set icon based on disaster type
    switch (disaster.type) {
      case 'earthquake':
        iconName = 'vibration';
        break;
      case 'flood':
        iconName = 'water';
        break;
      case 'storm':
        iconName = 'bolt';
        break;
      case 'wildfire':
        iconName = 'local_fire_department';
        break;
      default:
        iconName = 'warning';
    }
    
    // Set color based on alert type
    switch (disaster.alertType) {
      case 'warning':
        bgColor = '#ef4444'; // red-500
        break;
      case 'watch':
        bgColor = '#f59e0b'; // amber-500
        break;
      case 'advisory':
        bgColor = '#10b981'; // green-500
        break;
    }
    
    return L.divIcon({
      html: `<div class="w-8 h-8 rounded-full shadow-lg flex items-center justify-center disaster-marker transition-all" 
                  style="background-color: ${bgColor}; color: white;">
              <span class="material-icons text-sm">${iconName}</span>
            </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const getCircleColorForDisaster = (disaster: Disaster) => {
    switch (disaster.alertType) {
      case 'warning':
        return '#ef4444'; // red-500
      case 'watch':
        return '#f59e0b'; // amber-500
      case 'advisory':
        return '#10b981'; // green-500
      default:
        return '#3b82f6'; // blue-500
    }
  };

  const handleMapTypeChange = (type: 'standard' | 'satellite' | 'terrain') => {
    setMapType(type);
    toast({
      title: "Map view changed",
      description: `Map type set to ${type}`,
    });
  };

  const centerMap = () => {
    if (!mapInstance) return;
    
    if (userLocation) {
      mapInstance.setView([userLocation.latitude, userLocation.longitude], 10);
      toast({
        title: "Map centered",
        description: "Map centered on your current location",
      });
    } else if (disasters.length > 0) {
      // If no user location, center on the first disaster
      const firstDisaster = disasters[0];
      mapInstance.setView([firstDisaster.latitude, firstDisaster.longitude], 8);
      toast({
        title: "Map centered",
        description: "Map centered on active disaster area",
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Map Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-medium">Disaster Map</h2>
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
            <span className="material-icons text-gray-500 text-sm">public</span>
            <select 
              className="bg-transparent text-sm border-none focus:ring-0 dark:text-gray-300"
              value={mapType}
              onChange={(e) => handleMapTypeChange(e.target.value as any)}
            >
              <option value="standard">Standard</option>
              <option value="satellite">Satellite</option>
              <option value="terrain">Terrain</option>
            </select>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={() => toast({
              title: "Layers feature",
              description: "Layer selection coming soon",
            })}
          >
            <span className="material-icons">layers</span>
          </button>
          <button 
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={() => {
              if (mapInstance && document.fullscreenEnabled) {
                const container = mapRef.current;
                if (container) {
                  if (!document.fullscreenElement) {
                    container.requestFullscreen();
                  } else {
                    document.exitFullscreen();
                  }
                }
              }
            }}
          >
            <span className="material-icons">fullscreen</span>
          </button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center space-x-1"
            onClick={centerMap}
          >
            <span className="material-icons">center_focus_strong</span>
            <span className="text-sm">Center Map</span>
          </motion.button>
        </div>
      </div>
      
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-[calc(100vh-300px)] md:h-[600px] relative">
        {/* Map is rendered here via Leaflet */}
        {!mapInstance && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <span className="material-icons text-6xl mb-2">map</span>
              <p>Map loading...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg z-10">
        <h3 className="text-sm font-medium mb-2">Legend</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-xs">Warning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span className="text-xs">Watch</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs">Advisory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterMap;
