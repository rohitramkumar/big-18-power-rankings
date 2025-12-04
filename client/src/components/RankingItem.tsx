import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, ArrowUp, ArrowDown } from "lucide-react";
import type { Team } from "@shared/schema";

interface RankingItemProps {
  team: Team;
}

export default function RankingItem({ team }: RankingItemProps) {
  const getTrendDisplay = () => {
    const trend = Number(team.trend || 0);
    if (trend === 0) {
      return <Minus className="w-4 h-4" data-testid={`trend-same-${team.id}`} />;
    }

    if (trend > 0) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-sm" data-testid={`trend-up-${team.id}`}>
          <ArrowUp className="w-3 h-3" />{Math.abs(trend)}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 font-bold text-sm" data-testid={`trend-down-${team.id}`}>
        <ArrowDown className="w-3 h-3" />{Math.abs(trend)}
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
      <div className="flex gap-4 md:gap-6 items-start">
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <div 
            className="text-4xl md:text-5xl font-bold text-primary"
            data-testid={`rank-number-${team.id}`}
          >
            {team.rank}
          </div>
          <Badge 
            variant="outline" 
            className={`${getTrendColor()} border`}
            data-testid={`trend-badge-${team.id}`}
          >
            {getTrendDisplay()}
          </Badge>
        </div>

        <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-md overflow-hidden border border-border bg-card">
          <img
            src={team.logoUrl}
            alt={`${team.name} logo`}
            className="w-full h-full object-contain"
            data-testid={`team-logo-${team.id}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 
            className="text-xl md:text-2xl font-semibold mb-1"
            data-testid={`team-name-${team.id}`}
          >
            {team.name}
          </h3>
          {team.record && (
            <p 
              className="text-sm font-medium text-muted-foreground mb-2"
              data-testid={`team-record-${team.id}`}
            >
              {team.record}
            </p>
          )}
          {team.mvp && (
            <p className="text-sm text-muted-foreground mb-2" data-testid={`team-mvp-${team.id}`}>
              <span className="font-medium text-foreground">MVP:</span> {team.mvp}
            </p>
          )}
          {tournamentStatusEmoji && (
            <p className="text-sm text-muted-foreground mb-2" data-testid={`tournament-status-${team.id}`}>
              <span className="font-medium text-foreground">Tournament Status:</span> <span className="text-xl">{tournamentStatusEmoji}</span>
            </p>
          )}
          <p 
            className="text-base leading-relaxed text-muted-foreground"
            data-testid={`team-blurb-${team.id}`}
          >
            {team.blurb}
          </p>
        </div>
      </div>
    </Card>
  );
}
