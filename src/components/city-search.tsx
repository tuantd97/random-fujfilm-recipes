"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, LocateFixed, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPlaces, type PlaceResult } from "@/lib/weather";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; results: PlaceResult[] }
  | { status: "error" };

export function CitySearch({
  onPick,
  onLocateMe,
}: {
  onPick: (place: PlaceResult) => void;
  onLocateMe: () => void;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const trimmed = query.trim();

  // Debounced lookup against Open-Meteo's geocoding search.
  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearch({ status: "loading" });
      searchPlaces(trimmed, controller.signal)
        .then((results) => setSearch({ status: "done", results }))
        .catch((err: unknown) => {
          if ((err as Error).name !== "AbortError") setSearch({ status: "error" });
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const visible = trimmed.length >= 2 ? search : { status: "idle" as const };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm thành phố, vd. Đà Lạt"
            aria-label="Tìm thành phố"
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={onLocateMe}>
          <LocateFixed />
          <span className="hidden sm:inline">Vị trí của tôi</span>
        </Button>
      </div>

      {visible.status === "loading" && (
        <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" /> Đang tìm…
        </p>
      )}
      {visible.status === "error" && (
        <p className="px-1 text-sm text-destructive">Không tìm được, thử lại sau nhé.</p>
      )}
      {visible.status === "done" &&
        (visible.results.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">Không thấy thành phố nào khớp.</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border">
            {visible.results.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => onPick(place)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium">{place.name}</span>
                  <span className="truncate text-muted-foreground">
                    {[place.region, place.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
