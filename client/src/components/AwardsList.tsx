import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { Awards, AwardPlayer } from "@shared/schema";

function AwardPlayerCard({ player }: { player: AwardPlayer }) {
  return (
    <div className="flex flex-col items-center text-center gap-1 p-1">
      {player.headshotUrl ? (
        <img
          src={player.headshotUrl}
          alt={`${player.name} headshot`}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-border flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted border border-border flex-shrink-0" />
      )}
      <div className="min-w-0 w-full">
        <p className="font-semibold text-xs leading-tight">{player.name}</p>
        {player.team && (
          <p className="text-xs text-muted-foreground">{player.team}</p>
        )}
        {player.description && (
          <p className="text-xs text-muted-foreground italic">{player.description}</p>
        )}
      </div>
    </div>
  );
}

function AwardSection({
  title,
  players,
}: {
  title: string;
  players: AwardPlayer[];
}) {
  if (players.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold">{title}</h3>
      <Card className="p-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
          {players.map((player) => (
            <AwardPlayerCard key={`${player.name}-${player.team ?? ""}`} player={player} />
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function AwardsList() {
  const { data: awards, isLoading, error } = useQuery<Awards>({
    queryKey: ["/api/awards"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Card className="p-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex flex-col items-center gap-1 p-1">
                    <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg text-destructive mb-4">
          Failed to load awards
        </p>
      </Card>
    );
  }

  if (!awards) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg text-muted-foreground">
          No awards available at this time.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="awards-list">
      <AwardSection
        title="1st Team All Conference"
        players={awards.allConference.firstTeam}
      />
      <AwardSection
        title="2nd Team All Conference"
        players={awards.allConference.secondTeam}
      />
      <AwardSection
        title="3rd Team All Conference"
        players={awards.allConference.thirdTeam}
      />
      <AwardSection title="All Freshman Team" players={awards.allFreshmen} />
      <AwardSection title="All Defensive Team" players={awards.allDefensive} />

      <div className="space-y-2">
        <h3 className="text-base font-semibold">6th Man of the Year</h3>
        <Card className="p-3">
          <div className="flex justify-center">
            <div className="w-1/3 sm:w-1/4 md:w-1/5">
              <AwardPlayerCard player={awards.sixthManOfTheYear} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
