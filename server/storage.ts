import {
  users, certificates, letters, batches, certificateSequence,
  type User, type Certificate, type Letter, type Batch, type CertificateSequence,
  type InsertUser, type InsertCertificate, type InsertLetter, type InsertBatch, type InsertCertificateSequence
} from "./shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, or } from "drizzle-orm";
import { sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Certificate operations
  getCertificate(id: string): Promise<Certificate | undefined>;
  getCertificates(search?: string, limit?: number, offset?: number): Promise<Certificate[]>;
  getCertificatesByBatch(batchId: string): Promise<Certificate[]>; // existing

  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  createCertificates(certificates: InsertCertificate[]): Promise<Certificate[]>;

  // Letter operations
  getLetter(id: string): Promise<Letter | undefined>;
  getLetters(search?: string, limit?: number, offset?: number, batchId?: string, letterType?: string): Promise<Letter[]>;

  // <-- Added this method to interface: 
  getLettersByBatch(batchId: string): Promise<Letter[]>;

  createLetter(letter: InsertLetter): Promise<Letter>;
  createLetters(letters: InsertLetter[]): Promise<Letter[]>;

  // Batch operations
  getBatch(id: string): Promise<Batch | undefined>;
  getBatches(): Promise<Batch[]>;
  createBatch(batch: InsertBatch): Promise<Batch>;

  // Certificate sequence operations
  getCertificateSequence(year: number, courseCode: string): Promise<CertificateSequence | undefined>;
  getNextCertificateSequence(year: number, courseCode: string): Promise<number>;
  updateCertificateSequence(year: number, courseCode: string, newSequence: number): Promise<void>;

  // Stats
  getStats(): Promise<{
    totalCertificates: number;
    totalLetters: number;
    totalBatches: number;
    totalDownloads: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Certificates
  async getCertificate(id: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate || undefined;
  }

  async getCertificates(
    search?: string,
    limit = 50,
    offset = 0,
    batchId?: string
  ): Promise<Certificate[]> {
    const conditions = [];

    if (search && search.trim()) {
      conditions.push(
        or(
          like(certificates.recipientName, `%${search}%`),
          like(certificates.certificateId, `%${search}%`),
          like(certificates.course, `%${search}%`),
          like(certificates.department, `%${search}%`),
          like(certificates.college, `%${search}%`)
        )
      );
    }

    if (batchId) {
      conditions.push(eq(certificates.batchId, batchId));
    }

    let query = db.select().from(certificates);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(desc(certificates.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCertificatesByBatch(batchId: string): Promise<Certificate[]> {
    return await db.select().from(certificates)
      .where(eq(certificates.batchId, batchId))
      .orderBy(asc(certificates.certificateId));
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCertificate] = await db.insert(certificates).values(certificate).returning();
    return newCertificate;
  }

  async createCertificates(certificateList: InsertCertificate[]): Promise<Certificate[]> {
    return await db.insert(certificates).values(certificateList).returning();
  }

  // Letters
  async getLetter(id: string): Promise<Letter | undefined> {
    const [letter] = await db.select().from(letters).where(eq(letters.id, id));
    return letter || undefined;
  }

  async getLetters(
    search?: string,
    limit = 50,
    offset = 0,
    batchId?: string,
    letterType?: string
  ): Promise<Letter[]> {
    const conditions = [];

    if (search && search.trim() !== '') {
      const searchConditions = [
        like(letters.recipientName, `%${search}%`)
      ];

      // Only add conditions for fields that exist in the schema
      if (letters.email) {
        searchConditions.push(like(letters.email, `%${search}%`));
      }
      if (letters.position) {
        searchConditions.push(like(letters.position, `%${search}%`));
      }
      if (letters.department) {
        searchConditions.push(like(letters.department, `%${search}%`));
      }
      if (letters.stipend) {
        searchConditions.push(like(letters.stipend, `%${search}%`));
      }
      if (letters.grade) {
        searchConditions.push(like(letters.grade, `%${search}%`));
      }

      conditions.push(or(...searchConditions));
    }

    if (batchId && batchId.trim() !== '') {
      conditions.push(eq(letters.batchId, batchId));
    }

    if (letterType && letterType.trim() !== '') {
      conditions.push(eq(letters.letterType, letterType));
    }

    let query = db.select().from(letters);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(desc(letters.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // <-- Added method to get all letters by batch without pagination/search
  async getLettersByBatch(batchId: string): Promise<Letter[]> {
    if (!batchId) {
      return [];
    }

    return await db.select().from(letters)
      .where(eq(letters.batchId, batchId))
      .orderBy(desc(letters.createdAt));
  }

  async createLetter(letter: InsertLetter): Promise<Letter> {
    const [newLetter] = await db.insert(letters).values(letter).returning();
    return newLetter;
  }

  async createLetters(letterList: InsertLetter[]): Promise<Letter[]> {
    return await db.insert(letters).values(letterList).returning();
  }

  // Batches
  async getBatch(id: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch || undefined;
  }


  async getBatches(limit = 20, offset = 0): Promise<Batch[]> {
    return await db
      .select()
      .from(batches)
      .orderBy(desc(batches.createdAt))
      .limit(limit)
      .offset(offset);
  }



  async createBatch(batch: InsertBatch): Promise<Batch> {
    const [newBatch] = await db.insert(batches).values(batch).returning();
    return newBatch;
  }

  // Certificate Sequences
  async getCertificateSequence(year: number, courseCode: string): Promise<CertificateSequence | undefined> {
    const [result] = await db.select().from(certificateSequence)
      .where(and(eq(certificateSequence.year, year), eq(certificateSequence.courseCode, courseCode)));
    return result || undefined;
  }

  async getNextCertificateSequence(year: number, courseCode: string): Promise<number> {
    console.log('getNextCertificateSequence called with:', { year, courseCode });

    let retryCount = 0;
    const maxRetries = 5;

    const tryGetNextSequence = async (): Promise<number> => {
      retryCount++;
      if (retryCount > maxRetries) {
        throw new Error("Too many retries getting next certificate sequence");
      }

      // Use Drizzle ORM update with returning
      const updatedRows = await db
        .update(certificateSequence)
        .set({
          lastSequence: sql`${certificateSequence.lastSequence} + 1`,
        })
        .where(
          and(
            eq(certificateSequence.year, year),
            eq(certificateSequence.courseCode, courseCode)
          )
        )
        .returning();

      const updated = updatedRows[0];
      if (updated) return updated.lastSequence;

      // If no row was updated, insert initial sequence = 1
      const [created] = await db
        .insert(certificateSequence)
        .values({ year, courseCode, lastSequence: 1 })
        .onConflictDoNothing()
        .returning();

      if (created) return created.lastSequence;

      const existingSeq = await this.getCertificateSequence(year, courseCode);
      if (existingSeq) return existingSeq.lastSequence + 1

      // Retry if insert didn't create row
      return tryGetNextSequence();
    };

    return tryGetNextSequence();
  }

  async updateCertificateSequence(
    year: number,
    courseCode: string,
    newSequence: number
  ): Promise<void> {
    console.log('updateCertificateSequence called with:', { year, courseCode, newSequence });

    if (newSequence == null) throw new Error("Invalid sequence number");

    await db
      .update(certificateSequence)
      .set({ lastSequence: newSequence })
      .where(
        and(eq(certificateSequence.year, year), eq(certificateSequence.courseCode, courseCode))
      );
  }


  // Certificates count
  async getCertificatesCount(search?: string, batchId?: string): Promise<number> {
    const conditions = [];

    if (search && search.trim()) {
      conditions.push(
        or(
          like(certificates.recipientName, `%${search}%`),
          like(certificates.certificateId, `%${search}%`),
          like(certificates.course, `%${search}%`),
          like(certificates.department, `%${search}%`),
          like(certificates.college, `%${search}%`)
        )
      );
    }

    if (batchId) {
      conditions.push(eq(certificates.batchId, batchId));
    }

    let query = db.select({ count: sql<number>`count(*)` }).from(certificates);
    if (conditions.length) query = query.where(and(...conditions));

    const [result] = await query;
    return Number(result.count);
  }

  // Letters count
  async getLettersCount(search?: string, batchId?: string, letterType?: string): Promise<number> {
    const conditions = [];

    if (search && search.trim() !== '') {
      conditions.push(like(letters.recipientName, `%${search}%`));
    }
    if (batchId && batchId.trim() !== '') conditions.push(eq(letters.batchId, batchId));
    if (letterType && letterType.trim() !== '') conditions.push(eq(letters.letterType, letterType));

    let query = db.select({ count: sql<number>`count(*)` }).from(letters);
    if (conditions.length) query = query.where(and(...conditions));

    const [result] = await query;
    return Number(result.count);
  }

  // Batches count
  async getBatchesCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(batches);
    return Number(result.count);
  }

  // Update getBatches with pagination
  // async getBatches(limit = 20, offset = 0): Promise<Batch[]> {
  //   return await db
  //     .select()
  //     .from(batches)
  //     .orderBy(desc(batches.createdAt))
  //     .limit(limit)
  //     .offset(offset);
  // }


  // Stats
  async getStats(): Promise<{
    totalCertificates: number;
    totalLetters: number;
    totalBatches: number;
    totalDownloads: number;
  }> {
    const certificatesResult = await db.select().from(certificates);
    const lettersResult = await db.select().from(letters);
    const batchesResult = await db.select().from(batches);

    return {
      totalCertificates: certificatesResult.length,
      totalLetters: lettersResult.length,
      totalBatches: batchesResult.length,
      totalDownloads: 0, // This would need to be tracked separately
    };
  }
}

export const storage = new DatabaseStorage();
