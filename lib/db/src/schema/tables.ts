import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantTablesTable = pgTable("restaurant_tables", {
  id: serial("id").primaryKey(),
  tableNumber: integer("table_number").notNull().unique(),
  name: text("name"),
  capacity: integer("capacity").notNull().default(4),
  isActive: boolean("is_active").notNull().default(true),
  qrCode: text("qr_code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTableSchema = createInsertSchema(restaurantTablesTable).omit({ id: true, createdAt: true, qrCode: true });
export type InsertTable = z.infer<typeof insertTableSchema>;
export type RestaurantTable = typeof restaurantTablesTable.$inferSelect;
