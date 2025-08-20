import express from "express";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { users } from "./shared/schema";


export const authRouter = express.Router();

// Login route
authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    // Use sql`` to compare, compatible with Neon + Drizzle
    const user = await db
      .select()
      .from(users)
      .where(sql`${users.username} = ${username}`)
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (password !== user[0].password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user[0].id, username: user[0].username },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

