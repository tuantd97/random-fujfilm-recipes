"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloudSun, Shuffle, Sparkles } from "lucide-react";

import { FilterChip } from "@/components/filter-chip";
import { RecipeDetail } from "@/components/recipe-detail";
import { RecipePickCard } from "@/components/recipe-pick-card";
import { WeatherPanel } from "@/components/weather-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeather } from "@/hooks/use-weather";
import { findScene, pickRandomSet, recipes, recipesInScene, scenes, type Recipe } from "@/lib/recipes";
import { recommend, weatherProfile } from "@/lib/recommend";

const PICK_COUNT = 3;

type Mode = "weather" | "random";

function syncUrl(sceneSlug?: string, recipeSlug?: string) {
  const params = new URLSearchParams();
  if (sceneSlug) params.set("scene", sceneSlug);
  if (recipeSlug) params.set("r", recipeSlug);
  const query = params.toString();
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

export function RecipeExplorer({
  initialSlug,
  initialScene,
}: {
  initialSlug?: string;
  initialScene?: string;
}) {
  const weather = useWeather();
  const [scene, setScene] = useState<string | undefined>(initialScene);
  const [mode, setMode] = useState<Mode>("weather");
  const [randomPicks, setRandomPicks] = useState<Recipe[]>([]);
  // A recipe the user clicked (or opened via ?r=). Undefined = show the first card.
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>(initialSlug);
  const [rolls, setRolls] = useState(0);
  const detailRef = useRef<HTMLElement>(null);

  const pool = recipesInScene(scene);
  const activeScene = findScene(scene);

  const profile = useMemo(
    () => (weather.weather ? weatherProfile(weather.weather) : undefined),
    [weather.weather],
  );
  const recommendations = useMemo(
    () =>
      profile && weather.weather
        ? recommend(recipesInScene(scene), profile, weather.weather.time.slice(0, 10), PICK_COUNT)
        : [],
    [profile, weather.weather, scene],
  );

  const list = mode === "weather" ? recommendations.map((r) => r.recipe) : randomPicks;
  const selected =
    recipes.find((r) => r.slug === selectedSlug) ?? (list.length > 0 ? list[0] : undefined);

  const roll = useCallback(
    (sceneSlug: string | undefined, avoid: string[]) => {
      setRandomPicks(pickRandomSet(recipesInScene(sceneSlug), PICK_COUNT, avoid));
      setSelectedSlug(undefined);
      setRolls((n) => n + 1);
      syncUrl(sceneSlug);
    },
    [],
  );

  function changeMode(next: Mode) {
    setMode(next);
    setSelectedSlug(undefined);
    syncUrl(scene);
    if (next === "random" && randomPicks.length === 0) roll(scene, []);
  }

  function selectScene(sceneSlug?: string) {
    setScene(sceneSlug);
    setSelectedSlug(undefined);
    syncUrl(sceneSlug);
    if (mode === "random") roll(sceneSlug, randomPicks.map((r) => r.slug));
  }

  function selectRecipe(recipe: Recipe) {
    setSelectedSlug(recipe.slug);
    syncUrl(scene, recipe.slug);
    // On phones the cards stack, so bring the details into view if they're below the fold.
    requestAnimationFrame(() => {
      const el = detailRef.current;
      if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // Space / R: jump to the random tab and draw a new set.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, a, [role=menu], [role=tab]")) return;
      if (e.code === "Space" || e.key.toLowerCase() === "r") {
        e.preventDefault();
        setMode("random");
        roll(scene, randomPicks.map((r) => r.slug));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [roll, scene, randomPicks]);

  return (
    <div className="flex w-full flex-col gap-6">
      <WeatherPanel weather={weather} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Lọc theo điều kiện chụp</h2>
        <div role="radiogroup" aria-label="Lọc theo điều kiện chụp" className="flex flex-wrap gap-2">
          <FilterChip active={!scene} onClick={() => selectScene(undefined)}>
            Tất cả <span className="opacity-60">{recipes.length}</span>
          </FilterChip>
          {scenes.map((s) => (
            <FilterChip key={s.slug} active={scene === s.slug} onClick={() => selectScene(s.slug)}>
              {s.name} <span className="opacity-60">{recipesInScene(s.slug).length}</span>
            </FilterChip>
          ))}
        </div>
      </section>

      <Tabs value={mode} onValueChange={(value) => changeMode(value as Mode)} className="gap-4">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="weather" className="px-3">
            <CloudSun /> Gợi ý theo thời tiết
          </TabsTrigger>
          <TabsTrigger value="random" className="px-3">
            <Shuffle /> Ngẫu nhiên
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weather" className="flex flex-col gap-3">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-amber-500" />
            {profile ? (
              <>
                <span>
                  Top {PICK_COUNT} cho{" "}
                  <span className="font-medium text-foreground">{profile.summary}</span>
                </span>{" "}
                <span>
                  · trong {pool.length} recipes{activeScene ? ` của ${activeScene.name}` : ""}
                </span>
              </>
            ) : weather.status === "loading" ? (
              "Đang đọc thời tiết để gợi ý…"
            ) : (
              "Cần thời tiết để gợi ý. Chọn vị trí ở trên, hoặc thử tab Ngẫu nhiên."
            )}
          </p>
          {recommendations.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {recommendations.map((rec, i) => (
                <RecipePickCard
                  key={rec.recipe.slug}
                  recipe={rec.recipe}
                  rank={i + 1}
                  reasons={rec.reasons}
                  selected={selected?.slug === rec.recipe.slug}
                  onSelect={() => selectRecipe(rec.recipe)}
                />
              ))}
            </div>
          ) : (
            weather.status === "loading" && (
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: PICK_COUNT }, (_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="random" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {PICK_COUNT} recipe ngẫu nhiên trong {pool.length} recipes
              {activeScene ? ` của ${activeScene.name}` : ""}
              <span className="hidden sm:inline">
                {" "}
                · nhấn <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">Space</kbd>
              </span>
            </p>
            <Button variant="outline" onClick={() => roll(scene, randomPicks.map((r) => r.slug))}>
              <Shuffle /> Random lại
            </Button>
          </div>
          <div key={rolls} className="grid gap-3 sm:grid-cols-3">
            {randomPicks.map((recipe, i) => (
              <div key={recipe.slug} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
                <RecipePickCard
                  recipe={recipe}
                  rank={i + 1}
                  selected={selected?.slug === recipe.slug}
                  onSelect={() => selectRecipe(recipe)}
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selected && (
        <section ref={detailRef} className="flex scroll-mt-4 flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Chi tiết recipe</h2>
          <RecipeDetail key={selected.slug} recipe={selected} showPageLink />
        </section>
      )}
    </div>
  );
}
