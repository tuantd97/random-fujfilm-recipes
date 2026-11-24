"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const CATALOG_QUERY_KEY = "catalog-query";

/** Back to /recipes with whatever filters the user last had there. */
export function BackToCatalog() {
  const router = useRouter();

  return (
    <Link
      href="/recipes"
      onClick={(e) => {
        let query = "";
        try {
          query = sessionStorage.getItem(CATALOG_QUERY_KEY) ?? "";
        } catch {
          // No storage: fall back to the unfiltered list.
        }
        if (!query) return;
        e.preventDefault();
        router.push(`/recipes${query}`);
      }}
      className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Tất cả recipes
    </Link>
  );
}
