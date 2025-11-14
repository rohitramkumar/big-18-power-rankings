import { Express } from "express";
import { createServer, type Server } from "http";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { TeamSchema, Team, RankingsSchema } from "../shared/schema";

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
      const files = await readdir(rankingsDir);

      const rankingFiles = files
        .filter((file) => file.endsWith(".json") && !file.startsWith("template"))
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

      // Extract date from filename
      const lastUpdated = extractDateFromFilename(latestRankingFileName);

      // Return both teams and metadata
      const response = {
        teams: validatedData,
        lastUpdated,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      res.status(500).json({ error: "Failed to fetch rankings." });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
