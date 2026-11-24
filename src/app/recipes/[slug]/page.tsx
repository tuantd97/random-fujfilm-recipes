import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { BackToCatalog } from "@/components/back-to-catalog";
import { RecipeDetail } from "@/components/recipe-detail";
import { filmSimulationOf, findRecipe, recipes, scenes, type Recipe } from "@/lib/recipes";

export function generateStaticParams() {
  return recipes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/recipes/[slug]">): Promise<Metadata> {
  const recipe = findRecipe((await params).slug);
  if (!recipe) return {};
  return { title: recipe.name, description: recipe.description };
}

/** Recipes sharing the most scene categories, with a bonus for the same film simulation. */
function similarRecipes(recipe: Recipe, limit = 3) {
  const sim = filmSimulationOf(recipe);
  return recipes
    .filter((r) => r.slug !== recipe.slug)
    .map((r) => ({
      recipe: r,
      score:
        r.categories.filter((c) => recipe.categories.includes(c)).length +
        (sim && filmSimulationOf(r) === sim ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name))
    .slice(0, limit)
    .map((x) => x.recipe);
}

async function RecipeContent({ params }: { params: PageProps<"/recipes/[slug]">["params"] }) {
  const recipe = findRecipe((await params).slug);
  if (!recipe) notFound();

  const categories = scenes.filter((s) => recipe.categories.includes(s.slug));
  const similar = similarRecipes(recipe);

  return (
    <>
      <RecipeDetail recipe={recipe} titleAs="h1" />

      {categories.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Thuộc nhóm</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((s) => (
              <Link
                key={s.slug}
                href={`/recipes?scene=${s.slug}`}
                className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Recipes tương tự</h2>
        <ul className="divide-y overflow-hidden rounded-xl border">
          {similar.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/recipes/${r.slug}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{r.description}</p>
                </div>
                <span className="hidden font-mono text-xs text-muted-foreground sm:block">
                  {filmSimulationOf(r)}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
      <BackToCatalog />
      {/* Keeps client navigation instant: the shell renders while params resolve. */}
      <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-xl bg-muted" />}>
        <RecipeContent params={params} />
      </Suspense>
    </main>
  );
}
