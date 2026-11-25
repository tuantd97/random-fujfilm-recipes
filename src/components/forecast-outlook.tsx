"use client";

import { ChevronRight, CloudRain, Droplets, Sun, Sunset } from "lucide-react";

import { SkyIcon } from "@/components/weather-panel";
import {
  formatSlotTime,
  isNextDay,
  type ForecastHighlight,
  type ForecastSlot,
} from "@/lib/forecast-slots";
import { filmSimulationOf, type Recipe } from "@/lib/recipes";
import type { Recommendation } from "@/lib/recommend";
import { cn } from "@/lib/utils";

export const slotElementId = (index: number) => `forecast-slot-${index}`;

function slotRange(slot: ForecastSlot, reference: number) {
  const range = `${formatSlotTime(slot.start)}–${formatSlotTime(slot.end)}`;
  return isNextDay(slot.start, reference) ? `${range} · mai` : range;
}

function formatWait(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} phút`;
  return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
}

function temperatureRange(slot: ForecastSlot) {
  const [min, max] = [Math.round(slot.temperatureMin), Math.round(slot.temperatureMax)];
  return min === max ? `${min}°` : `${min}–${max}°`;
}

function RecipeRow({
  recipe,
  rank,
  reason,
  selected,
  onSelect,
}: {
  recipe: Recipe;
  rank: number;
  reason?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-left transition-all outline-none hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50",
        selected && "border-foreground/60 ring-1 ring-foreground/60",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold",
          selected && "bg-primary text-primary-foreground",
        )}
      >
        {rank}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{recipe.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {reason ?? filmSimulationOf(recipe)}
        </span>
      </span>
    </button>
  );
}

/** The "12 giờ tới" tab: every slot of the outlook with its own top picks. */
export function ForecastOutlook({
  slots,
  recommendations,
  selectedSlug,
  flashIndex,
  onSelect,
}: {
  slots: ForecastSlot[];
  recommendations: Recommendation[][];
  selectedSlug?: string;
  /** Slot to briefly highlight after jumping here from an alert. */
  flashIndex?: number;
  onSelect: (recipe: Recipe) => void;
}) {
  const reference = slots[0]?.start ?? 0;

  return (
    <ol className="relative flex flex-col gap-5 border-l pl-5">
      {slots.map((slot, i) => (
        <li
          key={slot.start}
          id={slotElementId(i)}
          className={cn(
            "relative scroll-mt-24 rounded-xl transition-colors duration-700",
            flashIndex === i && "bg-amber-500/10",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full border-2 border-background bg-muted-foreground",
              slot.isNow && "bg-primary",
              slot.phase === "golden" && "bg-amber-500",
            )}
          />
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <SkyIcon
              sky={slot.sky}
              isDay={slot.phase !== "night"}
              className={cn("size-5", slot.phase === "golden" ? "text-amber-500" : "text-muted-foreground")}
            />
            <span className="font-mono text-sm font-medium">{slotRange(slot, reference)}</span>
            {slot.isNow && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                Bây giờ
              </span>
            )}
            <span className="text-sm text-muted-foreground">{slot.profile.summary}</span>
            <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span>{temperatureRange(slot)}</span>
              {slot.rainChance !== null && slot.rainChance >= 20 && (
                <span className="flex items-center gap-1">
                  <Droplets className="size-3.5" />
                  {slot.rainChance}%
                </span>
              )}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {recommendations[i]?.map((rec, rank) => (
              <RecipeRow
                key={rec.recipe.slug}
                recipe={rec.recipe}
                rank={rank + 1}
                reason={rec.reasons[0]}
                selected={selectedSlug === rec.recipe.slug}
                onSelect={() => onSelect(rec.recipe)}
              />
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

const HIGHLIGHT_ICON = { golden: Sunset, rain: CloudRain, clearing: Sun } as const;

function highlightText(h: ForecastHighlight, slot: ForecastSlot, reference: number) {
  const when = `${formatSlotTime(slot.start)}${isNextDay(slot.start, reference) ? " mai" : ""}`;
  switch (h.kind) {
    case "golden":
      return h.inMinutes === 0
        ? `Đang giờ vàng đến ${formatSlotTime(slot.end)}, trời có nắng`
        : `Còn ${formatWait(h.inMinutes)} nữa là giờ vàng (${when}), trời có nắng`;
    case "rain":
      return `Có thể mưa từ ${when}${slot.rainChance ? ` (${slot.rainChance}%)` : ""}`;
    case "clearing":
      return `Tạnh mưa khoảng ${when}`;
  }
}

/** One-line heads-ups under the weather card; each jumps to its slot. */
export function ForecastHighlights({
  highlights,
  slots,
  recommendations,
  onOpen,
}: {
  highlights: ForecastHighlight[];
  slots: ForecastSlot[];
  recommendations: Recommendation[][];
  onOpen: (slotIndex: number) => void;
}) {
  if (highlights.length === 0) return null;
  const reference = slots[0]?.start ?? 0;

  return (
    <ul className="flex flex-col gap-2" aria-label="Báo trước">
      {highlights.map((h) => {
        const slot = slots[h.slotIndex];
        const top = recommendations[h.slotIndex]?.[0]?.recipe;
        const Icon = HIGHLIGHT_ICON[h.kind];
        return (
          <li key={`${h.kind}-${h.slotIndex}`}>
            <button
              type="button"
              onClick={() => onOpen(h.slotIndex)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50",
                h.kind === "golden" && "border-amber-500/40 bg-amber-500/5",
                h.kind === "rain" && "border-sky-500/40 bg-sky-500/5",
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  h.kind === "golden" ? "text-amber-500" : h.kind === "rain" ? "text-sky-500" : "text-muted-foreground",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="font-medium">{highlightText(h, slot, reference)}</span>
                {top && (
                  <span className="text-muted-foreground">
                    {" "}
                    → nên dùng <span className="text-foreground">{top.name}</span>
                  </span>
                )}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
