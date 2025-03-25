import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAllDisasters, getDisastersByLocation, getDisasterStats, getLastUpdatedTime } from "./api";
import { geocodeAddress, reverseGeocode } from "./utils/geocoding";
import { DisasterType, AlertType } from "./utils/alertUtils";
import { z } from "zod";
import { insertUserSchema, insertSavedLocationSchema, insertAlertHistorySchema } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const httpServer = createServer(app);

  // Disaster data routes
  app.get("/api/disasters", async (req: Request, res: Response) => {
    try {
      const types = req.query.types ? 
        (req.query.types as string).split(',') as DisasterType[] : 
        undefined;
      
      const alertTypes = req.query.alertTypes ? 
        (req.query.alertTypes as string).split(',') as AlertType[] : 
        undefined;
      
      const timeRange = req.query.timeRange as string | undefined;
      
      const latitude = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const longitude = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 100;
      
      const disasters = await getAllDisasters({
        types,
        alertTypes,
        timeRange,
        latitude,
        longitude,
        radius
      });
      
      res.json(disasters);
    } catch (error) {
      console.error('Error in /api/disasters:', error);
      res.status(500).json({ message: 'Failed to fetch disaster data' });
    }
  });

  app.get("/api/disasters/stats", async (req: Request, res: Response) => {
    try {
      const disasters = await getAllDisasters();
      const stats = getDisasterStats(disasters);
      res.json(stats);
    } catch (error) {
      console.error('Error in /api/disasters/stats:', error);
      res.status(500).json({ message: 'Failed to fetch disaster statistics' });
    }
  });

  app.get("/api/disasters/lastUpdated", async (_req: Request, res: Response) => {
    try {
      const lastUpdated = getLastUpdatedTime();
      res.json(lastUpdated);
    } catch (error) {
      console.error('Error in /api/disasters/lastUpdated:', error);
      res.status(500).json({ message: 'Failed to get last updated time' });
    }
  });

  app.get("/api/disasters/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const disasters = await getAllDisasters();
      const disaster = disasters.find(d => d.id === id);
      
      if (!disaster) {
        return res.status(404).json({ message: 'Disaster not found' });
      }
      
      res.json(disaster);
    } catch (error) {
      console.error(`Error in /api/disasters/${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch disaster details' });
    }
  });

  // Geocoding routes
  app.get("/api/geocode", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      
      if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
      }
      
      const locations = await geocodeAddress(query);
      res.json(locations);
    } catch (error) {
      console.error('Error in /api/geocode:', error);
      res.status(500).json({ message: 'Failed to geocode address' });
    }
  });

  app.get("/api/reverseGeocode", async (req: Request, res: Response) => {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : null;
      
      if (lat === null || lon === null) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }
      
      const location = await reverseGeocode(lat, lon);
      res.json(location);
    } catch (error) {
      console.error('Error in /api/reverseGeocode:', error);
      res.status(500).json({ message: 'Failed to reverse geocode coordinates' });
    }
  });

  // Emergency resources routes
  app.get("/api/resources", async (req: Request, res: Response) => {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : null;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10;
      const types = req.query.types ? (req.query.types as string).split(',') : undefined;
      
      if (lat === null || lon === null) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }
      
      // Mock emergency resources data (would connect to a real API in production)
      const resources = [
        {
          id: "hosp1",
          name: "San Francisco General Hospital",
          type: "hospital",
          address: "1001 Potrero Ave, San Francisco, CA 94110",
          distance: 2.3,
          latitude: lat + 0.01,
          longitude: lon - 0.01,
          isOpen: true
        },
        {
          id: "shelter1",
          name: "City Hall Emergency Shelter",
          type: "shelter",
          address: "1 Dr Carlton B Goodlett Pl, San Francisco, CA 94102",
          distance: 1.5,
          latitude: lat - 0.005,
          longitude: lon + 0.008,
          isOpen: true
        },
        {
          id: "fire1",
          name: "San Francisco Fire Department",
          type: "firestation",
          address: "698 2nd St, San Francisco, CA 94107",
          distance: 3.1,
          latitude: lat + 0.02,
          longitude: lon + 0.015,
          isOpen: true
        }
      ];
      
      // Filter by type if specified
      const filteredResources = types 
        ? resources.filter(r => types.includes(r.type))
        : resources;
      
      res.json(filteredResources);
    } catch (error) {
      console.error('Error in /api/resources:', error);
      res.status(500).json({ message: 'Failed to fetch emergency resources' });
    }
  });

  // Safety guides routes
  app.get("/api/guides", async (req: Request, res: Response) => {
    try {
      const disasterType = req.query.type as DisasterType | undefined;
      
      // Sample safety guides
      const guides = [
        {
          id: "guide1",
          title: "Thunderstorm Safety",
          description: "Learn how to stay safe during severe weather events.",
          disasterType: DisasterType.Storm,
          icon: "flash_on",
          url: "https://www.weather.gov/safety/thunderstorm"
        },
        {
          id: "guide2",
          title: "Earthquake Safety",
          description: "What to do before, during and after an earthquake.",
          disasterType: DisasterType.Earthquake,
          icon: "vibration",
          url: "https://www.ready.gov/earthquakes"
        },
        {
          id: "guide3",
          title: "Flood Preparation",
          description: "Preparation steps and evacuation guidelines for floods.",
          disasterType: DisasterType.Flood,
          icon: "water",
          url: "https://www.ready.gov/floods"
        },
        {
          id: "guide4",
          title: "Wildfire Safety",
          description: "Tips for wildfire preparedness and evacuation planning.",
          disasterType: DisasterType.Wildfire,
          icon: "local_fire_department",
          url: "https://www.ready.gov/wildfires"
        },
        {
          id: "guide5",
          title: "Home Emergency Kit",
          description: "Essential supplies to have ready for any disaster.",
          disasterType: DisasterType.Storm,
          icon: "inventory_2",
          url: "https://www.ready.gov/kit"
        },
        {
          id: "guide6",
          title: "Family Emergency Plan",
          description: "How to create and practice a family emergency plan.",
          disasterType: DisasterType.Earthquake,
          icon: "people",
          url: "https://www.ready.gov/plan"
        }
      ];
      
      // Filter by disaster type if specified
      const filteredGuides = disasterType 
        ? guides.filter(g => g.disasterType === disasterType)
        : guides;
      
      res.json(filteredGuides);
    } catch (error) {
      console.error('Error in /api/guides:', error);
      res.status(500).json({ message: 'Failed to fetch safety guides' });
    }
  });

  // User preference routes
  app.get("/api/preferences", async (req: Request, res: Response) => {
    try {
      // Mock preferences (would come from database in production)
      const preferences = {
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
        notificationRadius: 50
      };
      
      res.json(preferences);
    } catch (error) {
      console.error('Error in /api/preferences:', error);
      res.status(500).json({ message: 'Failed to fetch preferences' });
    }
  });

  app.post("/api/preferences", async (req: Request, res: Response) => {
    try {
      const preferences = req.body;
      
      // Validate preferences (basic validation)
      if (typeof preferences !== 'object' || preferences === null) {
        return res.status(400).json({ message: 'Invalid preferences format' });
      }
      
      // In a real app, save preferences to database
      // await storage.saveUserPreferences(userId, preferences)
      
      res.json({ message: 'Preferences saved successfully' });
    } catch (error) {
      console.error('Error in POST /api/preferences:', error);
      res.status(500).json({ message: 'Failed to save preferences' });
    }
  });

  // Saved locations routes
  app.get("/api/locations", async (req: Request, res: Response) => {
    try {
      // Mock saved locations (would come from database in production)
      const locations = [
        {
          id: "loc1",
          name: "Home",
          latitude: 37.7749,
          longitude: -122.4194
        },
        {
          id: "loc2",
          name: "Work",
          latitude: 37.7895,
          longitude: -122.3988
        }
      ];
      
      res.json(locations);
    } catch (error) {
      console.error('Error in /api/locations:', error);
      res.status(500).json({ message: 'Failed to fetch saved locations' });
    }
  });

  app.post("/api/locations", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const locationSchema = z.object({
        name: z.string().min(1),
        latitude: z.number(),
        longitude: z.number()
      });
      
      const parseResult = locationSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: 'Invalid location data',
          errors: parseResult.error.errors
        });
      }
      
      const location = parseResult.data;
      
      // In a real app, save location to database
      // await storage.saveUserLocation(userId, location)
      
      res.json({ 
        message: 'Location saved successfully',
        id: `loc${Date.now()}` // Generate a mock ID
      });
    } catch (error) {
      console.error('Error in POST /api/locations:', error);
      res.status(500).json({ message: 'Failed to save location' });
    }
  });

  app.delete("/api/locations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // In a real app, delete location from database
      // await storage.deleteUserLocation(userId, id)
      
      res.json({ message: 'Location deleted successfully' });
    } catch (error) {
      console.error(`Error in DELETE /api/locations/${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to delete location' });
    }
  });

  return httpServer;
}
