import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Certificates table
export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  certificateId: text("certificate_id").notNull().unique(),
  recipientName: text("recipient_name").notNull(),
  dob: timestamp("dob", { mode: "date" }),
  course: text("course").notNull(),
  courseCode: varchar("course_code").notNull(),
  department: text("department"),
  college: text("college"),
  content: text("content"),
  duration: text("duration"),
  batchId: varchar("batch_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Letters table
export const letters = pgTable("letters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientName: text("recipient_name").notNull(),
  courseName: text("course_name").notNull(),
  projectTitle: text("project_title"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  completionDate: text("completion_date"),
  letterType: varchar("letter_type").notNull(),
  batchId: varchar("batch_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Completion Letters table
export const completionLetters = pgTable("completion_letters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientName: varchar("recipient_name", { length: 255 }).notNull(),
  internId: varchar("intern_id", { length: 255 }).notNull(),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  projectTitle: text("project_title").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  letterDate: timestamp("letter_date").notNull(),
});

// Batches table
export const batches = pgTable("batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  csvFileName: text("csv_file_name"),
  totalDocuments: integer("total_documents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Certificate Sequence table
export const certificateSequence = pgTable("certificate_sequence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  courseCode: varchar("course_code").notNull(),
  lastSequence: integer("last_sequence").notNull(),
});

// Global Certificate Sequence
export const globalCertificateSequence = pgTable("global_certificate_sequence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull().unique(),
  lastSequence: integer("last_sequence").notNull().default(0),
});

// Relations
export const certificatesRelations = relations(certificates, ({ one }) => ({
  batch: one(batches, { fields: [certificates.batchId], references: [batches.id] }),
}));

export const lettersRelations = relations(letters, ({ one }) => ({
  batch: one(batches, { fields: [letters.batchId], references: [batches.id] }),
}));

export const batchesRelations = relations(batches, ({ many }) => ({
  certificates: many(certificates),
  letters: many(letters),
}));

export const completionLettersRelations = relations(completionLetters, () => ({}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });

export const insertCertificateSchema = createInsertSchema(certificates)
  .omit({ id: true, createdAt: true })
  .extend({ certificateId: z.string().optional(), courseCode: z.string(), dob: z.string().optional() });

export const insertLetterSchema = createInsertSchema(letters)
  .omit({ id: true, createdAt: true })
  .extend({
    recipientName: z.string(),
    courseName: z.string().optional().nullable().default(""),
    projectTitle: z.string().optional().nullable().default(""),
    startDate: z.string(),
    endDate: z.string(),
    letterType: z.string(),
    email: z.string().optional().nullable().default(""),
    position: z.string().optional().nullable().default(""),
    department: z.string().optional().nullable().default(""),
    stipend: z.string().optional().nullable().default(""),
    duration: z.string().optional().nullable().default(""),
    grade: z.string().optional().nullable().default(""),
    notes: z.string().optional().nullable().default(""),
    completionDate: z.string().optional().nullable().default(""),
    batchId: z.string().optional().nullable().default(""),
  });

export const insertBatchSchema = createInsertSchema(batches).omit({ id: true, createdAt: true });

export const insertCertificateSequenceSchema = createInsertSchema(certificateSequence).omit({ id: true });

export const insertCompletionLetterSchema = createInsertSchema(completionLetters).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Letter = typeof letters.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type CertificateSequence = typeof certificateSequence.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type InsertLetter = z.infer<typeof insertLetterSchema>;
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type InsertCertificateSequence = z.infer<typeof insertCertificateSequenceSchema>;
export type InsertCompletionLetter = z.infer<typeof insertCompletionLetterSchema>;
