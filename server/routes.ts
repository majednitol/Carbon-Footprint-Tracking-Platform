import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertActivitySchema, insertCarbonOffsetSchema } from "./shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard data endpoints
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserEmissionsStats(userId);
      const activities = await storage.getUserActivities(userId, 5);
      const offsets = await storage.getUserCarbonOffsets(userId);
      
      const totalOffsets = offsets.reduce((sum, offset) => 
        sum + parseFloat(offset.offsetAmount || '0'), 0);
      
      res.json({
        ...stats,
        totalOffsets,
        recentActivities: activities,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Activity endpoints
  app.get('/api/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await storage.getUserActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post('/api/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertActivitySchema.parse({
        ...req.body,
        userId,
      });
      
      // Calculate carbon emission based on activity type and quantity
      const carbonEmission = calculateCarbonEmission(
        validatedData.category,
        validatedData.type || '',
        parseFloat(validatedData.quantity || '0')
      );
      
      const activity = await storage.createActivity({
        ...validatedData,
        carbonEmission: carbonEmission.toString(),
      });
      
      res.json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      } else {
        console.error("Error creating activity:", error);
        res.status(500).json({ message: "Failed to create activity" });
      }
    }
  });

  // Carbon offset endpoints
  app.get('/api/offsets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const offsets = await storage.getUserCarbonOffsets(userId);
      res.json(offsets);
    } catch (error) {
      console.error("Error fetching offsets:", error);
      res.status(500).json({ message: "Failed to fetch carbon offsets" });
    }
  });

  app.post('/api/offsets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCarbonOffsetSchema.parse({
        ...req.body,
        userId,
      });
      
      const offset = await storage.createCarbonOffset(validatedData);
      res.json(offset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid offset data", errors: error.errors });
      } else {
        console.error("Error creating carbon offset:", error);
        res.status(500).json({ message: "Failed to create carbon offset" });
      }
    }
  });

  // Admin endpoints (protected by admin role check)
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      // if (user?.role !== 'admin') {
      //   return res.status(403).json({ message: "Admin access required" });
      // }
      
      const [totalUsers, totalOrgs, totalActivities, totalEmissions] = await Promise.all([
        storage.getTotalUsersCount(),
        storage.getTotalOrganizationsCount(),
        storage.getTotalActivitiesCount(),
        storage.getTotalEmissionsSum(),
      ]);
      
      res.json({
        totalUsers,
        totalOrganizations: totalOrgs,
        totalActivities,
        totalEmissions: totalEmissions / 1000, // Convert to tonnes
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      // if (user?.role !== 'admin') {
      //   return res.status(403).json({ message: "Admin access required" });
      // }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate carbon emissions
function calculateCarbonEmission(category: string, type: string, quantity: number): number {
  // Emission factors (kg CO2 per unit)
  const emissionFactors: { [key: string]: { [key: string]: number } } = {
    transport: {
      car_gasoline: 0.21, // kg CO2 per km
      car_electric: 0.05,
      flight_domestic: 0.25,
      flight_international: 0.3,
      train: 0.04,
      bus: 0.08,
      motorcycle: 0.15,
    },
    energy: {
      electricity: 0.5, // kg CO2 per kWh
      natural_gas: 0.2,
      heating_oil: 0.3,
    },
    food: {
      beef: 27, // kg CO2 per kg
      pork: 12,
      chicken: 6,
      fish: 6,
      dairy: 3.2,
      vegetables: 2,
      grains: 1.4,
    },
    waste: {
      general: 0.5, // kg CO2 per kg
      recycled: 0.1,
      organic: 0.3,
    },
  };

  const categoryFactors = emissionFactors[category];
  if (!categoryFactors) return 0;

  const factor = categoryFactors[type] || Object.values(categoryFactors)[0] || 0;
  return quantity * factor;
}
