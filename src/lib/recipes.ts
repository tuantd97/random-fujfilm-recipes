import data from "@/data/recipes.json";
import sceneData from "@/data/scenes.json";
import tipsData from "@/data/tips.json";

export type RecipeSetting = {
  name: string;
  value: string;
};

export type Recipe = {
  slug: string;
  name: string;
  emulates: string;
  description: string;
  scenes: string[];
  /** Slugs of the fujirecipes.io scene categories this recipe belongs to. */
  categories: string[];
  settings: RecipeSetting[];
  cameras: string[];
  sourceUrl: string;
};

export type Scene = {
  slug: string;
  name: string;
};

/** Hand-written shooting tips (our own words, not copied from the source). */
export type RecipeTips = {
  bestFor: string;
  tips: string[];
  avoid?: string;
};

export const recipes: Recipe[] = data;
export const scenes: Scene[] = sceneData;

const tips: Record<string, RecipeTips> = tipsData;

export function getTips(slug: string): RecipeTips | undefined {
  return tips[slug];
}

export function findScene(slug: string | null | undefined) {
  return slug ? scenes.find((s) => s.slug === slug) : undefined;
}

/** Recipes in a scene category, or every recipe when no scene is given. */
export function recipesInScene(sceneSlug?: string) {
  return sceneSlug ? recipes.filter((r) => r.categories.includes(sceneSlug)) : recipes;
}

const SETTING_GROUPS: { label: string; names: string[] }[] = [
  { label: "Base", names: ["Film Simulation", "Dynamic Range"] },
  { label: "Tone", names: ["Highlight", "Shadow"] },
  { label: "Color", names: ["Color", "Color Chrome FX", "Color Chrome FX Blue"] },
  { label: "White Balance", names: ["White Balance", "WB Shift"] },
  { label: "Detail", names: ["Sharpness", "Noise Reduction", "Clarity", "Grain Effect"] },
  { label: "Exposure", names: ["ISO", "Exposure Comp."] },
];

export function groupSettings(settings: RecipeSetting[]) {
  const groups = SETTING_GROUPS.map((group) => ({
    label: group.label,
    settings: settings.filter((s) => group.names.includes(s.name)),
  }));
  const known = new Set(SETTING_GROUPS.flatMap((g) => g.names));
  const other = settings.filter((s) => !known.has(s.name));
  if (other.length > 0) groups.push({ label: "Other", settings: other });
  return groups.filter((g) => g.settings.length > 0);
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Picks `count` distinct random recipes, preferring ones not in `avoid`
 * (the previous draw) so a re-roll actually shows something new.
 */
export function pickRandomSet(from: Recipe[], count: number, avoid: string[] = []): Recipe[] {
  const fresh = shuffled(from.filter((r) => !avoid.includes(r.slug)));
  const seen = shuffled(from.filter((r) => avoid.includes(r.slug)));
  return [...fresh, ...seen].slice(0, count);
}

export function settingsToText(recipe: Recipe) {
  return [
    `${recipe.name} — Fujifilm recipe`,
    ...recipe.settings.map((s) => `${s.name}: ${s.value}`),
    `Source: ${recipe.sourceUrl}`,
  ].join("\n");
}
