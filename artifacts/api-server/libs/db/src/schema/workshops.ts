import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainersTable = pgTable("trainers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  phone: text("phone"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workshopsTable = pgTable("workshops", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  trainerId: integer("trainer_id"),
  workshopDate: timestamp("workshop_date", { withTimezone: true }).notNull(),
  location: text("location"),
  capacity: integer("capacity"),
  status: text("status").notNull().default("upcoming"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const workshopRegistrationsTable = pgTable("workshop_registrations", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").notNull(),
  memberId: integer("member_id").notNull(),
  status: text("status").notNull().default("registered"),
  attended: text("attended").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workshopEvaluationsTable = pgTable("workshop_evaluations", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").notNull(),
  memberId: integer("member_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrainerSchema = createInsertSchema(trainersTable).omit({ id: true, createdAt: true });
export const insertWorkshopSchema = createInsertSchema(workshopsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkshopRegistrationSchema = createInsertSchema(workshopRegistrationsTable).omit({ id: true, createdAt: true });
export const insertWorkshopEvaluationSchema = createInsertSchema(workshopEvaluationsTable).omit({ id: true, createdAt: true });
export type InsertTrainer = z.infer<typeof insertTrainerSchema>;
export type Trainer = typeof trainersTable.$inferSelect;
export type InsertWorkshop = z.infer<typeof insertWorkshopSchema>;
export type Workshop = typeof workshopsTable.$inferSelect;
