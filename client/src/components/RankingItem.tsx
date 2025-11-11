import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus } from "lucide-react";
import type { Team } from "@shared/schema";

interface RankingItemProps {
  team: Team;
}

export default function RankingItem({ team }: RankingItemProps) {
  const getTrendDisplay = () => {
    if (team.trend === 0) {
      return <Minus className="w-4 h-4" data-testid={`trend-same-${team.id}`} />;
    }
    return (
      <span className="font-bold text-sm" data-testid={`trend-number-${team.id}`}>
        {team.trend}
      </span>
    );
  };

  const getTrendColor = () => {
    /*
    if (team.trend > 0) {
      return "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/20";
    } else if (team.trend < 0) {
      return "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20";
    }
    */
    return "bg-muted text-muted-foreground border-muted-border";
  };

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
