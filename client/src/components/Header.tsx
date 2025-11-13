export default function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        <div className="text-center">
          <h1 
            className="font-heading text-5xl md:text-6xl font-bold uppercase tracking-wide text-primary mb-2"
            data-testid="page-title"
          >
            Big Ten Basketball Power Rankings
          </h1>
          <p 
            className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wide text-foreground"
            data-testid="page-subtitle"
          >
            From someone that actually watches all the games
          </p>
        </div>
        <div className="mt-6 text-sm text-muted-foreground">
          <p className="font-bold mb-2 text-foreground">A couple notes:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              These are "gut-feeling" rankings. I don't use the AP Poll or
              Kenpom, Torvik, etc as a source here.
            </li>
            <li>
              I love to rank things. If you would like to see something
              added here, reach out to admin@big18basketball.com.
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
