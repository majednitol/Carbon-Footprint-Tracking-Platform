import {
  users,
  organizations,
  activities,
  carbonOffsets,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Activity,
  type InsertActivity,
  type CarbonOffset,
  type InsertCarbonOffset,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, count } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Organization operations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  
  // Activity operations
  getUserActivities(userId: string, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getUserEmissionsStats(userId: string): Promise<{
    totalEmissions: number;
    transportEmissions: number;
    energyEmissions: number;
    foodEmissions: number;
    wasteEmissions: number;
    monthlyEmissions: { month: string; emissions: number }[];
  }>;
  
  // Carbon offset operations
  getUserCarbonOffsets(userId: string): Promise<CarbonOffset[]>;
  createCarbonOffset(offset: InsertCarbonOffset): Promise<CarbonOffset>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getTotalUsersCount(): Promise<number>;
  getTotalOrganizationsCount(): Promise<number>;
  getTotalActivitiesCount(): Promise<number>;
  getTotalEmissionsSum(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Organization operations
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(organizations.name);
  }
  
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }
  
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }
  
  // Activity operations
  async getUserActivities(userId: string, limit = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.activityDate))
      .limit(limit);
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }
  
  async getUserEmissionsStats(userId: string): Promise<{
    totalEmissions: number;
    transportEmissions: number;
    energyEmissions: number;
    foodEmissions: number;
    wasteEmissions: number;
    monthlyEmissions: { month: string; emissions: number }[];
  }> {
    const userActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId));
    
    let totalEmissions = 0;
    let transportEmissions = 0;
    let energyEmissions = 0;
    let foodEmissions = 0;
    let wasteEmissions = 0;
    
    const monthlyData: { [key: string]: number } = {};
    
    userActivities.forEach((activity) => {
      const emission = parseFloat(activity.carbonEmission || '0');
      totalEmissions += emission;
      
      switch (activity.category) {
        case 'transport':
          transportEmissions += emission;
          break;
        case 'energy':
          energyEmissions += emission;
          break;
        case 'food':
          foodEmissions += emission;
          break;
        case 'waste':
          wasteEmissions += emission;
          break;
      }
      
      if (activity.activityDate) {
        const monthKey = activity.activityDate.toISOString().substring(0, 7); // YYYY-MM
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + emission;
      }
    });
    
    const monthlyEmissions = Object.entries(monthlyData)
      .map(([month, emissions]) => ({ month, emissions }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
    
    return {
      totalEmissions,
      transportEmissions,
      energyEmissions,
      foodEmissions,
      wasteEmissions,
      monthlyEmissions,
    };
  }
  
  // Carbon offset operations
  async getUserCarbonOffsets(userId: string): Promise<CarbonOffset[]> {
    return await db
      .select()
      .from(carbonOffsets)
      .where(eq(carbonOffsets.userId, userId))
      .orderBy(desc(carbonOffsets.purchaseDate));
  }
  
  async createCarbonOffset(offset: InsertCarbonOffset): Promise<CarbonOffset> {
    const [created] = await db.insert(carbonOffsets).values(offset).returning();
    return created;
  }
  
  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  
  async getTotalUsersCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result.count;
  }
  
  async getTotalOrganizationsCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(organizations);
    return result.count;
  }
  
  async getTotalActivitiesCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(activities);
    return result.count;
  }
  
  async getTotalEmissionsSum(): Promise<number> {
    const [result] = await db
      .select({ total: sum(activities.carbonEmission) })
      .from(activities);
    return parseFloat(result.total || '0');
  }
}

export const storage = new DatabaseStorage();
