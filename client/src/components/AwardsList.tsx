import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { Awards, AwardPlayer } from "@shared/schema";

function AwardPlayerCard({ player }: { player: AwardPlayer }) {
  return (
    <div className="flex gap-4 items-center">
      {player.headshotUrl ? (
        <img
          src={player.headshotUrl}
          alt={`${player.name} headshot`}
          className="w-14 h-14 flex-shrink-0 rounded-md object-cover border border-border"
        />
      ) : (
        <div className="w-14 h-14 flex-shrink-0 rounded-md bg-muted border border-border" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{player.name}</p>
        {player.team && (
          <p className="text-sm text-muted-foreground">{player.team}</p>
        )}
        {player.description && (
          <p className="text-sm text-muted-foreground mt-1">{player.description}</p>
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
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
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
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Card className="p-4 md:p-6">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex gap-4 items-center">
                    <Skeleton className="w-14 h-14 flex-shrink-0 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-28" />
                    </div>
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
    <div className="space-y-8" data-testid="awards-list">
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

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">6th Man of the Year</h3>
        <Card className="p-4 md:p-6">
          <AwardPlayerCard player={awards.sixthManOfTheYear} />
        </Card>
      </div>
    </div>
  );
}
