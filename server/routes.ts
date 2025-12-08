import { Express } from "express";
import { createServer, type Server } from "http";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { TeamSchema, Team, PlayersSchema, SubmitVoteSchema, VoteStats, VoteStatsSchema } from "../shared/schema";
import { db } from "./firestore";
import { FieldValue } from 'firebase-admin/firestore';

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for rankings
  app.get("/api/rankings", async (req, res) => {
    try {
      const rankingsDir = join(process.cwd(), "rankings");

      // If a `filename` query param is provided, try to read that file from `rankings/archives`.
      // Expected format: YYYY-MM-DD (e.g. "2025-11-12"). If not provided, fall back to latest file in `rankings`.
      const requestedFilename = typeof req.query.filename === "string" ? req.query.filename : undefined;

      let fileContent: string;
      let latestRankingFileName: string;

      if (requestedFilename) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedFilename)) {
          return res.status(400).json({ error: "Invalid filename format. Expected YYYY-MM-DD." });
        }

        const archivePath = join(rankingsDir, "archives", `${requestedFilename}.json`);
        try {
          fileContent = await readFile(archivePath, "utf-8");
          latestRankingFileName = `${requestedFilename}.json`;
        } catch (err) {
          console.error("Requested archive file not found:", archivePath, err);
          return res.status(404).json({ error: "Requested ranking file not found in archives." });
        }

        console.log("Filename requested: ", requestedFilename);
      } else {
        const files = await readdir(rankingsDir);

        const rankingFiles = files
          .filter(
            (file) =>
              file.endsWith(".json") && !file.startsWith("template") && file !== "mvps.json" && file !== "players.json"
          )
          .sort()
          .reverse(); // Sorts to get the latest week first

        if (rankingFiles.length === 0) {
          return res.status(500).json({ error: "No ranking files found." });
        }

        latestRankingFileName = rankingFiles[0];
        const latestRankingFilePath = join(rankingsDir, latestRankingFileName);

        fileContent = await readFile(latestRankingFilePath, "utf-8");
      }

      const rawData = JSON.parse(fileContent);

      // Validate the data against the schema
      const validatedData = TeamSchema.array().parse(rawData);

      // Attempt to read MVPs from a separate file (rankings/mvps.json)
      const mvpsPath = join(rankingsDir, "mvps.json");
      let mvpsMap: Record<string, string> = {};
      try {
        const mvpsRaw = await readFile(mvpsPath, "utf-8");
        mvpsMap = JSON.parse(mvpsRaw || "{}");
      } catch (err) {
        // It's fine if the file doesn't exist or is invalid; just continue without MVPs
        // console.warn(`No mvps file found or failed to read: ${err}`);
        mvpsMap = {};
      }

      // Merge MVP into each team object if present in mvpsMap
      const teamsWithMvps: Team[] = validatedData.map((t) => ({
        ...t,
        mvp: mvpsMap[t.id] || undefined,
      }));

      // Trend is calculated offline in the finalize script; do not compute here
      // Extract date from filename (YYYY-MM-DD format without .json)
      const lastUpdated = latestRankingFileName.replace(/\.json$/, "")

      // Return both teams and metadata (teams include optional mvp now)
      const response = {
        teams: teamsWithMvps,
        lastUpdated,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      res.status(500).json({ error: "Failed to fetch rankings." });
    }

  });

  // API endpoint to get archive rankings filenames
  app.get("/api/archives", async (_req, res) => {
    try {
      const archivesDir = join(process.cwd(), "rankings", "archives");

      const files = await readdir(archivesDir);

      // Only include files that match the date pattern YYYY-MM-DD.json
      const archiveFiles = files
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .sort()
        .reverse()
        .map((f) => f.replace(/\.json$/, ""));

      res.json(archiveFiles);
    } catch (err) {
      console.error("Error fetching archive filenames:", err);
      // If the archives folder doesn't exist or another error occurs, return an empty array.
      res.json([]);
    }

  });

  // API endpoint for player rankings
  app.get("/api/players", async (req, res) => {
    try {
      const rankingsDir = join(process.cwd(), "rankings");
      const playersPath = join(rankingsDir, "players.json");

      const fileContent = await readFile(playersPath, "utf-8");
      const rawData = JSON.parse(fileContent);

      // Validate the data against the schema
      const validatedData = PlayersSchema.parse(rawData);

      res.json(validatedData);
    } catch (error) {
      console.error("Error fetching player rankings:", error);
      res.status(500).json({ error: "Failed to fetch player rankings." });
    }
  });

  // API endpoint to submit a vote
  app.post("/api/votes/submit", async (req, res) => {
    try {
      console.log("=== Vote Submission Request ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      // Validate the request body
      const validatedVote = SubmitVoteSchema.parse(req.body);
      const { teamId, vote, date } = validatedVote;
      
      // Get the current latest ranking date
      const rankingsDir = join(process.cwd(), "rankings");
      const files = await readdir(rankingsDir);
      const rankingFiles = files
        .filter(
          (file) =>
            file.endsWith(".json") && !file.startsWith("template") && file !== "mvps.json" && file !== "players.json"
        )
        .sort()
        .reverse();
      
      if (rankingFiles.length === 0) {
        return res.status(400).json({ error: "No current rankings available." });
      }
      
      const latestRankingFileName = rankingFiles[0];
      const dateMatch = latestRankingFileName.match(/(\d{4}-\d{2}-\d{2})/);
      const currentDate = dateMatch ? dateMatch[1] : undefined;
      
      // Only allow voting on the current/latest rankings
      if (date !== currentDate) {
        console.log(`Vote rejected: Attempted to vote on ${date} but current date is ${currentDate}`);
        return res.status(403).json({ error: "Voting is only allowed for current rankings." });
      }
      
      // Use date as the document ID, store map of teamId -> counter
      const docRef = db.collection('votes').doc(date);
      console.log("Document reference path:", docRef.path);

      // Use Firestore transaction to safely increment the counter
      const result = await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        
        const incrementValue = vote === 'too-low' ? 1 : -1;
        console.log("Incrementing count by:", incrementValue, "for vote type:", vote);
        
        if (!doc.exists) {
          console.log("Creating new vote document for date:", date);
          // Create new document with initial map structure
          const newData = {
            [teamId]: incrementValue
          };
          console.log("New document data:", JSON.stringify(newData, null, 2));
          transaction.set(docRef, newData);
          return { created: true, data: newData };
        } else {
          console.log("Updating existing vote document for date:", date);
          const currentData = doc.data() || {};
          console.log("Current document data:", JSON.stringify(currentData, null, 2));
          
          const currentCount = currentData[teamId] || 0;
          console.log(`Current count for team ${teamId}:`, currentCount);
          console.log(`New count will be:`, currentCount + incrementValue);
          
          // Increment the counter for this specific team
          transaction.update(docRef, {
            [teamId]: FieldValue.increment(incrementValue),
          });
          return { created: false, previousCount: currentCount };
        }
      });
      
      console.log("Transaction completed successfully!");
      console.log("Transaction result:", JSON.stringify(result, null, 2));
      console.log("=== Vote Submission Complete ===\n");

      res.json({ success: true });
    } catch (error) {
      console.error("=== Vote Submission Error ===");
      console.error("Error submitting vote:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("=== End Error ===\n");
      res.status(500).json({ error: "Failed to submit vote." });
    }
  });

  // API endpoint to get vote statistics
  app.get("/api/votes", async (req, res) => {
    try {
      const date = req.query.date as string | undefined;

      if (!date) {
        // If no date provided, return empty array
        return res.json([]);
      }

      console.log("=== Fetching vote statistics for date:", date, "===");
      
      // Read the document for the given date
      const docRef = db.collection('votes').doc(date);
      const doc = await docRef.get();

      if (!doc.exists) {
        console.log("No vote document found for date:", date);
        return res.json([]);
      }

      const data = doc.data();
      console.log("Raw document data:", JSON.stringify(data, null, 2));

      // Convert the map of teamId -> count into an array of VoteStats
      const stats: VoteStats[] = [];
      if (data) {
        for (const [teamId, total] of Object.entries(data)) {
          const voteStats = VoteStatsSchema.parse({
            teamId,
            total,
          });
          stats.push(voteStats);
        }
      }

      console.log("Parsed vote stats:", JSON.stringify(stats, null, 2));
      console.log("=== Returning", stats.length, "vote stats ===\n");

      res.json(stats);
    } catch (error) {
      console.error("Error fetching vote stats:", error);
      res.status(500).json({ error: "Failed to fetch vote stats." });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
