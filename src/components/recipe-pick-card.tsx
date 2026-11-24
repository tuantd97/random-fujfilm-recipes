import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/recipes";

/** Compact, selectable summary of a recipe used in the top-3 lists. */
export function RecipePickCard({
  recipe,
  rank,
  reasons,
  selected,
  onSelect,
}: {
  recipe: Recipe;
  rank: number;
  /** Why it was suggested; falls back to the recipe's own tags. */
  reasons?: string[];
  selected: boolean;
  onSelect: () => void;
}) {
  const filmSimulation = recipe.settings.find((s) => s.name === "Film Simulation")?.value;
  const chips = reasons && reasons.length > 0 ? reasons : recipe.scenes;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group flex h-full w-full flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-all outline-none hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50",
        selected && "border-foreground/60 ring-1 ring-foreground/60",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold",
            selected && "bg-primary text-primary-foreground",
          )}
        >
          {rank}
        </span>
        {filmSimulation && (
          <span className="truncate font-mono text-xs text-muted-foreground">{filmSimulation}</span>
        )}
      </div>
      <div>
        <p className="leading-snug font-semibold">{recipe.name}</p>
        {recipe.emulates && recipe.emulates !== recipe.name && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            Emulates {recipe.emulates}
          </p>
        )}
      </div>
      <ul className="mt-auto flex flex-wrap gap-1 pt-1">
        {chips.map((chip) => (
          <li
            key={chip}
            className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
          >
            {chip}
          </li>
        ))}
      </ul>
    </button>
  );
}
