"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, X } from "lucide-react";

import { CATALOG_QUERY_KEY } from "@/components/back-to-catalog";
import { FilterChip } from "@/components/filter-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filmSimulationOf,
  filmSimulations,
  filterRecipes,
  getTips,
  recipes,
  recipesInScene,
  scenes,
  type RecipeFilters,
} from "@/lib/recipes";

function syncUrl({ query, scene, filmSimulation }: RecipeFilters) {
  const params = new URLSearchParams();
  if (query?.trim()) params.set("q", query.trim());
  if (scene) params.set("scene", scene);
  if (filmSimulation) params.set("sim", filmSimulation);
  const search = params.toString() ? `?${params}` : "";
  // Keep filters in the URL (browser Back) and in the session (the detail page's back link).
  window.history.replaceState(null, "", search || window.location.pathname);
  rememberQuery(search);
}

function rememberQuery(search: string) {
  try {
    sessionStorage.setItem(CATALOG_QUERY_KEY, search);
  } catch {
    // Storage blocked; the back link just opens the unfiltered list.
  }
}

export function RecipeCatalog({ initialFilters }: { initialFilters: RecipeFilters }) {
  const [filters, setFilters] = useState<RecipeFilters>(initialFilters);
  const results = filterRecipes(filters).sort((a, b) => a.name.localeCompare(b.name));
  const hasFilters = !!(filters.query?.trim() || filters.scene || filters.filmSimulation);

  // Filters may also arrive via the URL (shared link, browser Back): remember those too.
  useEffect(() => rememberQuery(window.location.search), []);

  function update(patch: Partial<RecipeFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    syncUrl(next);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={filters.query ?? ""}
              onChange={(e) => update({ query: e.target.value })}
              placeholder="Tìm theo tên, film, mô tả…"
              aria-label="Tìm recipe"
              className="pl-8"
            />
          </div>
          <select
            value={filters.filmSimulation ?? ""}
            onChange={(e) => update({ filmSimulation: e.target.value || undefined })}
            aria-label="Lọc theo film simulation"
            className="h-8 cursor-pointer rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Mọi film simulation</option>
            {filmSimulations.map((sim) => (
              <option key={sim} value={sim}>
                {sim}
              </option>
            ))}
          </select>
        </div>

        <div role="radiogroup" aria-label="Lọc theo điều kiện chụp" className="flex flex-wrap gap-2">
          <FilterChip active={!filters.scene} onClick={() => update({ scene: undefined })}>
            Tất cả <span className="opacity-60">{recipes.length}</span>
          </FilterChip>
          {scenes.map((s) => (
            <FilterChip
              key={s.slug}
              active={filters.scene === s.slug}
              onClick={() => update({ scene: s.slug })}
            >
              {s.name} <span className="opacity-60">{recipesInScene(s.slug).length}</span>
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <p aria-live="polite">
          {results.length} / {recipes.length} recipes
        </p>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update({ query: "", scene: undefined, filmSimulation: undefined })}
          >
            <X /> Xoá bộ lọc
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Không có recipe nào khớp bộ lọc.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((recipe) => {
            const sim = filmSimulationOf(recipe);
            const tips = getTips(recipe.slug);
            return (
              <li key={recipe.slug}>
                <Link
                  href={`/recipes/${recipe.slug}`}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors outline-none hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <h2 className="font-semibold">{recipe.name}</h2>
                      {sim && <span className="font-mono text-xs text-muted-foreground">{sim}</span>}
                    </div>
                    {recipe.emulates && recipe.emulates !== recipe.name && (
                      <p className="text-xs text-muted-foreground">Emulates {recipe.emulates}</p>
                    )}
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {recipe.description}
                    </p>
                    {tips && (
                      <p className="mt-1.5 line-clamp-1 text-sm">
                        <span className="font-medium">Ánh sáng hợp: </span>
                        <span className="text-muted-foreground">{tips.bestFor}</span>
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {recipe.scenes.map((tag) => (
                        <Badge key={tag} variant="secondary" className="font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
