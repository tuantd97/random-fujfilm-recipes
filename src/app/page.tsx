import { Suspense } from "react";
import { Aperture } from "lucide-react";
import { connection } from "next/server";

import { RecipeRandomizer } from "@/components/recipe-randomizer";
import { ThemeToggle } from "@/components/theme-toggle";
import { pickRandom, recipes } from "@/lib/recipes";

async function RandomRecipe({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { r } = await searchParams;
  const requested = typeof r === "string" ? recipes.find((x) => x.slug === r) : undefined;
  // Random pick must happen per request, not at prerender time.
  await connection();
  const initial = requested ?? pickRandom();
  return <RecipeRandomizer initialSlug={initial.slug} />;
}

function RecipeSkeleton() {
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="h-11 w-44 animate-pulse rounded-lg bg-muted" />
      <div className="h-[36rem] w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <Aperture className="size-5" />
          Random Fuji Recipe
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-4 py-6 sm:py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Không biết chụp recipe nào?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Bốc ngẫu nhiên 1 trong {recipes.length} Fujifilm film simulation recipes.
          </p>
        </div>

        <Suspense fallback={<RecipeSkeleton />}>
          <RandomRecipe searchParams={searchParams} />
        </Suspense>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-center text-xs text-muted-foreground">
        Recipe data from{" "}
        <a
          href="https://fujirecipes.io/recipes"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          fujirecipes.io
        </a>
        . Not affiliated with Fujifilm.
      </footer>
    </div>
  );
}
