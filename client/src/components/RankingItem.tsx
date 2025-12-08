import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Team, VoteStats } from "@shared/schema";
import TeamVoting from "./TeamVoting";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RankingItemProps {
  team: Team;
  date?: string;
  isCurrentRanking?: boolean;
}

export default function RankingItem({ team, date, isCurrentRanking = true }: RankingItemProps) {
  // Fetch vote statistics
  const { data: allStats } = useQuery<VoteStats[]>({
    queryKey: ['/api/votes', date],
    queryFn: async () => {
      const voteDate = date || new Date().toISOString().split('T')[0];
      const url = `/api/votes?date=${voteDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch vote stats');
      return res.json();
    },
  });

  const voteCount = allStats?.find(s => s.teamId === team.id)?.total || 0;
  const getTrendDisplay = () => {
    const trend = Number(team.trend || 0);

    if (trend > 0) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-sm" data-testid={`trend-up-${team.id}`}>
          <TrendingUp className="w-4 h-4" />{Math.abs(trend)}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 font-bold text-sm" data-testid={`trend-down-${team.id}`}>
        <TrendingDown className="w-4 h-4" />{Math.abs(trend)}
      </span>
    );
  };

  const getTrendColor = () => {
    const trend = Number(team.trend || 0);
    if (trend > 0) {
      return "bg-green-50 text-green-700 border-green-200";
    }
    if (trend < 0) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    return "bg-muted text-muted-foreground border-muted-border";
  };

  const getTournamentStatusEmoji = () => {
    switch (team.tournamentStatus) {
      case 'lock':
        return '🔒';
      case 'work-to-do':
        return '👷';
      case 'not-sure':
        return '🤔';
      case 'out':
        return '☠️';
      default:
        return null;
    }
  };

  const tournamentStatusEmoji = getTournamentStatusEmoji();

  return (
    <Card 
      className="p-4 md:p-6 hover-elevate" 
      data-testid={`team.item-${team.id}`}
    >
      <div className="flex gap-4 md:gap-6">
        <div className="flex-shrink-0 flex flex-col items-center gap-4 self-start">
          <div className="w-[2.25rem] h-[2.25rem] md:w-[2.75rem] md:h-[2.75rem] rounded-md overflow-hidden border border-border bg-card">
            <img
              src={team.logoUrl}
              alt={`${team.name} logo`}
              className="w-full h-full object-contain"
              data-testid={`team-logo-${team.id}`}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-full flex justify-center">
              <TeamVoting teamId={team.id} date={date} isCurrentRanking={isCurrentRanking} position="top" />
            </div>
            <div 
              className="text-[2.125rem] md:text-[2.55rem] font-bold text-primary leading-none"
              data-testid={`rank-number-${team.id}`}
            >
              {team.rank}
            </div>
            <div className="w-full flex justify-center">
              <TeamVoting teamId={team.id} date={date} isCurrentRanking={isCurrentRanking} position="bottom" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 
              className="text-xl md:text-2xl font-semibold"
              data-testid={`team-name-${team.id}`}
            >
              {team.name}
            </h3>
            {team.trend !== 0 && (
              <Badge 
                variant="outline" 
                className={`${getTrendColor()} border`}
                data-testid={`trend-badge-${team.id}`}
              >
                {getTrendDisplay()}
              </Badge>
            )}
            {voteCount !== 0 && (
              <Badge 
                variant="outline" 
                className={`${voteCount > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} border text-sm font-bold`}
                data-testid={`vote-count-${team.id}`}
              >
                {voteCount > 0 ? '+' : ''}{voteCount}
              </Badge>
            )}
          </div>
          {team.record && (
            <p 
              className="text-sm font-medium text-muted-foreground mb-2"
              data-testid={`team-record-${team.id}`}
            >
              {team.record}
            </p>
          )}
          {(team.mvp || tournamentStatusEmoji) && (
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 mb-3 text-sm text-muted-foreground">
              {team.mvp && (
                <p data-testid={`team-mvp-${team.id}`}>
                  <span className="font-medium text-foreground">MVP:</span> {team.mvp}
                </p>
              )}
              {tournamentStatusEmoji && (
                <p className="flex items-baseline gap-1" data-testid={`tournament-status-${team.id}`}>
                  <span className="font-medium text-foreground">Tourney Status:</span> <span className="text-xl leading-none">{tournamentStatusEmoji}</span>
                </p>
              )}
            </div>
          )}
          <p 
            className="text-sm text-muted-foreground"
            data-testid={`team-blurb-${team.id}`}
          >
            {team.blurb}
          </p>
        </div>
      </div>
    </Card>
  );
}
