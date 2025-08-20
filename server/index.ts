import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { authRouter } from "./auth";
import { createServer } from "http";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
console.log("DEBUG DATABASE_URL =", process.env.DATABASE_URL);

const app = express();

// Enable CORS for frontend running on 5173
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// Register existing API routes
await registerRoutes(app); // keep existing routes intact

// Register login/auth route
app.use("/auth", authRouter);

// Error handler (only once, after all routes)
app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  }
);

// Create HTTP server
const port = parseInt(process.env.PORT || "5000", 10);
const server = createServer(app);

server.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
