import Header from "@/components/Header";
import RankingsList from "@/components/RankingsList";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <RankingsList />
      </main>
      <footer className="border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 text-center">
          <p className="text-sm text-muted-foreground" data-testid="footer-text">
            Disclaimer: The creator of this page is an Illinois fan. 
          </p>
        </div>
      </footer>
    </div>
  );
}
