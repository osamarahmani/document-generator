import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCertificateSchema, insertLetterSchema } from "./shared/schema";
import { z } from "zod";
import multer from "multer";
import { v4 as uuid } from 'uuid';
import bcrypt from "bcrypt"; // if passwords are hashed

const upload = multer({ storage: multer.memoryStorage() });


export async function registerRoutes(app: Express): Promise<Server> {
  // Certificate routes
  app.get("/api/certificates", async (req, res) => {
    try {
      const search = req.query.search as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const certificates = await storage.getCertificates(search, limit, offset);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  });

  app.get("/api/certificates/:id", async (req, res) => {
    try {
      const certificate = await storage.getCertificate(req.params.id);
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certificate" });
    }
  });

  app.post("/api/certificates", async (req, res) => {
    try {
      // Validate input with Zod (dob is still a string here)
      const validatedData = insertCertificateSchema.parse(req.body);

      // Convert dob string (if provided) to JS Date for PostgreSQL
      const dobDate = validatedData.dob ? new Date(validatedData.dob) : undefined;

      // Auto-generate certificateId if not provided
      if (!validatedData.certificateId) {
        const year = new Date().getFullYear();
        const courseCode = validatedData.courseCode || "";
        const sequenceStart = await storage.getNextCertificateSequence(year, courseCode);
        const certificateId = `TR-${year}/${courseCode}/${sequenceStart.toString().padStart(5, "0")}`;
        validatedData.certificateId = certificateId;
        await storage.updateCertificateSequence(year, courseCode, sequenceStart);
      }

      // Insert into DB, passing dob as Date
      const certificate = await storage.createCertificate({
        ...validatedData,
        dob: dobDate, // <-- pass Date object here
      });

      res.status(201).json(certificate);
    } catch (error: any) {
      console.error("Error creating certificate:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }

      res.status(500).json({ error: "Failed to create certificate" });
    }
  });

  // Bulk certificate creation from CSV
  app.post('/api/certificates/bulk', upload.single('csv'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No CSV file provided" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV file must have at least one data row" });
      }

      const headers = lines[0].split(',').map(h => h.trim());

      const requiredHeaders = ['Name', 'Course', 'Department', 'College', 'Duration'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          error: `Missing required columns: ${missingHeaders.join(', ')}`
        });
      }

      const yearRaw = req.body.year;
      const courseCode = req.body.courseCode;

      // Validate year
      const year = parseInt(yearRaw, 10);
      if (isNaN(year)) {
        return res.status(400).json({ error: "Invalid or missing 'year' field" });
      }

      if (!courseCode) {
        return res.status(400).json({ error: "Missing 'courseCode' field" });
      }

      // Create batch record
      const batch = await storage.createBatch({
        id: uuid(),
        name: req.file.originalname.replace('.csv', ''),
        type: 'certificate',
        csvFileName: req.file.originalname,
        totalDocuments: lines.length - 1,
        createdAt: new Date()
      });

      // Get starting sequence for this year + courseCode
      const sequenceStart = await storage.getNextCertificateSequence(year, courseCode);
      let sequence = sequenceStart;
      const certificatesToCreate = [];

      // Process each CSV data row
      for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',').map(d => d.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = data[idx] || '';
        });

        // Parse DOB from CSV (match multiple possible headers)
        const dobValue = row.DOB || row.dob || row.DateOfBirth || row.dateofbirth;
        const dob = dobValue ? new Date(dobValue.split('-').reverse().join('-')) : undefined;
        // This converts 'DD-MM-YYYY' to 'YYYY-MM-DD' for proper Date parsing

        if (row.Name && row.Course) {
          const certificateId = `TR-${year}/${courseCode}/${sequence.toString().padStart(5, '0')}`;

          certificatesToCreate.push({
            id: uuid(),
            certificateId,
            recipientName: row.Name,
            course: row.Course,
            courseCode,
            department: row.Department || '',
            college: row.College || '',
            duration: row.Duration || '',
            content: row.Content || '',
            dob,          // <-- make sure dob is included here
            batchId: batch.id,
            createdAt: new Date()
          });

          sequence++; // increment sequence for next certificate
        } else {
          console.warn(`Skipping row due to missing Name or Course:`, row);
        }
      }



      // Save certificates in bulk
      const createdCertificates = await storage.createCertificates(certificatesToCreate);

      // Update certificate sequence with last used sequence number
      await storage.updateCertificateSequence(year, courseCode, sequence - 1);

      res.status(201).json({
        batch,
        certificates: createdCertificates,
        count: createdCertificates.length
      });

    } catch (error) {
      console.error('Bulk certificate creation error:', error);
      res.status(500).json({ error: "Failed to process bulk certificates" });
    }
  });

  // Letter routes
  app.get("/api/letters", async (req, res) => {
    try {
      const search = req.query.search as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const letterType = req.query.letterType as string | undefined;

      const letters = await storage.getLetters(search, limit, offset, undefined, letterType);
      res.json(letters);
    } catch (error) {
      console.error('Error fetching letters:', error);
      res.status(500).json({ error: "Failed to fetch letters" });
    }
  });

  app.get("/api/letters/:id", async (req, res) => {
    try {
      const letter = await storage.getLetter(req.params.id);
      if (!letter) {
        return res.status(404).json({ error: "Letter not found" });
      }
      res.json(letter);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch letter" });
    }
  });

  app.post("/api/letters", async (req, res) => {
    try {
      // Sanitize incoming data to avoid nulls
      const sanitizedData = {
        ...req.body,
        courseName: req.body.courseName ?? "", // default if missing/null
        completionDate: req.body.completionDate ?? "",
        email: req.body.email ?? "",
        position: req.body.position ?? "",
        department: req.body.department ?? "",
        stipend: req.body.stipend ?? "",
        duration: req.body.duration ?? "",
        grade: req.body.grade ?? "",
        notes: req.body.notes ?? "",
        letterType: req.body.letterType ?? "completion",
        batchId: req.body.batchId ?? null,
        recipientName: req.body.recipientName ?? "",
        startDate: req.body.startDate ?? "",
        endDate: req.body.endDate ?? "",
        projectTitle: req.body.projectTitle ?? "",

      };

      const validatedData = insertLetterSchema.parse(sanitizedData);

      const letter = await storage.createLetter(validatedData);
      res.status(201).json(letter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error(error);
      res.status(500).json({ error: "Failed to create letter" });
    }
  });

  // Bulk letter creation from CSV
  app.post("/api/letters/bulk", upload.single('csv'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No CSV file provided" });
      }

      const letterType = (req.body.letterType || '').toLowerCase();
      if (!['offer', 'completion'].includes(letterType)) {
        return res.status(400).json({ error: "Invalid letter type. Use 'offer' or 'completion'." });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return res.status(400).json({ error: "No valid rows found in CSV" });
      }

      // Normalize headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Common header mappings
      const headerMap: Record<string, string> = {
        "recipientname": "Name",
        "name": "Name",
        "coursename": "Course",
        "course": "Course",
        "course_name": "Course",   // <-- add this line
        "startdate": "StartDate",
        "enddate": "EndDate",
        "completiondate": "CompletionDate",
        "position": "Position",
        "duration": "Duration",
        "internid": "InternId",
        "intern_id": "InternId",
        "projecttitle": "ProjectTitle",
        "project_title": "ProjectTitle",
        "letterdate": "LetterDate",
        "letter_date": "LetterDate",
      };


      // Create batch entry in DB
      const batch = await storage.createBatch({
        id: uuid(),
        name: req.file.originalname.replace('.csv', ''),
        type: `letter-${letterType}`,
        csvFileName: req.file.originalname,
        totalDocuments: lines.length - 1,
        createdAt: new Date(),
      });


      const letters = [];

      for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',').map(d => d.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          const mappedHeader = headerMap[header] || header;
          if (data[index] && data[index].trim() !== '') {
            row[mappedHeader] = data[index].trim();
          }
        });



        if (row.Name) {
          letters.push({
            recipientName: row.Name,
            letterType,
            batchId: batch.id,
            ...(row.Position && { position: row.Position }),
            ...(row.StartDate && { startDate: row.StartDate }),
            ...(row.EndDate && { endDate: row.EndDate }),
            ...(row.Course && { courseName: row.Course }),
            ...(row.Duration && { duration: row.Duration }),
            ...(row.CompletionDate && { completionDate: row.CompletionDate }),

            ...(row.InternId && { internId: row.InternId }),
            ...(row.ProjectTitle && { projectTitle: row.ProjectTitle }),
            ...(row.LetterDate && { letterDate: row.LetterDate }),
          });
        }

      }

      if (letters.length === 0) {
        return res.status(400).json({ error: "No valid rows found in CSV" });
      }

      const createdLetters = await storage.createLetters(letters);

      res.status(201).json({
        batch,
        letters: createdLetters,
        count: createdLetters.length
      });

    } catch (error) {
      console.error('Bulk letter creation error:', error);
      res.status(500).json({ error: "Failed to process bulk letters" });
    }
  });

  // Batch routes
  app.get("/api/batches", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const data = await storage.getBatches(limit, offset);
    const total = await storage.getBatchesCount();

    res.json({ data, total, limit, offset });
  });



  app.get("/api/batches/:id/certificates", async (req, res) => {
    try {
      const certificates = await storage.getCertificatesByBatch(req.params.id);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batch certificates" });
    }
  });

  app.get("/api/batches/:id/letters", async (req, res) => {
    try {
      const letters = await storage.getLettersByBatch(req.params.id);
      res.json(letters);
    } catch (error) {
      console.error("Error fetching batch letters:", error);
      res.status(500).json({ error: "Failed to fetch batch letters" });
    }
  });

  app.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const token = "user_token_here";
      res.json({ token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });




  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
