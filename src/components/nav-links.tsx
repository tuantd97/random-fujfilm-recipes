"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LibraryBig } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Trang chủ", icon: House, match: (p: string) => p === "/" },
  {
    href: "/recipes",
    label: "Recipes",
    icon: LibraryBig,
    match: (p: string) => p.startsWith("/recipes"),
  },
] as const;

function Links({ pathname }: { pathname?: string }) {
  return (
    <nav aria-label="Điều hướng chính" className="flex items-center gap-1">
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = pathname !== undefined && match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-muted text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavLinks() {
  return <Links pathname={usePathname()} />;
}

/** Same links without the active state, shown while the pathname is unknown. */
export function NavLinksFallback() {
  return <Links />;
}
