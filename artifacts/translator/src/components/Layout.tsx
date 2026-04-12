import React from "react";
import { Link, useLocation } from "wouter";
import { BookA, History } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto w-full px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-serif italic font-bold">
              译
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight group-hover:text-primary transition-colors">
              Lexicon
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link 
              href="/" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="link-nav-translate"
            >
              <BookA className="w-4 h-4" />
              <span>Translate</span>
            </Link>
            <Link 
              href="/history" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                location === "/history" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="link-nav-history"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border/50">
        <div className="font-serif italic">Translating with precision.</div>
      </footer>
    </div>
  );
}
