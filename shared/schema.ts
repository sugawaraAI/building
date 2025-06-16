import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const contractTemplates = pgTable("contract_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  estimatedTime: text("estimated_time").notNull(),
  fieldCount: integer("field_count").notNull(),
  template: text("template").notNull(), // HTML template with placeholders
  fields: jsonb("fields").notNull(), // Field definitions
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  title: text("title").notNull(),
  data: jsonb("data").notNull(), // Contract field values
  status: text("status").notNull().default("draft"), // draft, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contract template schema
export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
  id: true,
});

export const contractFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["text", "number", "date", "select", "time"]),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
});

// Contract schema
export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const contractDataSchema = z.record(z.string(), z.any());

export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type ContractField = z.infer<typeof contractFieldSchema>;

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type ContractData = z.infer<typeof contractDataSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
