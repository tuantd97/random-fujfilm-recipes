import { Suspense } from "react";
import type { Metadata } from "next";

import { RecipeCatalog } from "@/components/recipe-catalog";
import { filmSimulations, findScene, recipes } from "@/lib/recipes";

export const metadata: Metadata = {
  title: "Tất cả recipes",
  description: `Danh sách đầy đủ ${recipes.length} Fujifilm film simulation recipes, lọc theo điều kiện chụp và film simulation.`,
};

async function Catalog({ searchParams }: { searchParams: PageProps<"/recipes">["searchParams"] }) {
  const { q, scene, sim } = await searchParams;
  return (
    <RecipeCatalog
      initialFilters={{
        query: typeof q === "string" ? q : undefined,
        scene: findScene(typeof scene === "string" ? scene : undefined)?.slug,
        filmSimulation:
          typeof sim === "string" && filmSimulations.includes(sim) ? sim : undefined,
      }}
    />
  );
}

export default function RecipesPage({ searchParams }: PageProps<"/recipes">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tất cả recipes</h1>
        <p className="mt-1 text-muted-foreground">
          {recipes.length} Fujifilm film simulation recipes. Lọc theo điều kiện chụp hoặc film
          simulation, bấm vào một recipe để xem đầy đủ thông số.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        }
      >
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
