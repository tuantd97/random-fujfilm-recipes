import { Suspense } from "react";

import { RecipeExplorer } from "@/components/recipe-explorer";
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
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
  );
}
