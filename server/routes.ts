import { Express } from "express";
import { createServer, type Server } from "http";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { TeamSchema, Team, RankingsSchema, PlayerSchema } from "../shared/schema";

function extractDateFromFilename(filename: string): string {
  // Extract date from format like "2025-10-12.json"
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (match) {
    const dateStr = match[1];
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return "Unknown";
}

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
      // Extract date from filename
      const lastUpdated = extractDateFromFilename(latestRankingFileName);

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
      const validatedData = PlayerSchema.array().parse(rawData);

      res.json(validatedData);
    } catch (error) {
      console.error("Error fetching player rankings:", error);
      res.status(500).json({ error: "Failed to fetch player rankings." });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
