import { pgTable, serial, text, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const volunteerHoursTable = pgTable("volunteer_hours", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  eventId: integer("event_id"),
  hours: numeric("hours", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  activityDate: date("activity_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVolunteerHourSchema = createInsertSchema(volunteerHoursTable).omit({ id: true, createdAt: true });
export type InsertVolunteerHour = z.infer<typeof insertVolunteerHourSchema>;
export type VolunteerHour = typeof volunteerHoursTable.$inferSelect;
