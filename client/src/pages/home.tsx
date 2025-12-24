import { useState } from "react";
import Header from "@/components/Header";
import RankingsList from "@/components/RankingsList";
import PlayerRankingsList from "@/components/PlayerRankingsList";

export default function Home() {
  const [showPlayers, setShowPlayers] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={() => setShowPlayers(false)}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              !showPlayers
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-transparent text-foreground border border-border hover:bg-muted"
            }`}
          >
            Team Rankings
          </button>
          <button
            onClick={() => setShowPlayers(true)}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              showPlayers
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-transparent text-foreground border border-border hover:bg-muted"
            }`}
          >
            Player Rankings
          </button>
        </div>
        {showPlayers ? <PlayerRankingsList /> : <RankingsList />}
      </main>
      <footer className="border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground" data-testid="footer-text">
              Disclaimer: The creator of this page is an Illinois fan. 
            </p>
            <p className="text-sm text-muted-foreground">
              Questions? Get in touch at admin@big18basketball.com
            </p>
            <a 
              href="https://x.com/Big18Basketball" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Follow on X"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.07-6.614L2.882 21.75H.579l7.732-8.835L.126 2.25h6.82l4.822 6.36 5.696-6.36zM16.699 19.5h1.832L7.29 4.126H5.31L16.699 19.5z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
