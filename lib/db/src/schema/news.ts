import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// تعريف أنواع الحالات والأنواع المختلفة (Enums)
export const roleEnum = pgEnum("role", ["admin", "secretary", "member"]);
export const memberStatusEnum = pgEnum("member_status", ["pending", "active", "suspended"]);
export const workshopStatusEnum = pgEnum("workshop_status", ["upcoming", "completed", "cancelled"]);
export const registrationStatusEnum = pgEnum("registration_status", ["registered", "cancelled"]);

// 1. جدول المستخدمين
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("member").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. جدول الأعضاء
export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  phone: text("phone"),
  departmentId: integer("department_id"),
  status: memberStatusEnum("status").default("pending").notNull(),
  qrCode: text("qr_code").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. جدول المدربين
export const trainersTable = pgTable("trainers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  phone: text("phone"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. جدول الورش (Workshops)
export const workshopsTable = pgTable("workshops", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  trainerId: integer("trainer_id").references(() => trainersTable.id, { onDelete: "set null" }),
  workshopDate: timestamp("workshop_date", { withTimezone: true }).notNull(),
  location: text("location"),
  capacity: integer("capacity"),
  status: workshopStatusEnum("status").default("upcoming").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. جدول تسجيلات الورش
export const workshopRegistrationsTable = pgTable("workshop_registrations", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").references(() => workshopsTable.id, { onDelete: "cascade" }).notNull(),
  memberId: integer("member_id").references(() => membersTable.id, { onDelete: "cascade" }).notNull(),
  status: registrationStatusEnum("status").default("registered").notNull(),
  attended: text("attended").default("false").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. جدول تقييمات الورش
export const workshopEvaluationsTable = pgTable("workshop_evaluations", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").references(() => workshopsTable.id, { onDelete: "cascade" }).notNull(),
  memberId: integer("member_id").references(() => membersTable.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. جدول الشهادات
export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'workshop', 'membership', etc.
  recipientId: integer("recipient_id").notNull(),
  workshopId: integer("workshop_id").references(() => workshopsTable.id, { onDelete: "cascade" }),
  verifyCode: text("verify_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. جدول الأخبار
export const newsTable = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  authorId: integer("author_id"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// 9. جدول الإعلانات
export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  targetRole: text("target_role"),
  authorId: integer("author_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// 10. جدول سجل النشاطات
export const activityLogTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  actorId: integer("actor_id"),
  actorName: text("actor_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// مخططات الـ Zod والأنواع (Schemas & Types)
export const insertNewsSchema = createInsertSchema(newsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcementsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogTable).omit({ id: true, createdAt: true });

export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof newsTable.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcementsTable.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogTable.$inferSelect;