import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import * as nodePostgres from "drizzle-orm/node-postgres";

import {
  users,
  certificates,
  letters,
  completionLetters,
  batches,
  certificateSequence,
  globalCertificateSequence,
} from "./shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in .env");
}

const dbUrl = process.env.DATABASE_URL.trim();

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: false,
});

const db = nodePostgres.drizzle(pool);
console.log("Using local Postgres");

export { db, pool };
export {
  users,
  certificates,
  letters,
  completionLetters,
  batches,
  certificateSequence,
  globalCertificateSequence,
};
