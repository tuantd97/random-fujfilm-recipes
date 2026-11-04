"use client";

import { useCallback, useEffect, useState } from "react";
import { Camera, Check, Copy, ExternalLink, Shuffle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  findScene,
  groupSettings,
  pickRandom,
  recipes,
  recipesInScene,
  scenes,
  settingsToText,
  type Recipe,
} from "@/lib/recipes";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      role="radio"
      aria-checked={active}
      size="sm"
      variant={active ? "default" : "outline"}
      className="rounded-full"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function syncUrl(recipeSlug: string, sceneSlug?: string) {
  const params = new URLSearchParams();
  if (sceneSlug) params.set("scene", sceneSlug);
  params.set("r", recipeSlug);
  window.history.replaceState(null, "", `?${params}`);
}

export function RecipeRandomizer({
  initialSlug,
  initialScene,
}: {
  initialSlug: string;
  initialScene?: string;
}) {
  const [recipe, setRecipe] = useState<Recipe>(
    () => recipes.find((r) => r.slug === initialSlug) ?? recipes[0],
  );
  const [scene, setScene] = useState<string | undefined>(initialScene);
  const [spin, setSpin] = useState(0);
  const [copied, setCopied] = useState(false);

  const pool = recipesInScene(scene);
  const activeScene = findScene(scene);

  const show = useCallback((next: Recipe, sceneSlug?: string) => {
    setRecipe(next);
    setSpin((n) => n + 1);
    setCopied(false);
    syncUrl(next.slug, sceneSlug);
  }, []);

  const shuffle = useCallback(() => {
    show(pickRandom(recipesInScene(scene), recipe.slug), scene);
  }, [show, scene, recipe.slug]);

  function selectScene(sceneSlug?: string) {
    setScene(sceneSlug);
    // Picking a category draws straight from it so the result matches the filter.
    show(pickRandom(recipesInScene(sceneSlug), recipe.slug), sceneSlug);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, a, [role=menu]")) return;
      if (e.code === "Space" || e.key.toLowerCase() === "r") {
        e.preventDefault();
        shuffle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shuffle]);

  async function copySettings() {
    try {
      await navigator.clipboard.writeText(settingsToText(recipe));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); nothing else to do.
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div
        role="radiogroup"
        aria-label="Lọc theo điều kiện chụp"
        className="flex flex-wrap justify-center gap-2"
      >
        <FilterChip active={!scene} onClick={() => selectScene(undefined)}>
          Tất cả <span className="opacity-60">{recipes.length}</span>
        </FilterChip>
        {scenes.map((s) => (
          <FilterChip key={s.slug} active={scene === s.slug} onClick={() => selectScene(s.slug)}>
            {s.name} <span className="opacity-60">{recipesInScene(s.slug).length}</span>
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button size="lg" className="h-11 px-6 text-base" onClick={shuffle}>
          <Shuffle className="size-5" />
          Random recipe
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Random trong {pool.length} recipes
          {activeScene ? ` · ${activeScene.name}` : ""}
          <span className="hidden sm:inline">
            {" "}
            · hoặc nhấn{" "}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">Space</kbd>
          </span>
        </p>
      </div>

      <Card
        key={`${recipe.slug}-${spin}`}
        className="w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      >
        <CardHeader>
          {recipe.emulates && (
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Emulates {recipe.emulates}
            </p>
          )}
          <CardTitle className="text-2xl font-semibold sm:text-3xl">{recipe.name}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {recipe.description}
          </CardDescription>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {recipe.scenes.map((scene) => (
              <Badge key={scene} variant="secondary">
                {scene}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="grid gap-5 sm:grid-cols-2">
          {groupSettings(recipe.settings).map((group) => (
            <section key={group.label}>
              <h3 className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {group.label}
              </h3>
              <dl className="divide-y rounded-lg border">
                {group.settings.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-baseline justify-between gap-4 px-3 py-2"
                  >
                    <dt className="text-muted-foreground">{s.name}</dt>
                    <dd className="text-right font-mono font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </CardContent>

        {recipe.cameras.length > 0 && (
          <CardContent>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              <Camera className="size-3.5" />
              Works on {recipe.cameras.length} cameras
            </h3>
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              {recipe.cameras.join(" · ")}
            </p>
          </CardContent>
        )}

        <CardFooter className="flex flex-wrap justify-between gap-2 border-t pb-(--card-spacing)">
          <Button variant="outline" onClick={copySettings}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy settings"}
          </Button>
          <Button
            variant="ghost"
            render={<a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" />}
            nativeButton={false}
          >
            View on FujiRecipes
            <ExternalLink />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
