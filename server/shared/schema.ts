import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // user, admin
  organizationId: varchar("organization_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityCategoryEnum = pgEnum("activity_category", [
  "transport",
  "energy", 
  "food",
  "waste",
  "products"
]);

export const transportTypeEnum = pgEnum("transport_type", [
  "car_gasoline",
  "car_electric",
  "flight_domestic",
  "flight_international", 
  "train",
  "bus",
  "motorcycle"
]);

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  category: activityCategoryEnum("category").notNull(),
  type: varchar("type"), // specific type within category
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }), // distance, kWh, kg, etc
  unit: varchar("unit"), // km, kWh, kg, etc
  carbonEmission: decimal("carbon_emission", { precision: 10, scale: 2 }), // kg CO2
  activityDate: timestamp("activity_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const carbonOffsets = pgTable("carbon_offsets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  offsetAmount: decimal("offset_amount", { precision: 10, scale: 2 }), // kg CO2
  project: varchar("project"),
  verificationId: varchar("verification_id"), // blockchain/verification ID
  cost: decimal("cost", { precision: 10, scale: 2 }),
  currency: varchar("currency").default("USD"),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  activities: many(activities),
  carbonOffsets: many(carbonOffsets),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const carbonOffsetsRelations = relations(carbonOffsets, ({ one }) => ({
  user: one(users, {
    fields: [carbonOffsets.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertCarbonOffsetSchema = createInsertSchema(carbonOffsets).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type CarbonOffset = typeof carbonOffsets.$inferSelect;
export type InsertCarbonOffset = z.infer<typeof insertCarbonOffsetSchema>;
