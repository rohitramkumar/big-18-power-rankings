import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { Player, Rankings } from "@shared/schema";

export default function PlayerRankingsList() {
  const { data: players, isLoading, error } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4 md:p-6">
            <div className="flex gap-4 md:gap-6 items-start">
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <Skeleton className="h-16 w-16 md:h-20 md:w-20" />
              </div>
              <Skeleton className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg text-destructive mb-4">
          Failed to load player rankings
        </p>
      </Card>
    );
  }

  if (!players || players.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg text-muted-foreground">
          No player rankings available at this time.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="player-rankings-list">
      <div className="flex flex-col items-center gap-2">
        <div className="bg-muted/50 border border-border rounded-md p-3 mb-0 w-full">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Note:</span> Any player on a team in the bottom 4 of the power rankings cannot be included.
          </p>
        </div>
      </div>
      {players.map((player) => (
        <Card
          key={player.rank}
          className="p-4 md:p-6 hover-elevate"
          data-testid={`player-item-${player.rank}`}
        >
          <div className="flex gap-4 md:gap-6 items-start">
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">
                {player.rank}
              </div>
            </div>

            {player.headshotUrl && (
              <img
                src={player.headshotUrl}
                alt={`${player.name} headshot`}
                className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-md object-cover border border-border"
                data-testid={`player-headshot-${player.rank}`}
              />
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-semibold mb-1">
                {player.name}
              </h3>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {player.team}
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                {player.blurb}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
