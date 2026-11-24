import { Suspense } from "react";
import { Aperture } from "lucide-react";

import { RecipeExplorer } from "@/components/recipe-explorer";
import { ThemeToggle } from "@/components/theme-toggle";
import { findScene, recipes } from "@/lib/recipes";

async function Explorer({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { r, scene } = await searchParams;
  const initialScene = findScene(typeof scene === "string" ? scene : undefined);
  const initialRecipe = typeof r === "string" ? recipes.find((x) => x.slug === r) : undefined;
  return <RecipeExplorer initialSlug={initialRecipe?.slug} initialScene={initialScene?.slug} />;
}

function ExplorerSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
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

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-4 sm:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hôm nay chụp recipe nào?</h1>
          <p className="mt-1 text-muted-foreground">
            Gợi ý 3 trong {recipes.length} Fujifilm film simulation recipes theo thời tiết nơi bạn
            đang đứng, hoặc bốc ngẫu nhiên.
          </p>
        </div>

        <Suspense fallback={<ExplorerSkeleton />}>
          <Explorer searchParams={searchParams} />
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
        . Weather by{" "}
        <a
          href="https://open-meteo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Open-Meteo
        </a>
        , place names by{" "}
        <a
          href="https://www.bigdatacloud.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          BigDataCloud
        </a>
        . Not affiliated with Fujifilm.
      </footer>
    </div>
  );
}
