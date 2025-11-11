import { useQuery } from "@tanstack/react-query";
import RankingItem from "./RankingItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { Team } from "@shared/schema";

export default function RankingsList() {
  const { data: rankings, isLoading, error } = useQuery<Team[]>({
    queryKey: ['/api/rankings'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        {Array.from({ length: 14 }).map((_, i) => (
          <Card key={i} className="p-4 md:p-6">
            <div className="flex gap-4 md:gap-6 items-start">
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 md:h-16 md:w-16" />
                <Skeleton className="h-6 w-10" />
              </div>
              <Skeleton className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
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
        <p className="text-lg text-destructive mb-4" data-testid="error-message">
          Failed to load rankings
        </p>
        <p className="text-muted-foreground">
          Please try again later or check your connection.
        </p>
      </Card>
    );
  }

  if (!rankings || rankings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg text-muted-foreground" data-testid="empty-message">
          No rankings available at this time.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8" data-testid="rankings-list">
      {rankings.map((team) => (
        <RankingItem key={team.id} team={team} />
      ))}
    </div>
  );
}
