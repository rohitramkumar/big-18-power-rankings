import { z } from 'zod';

export const TeamSchema = z.object({
  id: z.string(),
  rank: z.number(),
  name: z.string(),
  logoUrl: z.string(),
  trend: z.number().optional(),
  blurb: z.string(),
  record: z.string(),
});

export type Team = z.infer<typeof TeamSchema>;

export const RankingsSchema = z.object({
  teams: z.array(TeamSchema),
  lastUpdated: z.string(),
});

export type Rankings = z.infer<typeof RankingsSchema>;
