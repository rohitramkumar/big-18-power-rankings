import { z } from 'zod';

export const TeamSchema = z.object({
  id: z.string(),
  rank: z.number(),
  name: z.string(),
  logoUrl: z.string(),
  trend: z.number().optional(),
  mvp: z.string().optional(),
  blurb: z.string(),
  record: z.string(),
  tournamentStatus: z.enum(['lock', 'work-to-do', 'not-sure', 'out']).optional(),
});

export type Team = z.infer<typeof TeamSchema>;

export const RankingsSchema = z.object({
  teams: z.array(TeamSchema),
  lastUpdated: z.string(),
});

export type Rankings = z.infer<typeof RankingsSchema>;

export const PlayerSchema = z.object({
  rank: z.number().optional(),
  name: z.string(),
  team: z.string().optional(),
  headshotUrl: z.string().optional(),
  blurb: z.string().optional(),
});

export type Player = z.infer<typeof PlayerSchema>;

export const PlayersSchema = z.object({
  top: z.array(PlayerSchema),
  honorableMentions: z.array(PlayerSchema),
});

export type Players = z.infer<typeof PlayersSchema>;

export const VoteStatsSchema = z.object({
  teamId: z.string(),
  total: z.number(),
});

export type VoteStats = z.infer<typeof VoteStatsSchema>;

export const SubmitVoteSchema = z.object({
  teamId: z.string(),
  vote: z.enum(['too-high', 'just-right', 'too-low']),
  date: z.string(),
});

export type SubmitVote = z.infer<typeof SubmitVoteSchema>;
