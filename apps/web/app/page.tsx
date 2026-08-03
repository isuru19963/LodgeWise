export default function LandingPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Early development
        </span>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Lodgwise AI
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
          AI-powered Property Management System for modern hospitality
          businesses.
        </p>
      </div>
      <footer className="absolute bottom-8 text-xs text-muted-foreground">
        Hotels · Villas · Resorts · Cabanas · Hostels · Guest Houses · Apartments
      </footer>
    </main>
  );
}
