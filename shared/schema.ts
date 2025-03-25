import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  location: text("location"),
  preferences: json("preferences").$type<UserPreferences>(),
});

// Alert history for users
export const alertHistory = pgTable("alert_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  alertType: text("alert_type").notNull(), // warning, watch, advisory
  disasterType: text("disaster_type").notNull(), // earthquake, flood, storm, wildfire
  message: text("message").notNull(),
  location: text("location").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  read: boolean("read").notNull().default(false),
});

// Saved locations for monitoring
export const savedLocations = pgTable("saved_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
});

// Disaster data cached from external APIs
export const disasters = pgTable("disasters", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  disasterType: text("disaster_type").notNull(), // earthquake, flood, storm, wildfire
  alertType: text("alert_type").notNull(), // warning, watch, advisory
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  source: text("source").notNull(), // USGS, NOAA, OpenWeatherMap
  timestamp: timestamp("timestamp").notNull(),
  validUntil: timestamp("valid_until"),
  data: json("data").$type<DisasterData>(), // Raw data from API
});

// Types for JSON fields
export type UserPreferences = {
  emergencyWarnings: boolean;
  watchesAdvisories: boolean;
  smsNotifications: boolean;
  emailAlerts: boolean;
  disasterTypes: string[];
  notificationRadius: number; // in km
};

export type DisasterData = {
  magnitude?: number; // For earthquakes
  windSpeed?: number; // For storms
  rainfall?: number; // For floods
  temperature?: number; // For wildfires
  pressure?: number; // For storms
  [key: string]: any; // Allow additional properties
};

// Zod schemas for insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  location: true,
  preferences: true,
});

export const insertAlertHistorySchema = createInsertSchema(alertHistory).pick({
  userId: true,
  alertType: true,
  disasterType: true,
  message: true,
  location: true,
  timestamp: true,
  read: true,
});

export const insertSavedLocationSchema = createInsertSchema(savedLocations).pick({
  userId: true,
  name: true,
  latitude: true,
  longitude: true,
});

export const insertDisasterSchema = createInsertSchema(disasters).pick({
  externalId: true,
  disasterType: true,
  alertType: true,
  title: true,
  description: true,
  location: true,
  latitude: true,
  longitude: true,
  source: true,
  timestamp: true,
  validUntil: true,
  data: true,
});

// Types from schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAlertHistory = z.infer<typeof insertAlertHistorySchema>;
export type InsertSavedLocation = z.infer<typeof insertSavedLocationSchema>;
export type InsertDisaster = z.infer<typeof insertDisasterSchema>;

// Types from tables
export type User = typeof users.$inferSelect;
export type AlertHistory = typeof alertHistory.$inferSelect;
export type SavedLocation = typeof savedLocations.$inferSelect;
export type Disaster = typeof disasters.$inferSelect;
