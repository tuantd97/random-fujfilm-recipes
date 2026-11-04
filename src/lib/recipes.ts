import data from "@/data/recipes.json";

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
  settings: RecipeSetting[];
  cameras: string[];
  sourceUrl: string;
};

export const recipes: Recipe[] = data;

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

export function pickRandom(excludeSlug?: string): Recipe {
  const pool =
    recipes.length > 1 ? recipes.filter((r) => r.slug !== excludeSlug) : recipes;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function settingsToText(recipe: Recipe) {
  return [
    `${recipe.name} — Fujifilm recipe`,
    ...recipe.settings.map((s) => `${s.name}: ${s.value}`),
    `Source: ${recipe.sourceUrl}`,
  ].join("\n");
}
