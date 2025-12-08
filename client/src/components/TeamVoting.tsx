import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VoteStats, SubmitVote } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeamVotingProps {
  teamId: string;
  date?: string;
  isCurrentRanking?: boolean;
  position?: 'top' | 'bottom';
}

export default function TeamVoting({ teamId, date, isCurrentRanking = true, position }: TeamVotingProps) {
  const queryClient = useQueryClient();

  // Get vote statistics for this team
  const { data: allStats } = useQuery<VoteStats[]>({
    queryKey: ['/api/votes', date],
    queryFn: async () => {
      const url = date ? `/api/votes?date=${date}` : '/api/votes';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch vote stats');
      return res.json();
    },
  });

  const stats = allStats?.find(s => s.teamId === teamId);

  // Mutation to submit vote
  const voteMutation = useMutation({
    mutationFn: async (vote: SubmitVote) => {
      const res = await fetch('/api/votes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vote),
      });
      if (!res.ok) throw new Error('Failed to submit vote');
      return res.json();
    },
    onSuccess: () => {
      // Refetch data after successful vote
      queryClient.invalidateQueries({ queryKey: ['/api/votes', date] });
    },
  });

  const handleVote = (vote: 'too-high' | 'too-low') => {
    // Use the date prop if provided, otherwise use today's date in YYYY-MM-DD format
    const voteDate = date || new Date().toISOString().split('T')[0];
    voteMutation.mutate({ teamId, vote, date: voteDate });
  };

  if (!isCurrentRanking) {
    return null;
  }

  // If position is specified, render just one button
  if (position === 'top') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleVote('too-low')}
              disabled={voteMutation.isPending}
              className="text-lg leading-none transition-opacity hover:opacity-70 disabled:opacity-50 text-gray-400"
            >
              ▲
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upvote</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (position === 'bottom') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleVote('too-high')}
              disabled={voteMutation.isPending}
              className="text-lg leading-none transition-opacity hover:opacity-70 disabled:opacity-50 text-gray-400"
            >
              ▼
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Downvote</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Original layout (if position not specified)
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => handleVote('too-high')}
          disabled={voteMutation.isPending}
          className="px-3 py-1.5 text-base font-medium rounded-md transition-colors bg-muted text-foreground border border-border hover:bg-red-50 hover:text-red-700"
        >
          👇
        </button>
        <button
          onClick={() => handleVote('too-low')}
          disabled={voteMutation.isPending}
          className="px-3 py-1.5 text-base font-medium rounded-md transition-colors bg-muted text-foreground border border-border hover:bg-blue-50 hover:text-blue-700"
        >
          👆
        </button>
      </div>
      {/* {stats && stats.total > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {stats.total} vote{stats.total !== 1 ? 's' : ''}
        </p>
      )} */}
    </div>
  );
}
