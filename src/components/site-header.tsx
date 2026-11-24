import { Suspense } from "react";
import Link from "next/link";
import { Aperture } from "lucide-react";

import { NavLinks, NavLinksFallback } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-2 px-4">
        <Link href="/" className="mr-2 flex items-center gap-2 font-semibold">
          <Aperture className="size-5" />
          <span className="hidden sm:inline">Random Fuji Recipe</span>
        </Link>
        {/* usePathname can suspend on pages whose params aren't known at build time. */}
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const link = "underline underline-offset-4 hover:text-foreground";
  return (
    <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-center text-xs text-muted-foreground">
      Recipe data from{" "}
      <a href="https://fujirecipes.io/recipes" target="_blank" rel="noopener noreferrer" className={link}>
        fujirecipes.io
      </a>
      . Weather by{" "}
      <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className={link}>
        Open-Meteo
      </a>
      , place names by{" "}
      <a href="https://www.bigdatacloud.com" target="_blank" rel="noopener noreferrer" className={link}>
        BigDataCloud
      </a>
      . Not affiliated with Fujifilm.
    </footer>
  );
}
