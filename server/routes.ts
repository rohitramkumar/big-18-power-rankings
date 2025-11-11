import { Express } from "express";
import { createServer, type Server } from "http";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { TeamSchema, Team } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for rankings
  app.get("/api/rankings", async (req, res) => {
    try {
      const rankingsDir = join(process.cwd(), "rankings");
      const files = await readdir(rankingsDir);

      const rankingFiles = files
        .filter((file) => file.endsWith(".json"))
        .sort()
        .reverse(); // Sorts to get the latest week first

      if (rankingFiles.length === 0) {
        return res.status(500).json({ error: "No ranking files found." });
      }

      const latestRankingFileName = rankingFiles[0];
      const latestRankingFilePath = join(rankingsDir, latestRankingFileName);

      const fileContent = await readFile(latestRankingFilePath, "utf-8");
      const rawData = JSON.parse(fileContent);

      // Validate the data against the schema
      const validatedData = TeamSchema.array().parse(rawData);

      res.json(validatedData);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      res.status(500).json({ error: "Failed to fetch rankings." });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
