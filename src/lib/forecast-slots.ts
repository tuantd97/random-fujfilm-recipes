// Turns Open-Meteo's hourly forecast into "time slots" for the next hours:
// runs of time with the same light (night / golden hour / day) and sky, each
// with its own recipe profile, plus a few moments worth flagging ahead.

import { isHarshSun, profileFor, type WeatherProfile } from "@/lib/recommend";
import {
  GOLDEN_HOUR_MINUTES,
  skyFromCode,
  type HourlyPoint,
  type LightPhase,
  type Sky,
  type Weather,
} from "@/lib/weather";

export const OUTLOOK_HOURS = 12;
/** A forecast chance of rain at or above this counts as rain for planning. */
const RAIN_PROBABILITY_THRESHOLD = 50;
/** Slots shorter than this are folded into the previous one (golden hour excepted). */
const MIN_SLOT_MINUTES = 30;

export type ForecastSlot = {
  /** Absolute minutes on the place's local clock (see toMinutes). */
  start: number;
  end: number;
  phase: LightPhase;
  sky: Sky;
  harshSun: boolean;
  /** Highest chance of rain in the slot, if the model gives one. */
  rainChance: number | null;
  temperatureMin: number;
  temperatureMax: number;
  isNow: boolean;
  profile: WeatherProfile;
};

export type ForecastHighlight = {
  kind: "golden" | "rain" | "clearing";
  slotIndex: number;
  /** Minutes from now until the slot starts (0 when it is already happening). */
  inMinutes: number;
};

// Open-Meteo returns local wall-clock times without an offset. Reading them as
// UTC gives a consistent minute scale that also works across midnight.
function toMinutes(isoLocal: string) {
  const [date, time = "00:00"] = isoLocal.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) / 60_000;
}

export function formatSlotTime(minutes: number) {
  return new Date(minutes * 60_000).toISOString().slice(11, 16);
}

/** True when `minutes` falls on a later calendar day than `reference`. */
export function isNextDay(minutes: number, reference: number) {
  return Math.floor(minutes / 1440) > Math.floor(reference / 1440);
}

function skyForHour(point: HourlyPoint): Sky {
  const sky = skyFromCode(point.weatherCode, point.cloudCover);
  const wet = sky === "rain" || sky === "storm" || sky === "snow";
  if (!wet && (point.precipitationProbability ?? 0) >= RAIN_PROBABILITY_THRESHOLD) return "rain";
  return sky;
}

type Piece = Omit<ForecastSlot, "profile" | "isNow">;

const sameLight = (a: Piece, b: Piece) =>
  a.phase === b.phase && a.sky === b.sky && a.harshSun === b.harshSun;

function mergeInto(target: Piece, piece: Piece) {
  target.end = piece.end;
  target.temperatureMin = Math.min(target.temperatureMin, piece.temperatureMin);
  target.temperatureMax = Math.max(target.temperatureMax, piece.temperatureMax);
  if (piece.rainChance !== null) {
    target.rainChance = Math.max(target.rainChance ?? 0, piece.rainChance);
  }
}

export function forecastSlots(weather: Weather, hours = OUTLOOK_HOURS): ForecastSlot[] {
  const now = toMinutes(weather.time);
  const horizon = now + hours * 60;
  const sun = weather.days.map((d) => ({ rise: toMinutes(d.sunrise), set: toMinutes(d.sunset) }));
  const hourly = weather.hourly.map((p) => ({ ...p, at: toMinutes(p.time) }));

  const hourAt = (t: number) => hourly.find((p) => t >= p.at && t < p.at + 60);
  const phaseAt = (t: number): LightPhase => {
    const day = sun.find((s) => t >= s.rise && t < s.set);
    if (!day) return sun.length > 0 ? "night" : hourAt(t)?.isDay ? "day" : "night";
    if (t - day.rise < GOLDEN_HOUR_MINUTES || day.set - t <= GOLDEN_HOUR_MINUTES) return "golden";
    return "day";
  };

  // Cut the window at every hour and at every sunrise/sunset/golden-hour edge.
  const cuts = new Set<number>([now, horizon]);
  for (const p of hourly) if (p.at > now && p.at < horizon) cuts.add(p.at);
  for (const s of sun) {
    for (const t of [s.rise, s.rise + GOLDEN_HOUR_MINUTES, s.set - GOLDEN_HOUR_MINUTES, s.set]) {
      if (t > now && t < horizon) cuts.add(t);
    }
  }
  const edges = [...cuts].sort((a, b) => a - b);

  const pieces: Piece[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const [start, end] = [edges[i], edges[i + 1]];
    const phase = phaseAt((start + end) / 2);
    const point = hourAt(start);
    // The current piece uses live conditions; later ones use the hourly forecast.
    const sky =
      i === 0
        ? skyFromCode(weather.weatherCode, weather.cloudCover)
        : point
          ? skyForHour(point)
          : skyFromCode(weather.weatherCode, weather.cloudCover);
    const uv = i === 0 ? weather.uvIndex : (point?.uvIndex ?? 0);
    const temperature = i === 0 ? weather.temperature : (point?.temperature ?? weather.temperature);
    pieces.push({
      start,
      end,
      phase,
      sky,
      harshSun: isHarshSun(phase, sky, uv),
      rainChance: point?.precipitationProbability ?? null,
      temperatureMin: temperature,
      temperatureMax: temperature,
    });
  }

  // Join neighbours with the same light, then fold tiny leftovers into the previous slot.
  const merged: Piece[] = [];
  for (const piece of pieces) {
    const last = merged.at(-1);
    if (last && sameLight(last, piece)) mergeInto(last, piece);
    else merged.push({ ...piece });
  }
  const slots: Piece[] = [];
  for (const piece of merged) {
    const last = slots.at(-1);
    const short = piece.end - piece.start < MIN_SLOT_MINUTES && piece.phase !== "golden";
    if (last && (short || sameLight(last, piece))) mergeInto(last, piece);
    else slots.push(piece);
  }

  return slots.map((slot, i) => ({ ...slot, isNow: i === 0, profile: profileFor(slot) }));
}

const isWet = (sky: Sky) => sky === "rain" || sky === "storm";

/** Up to two things worth knowing ahead: golden hour with sun, rain coming, rain stopping. */
export function forecastHighlights(slots: ForecastSlot[]): ForecastHighlight[] {
  if (slots.length === 0) return [];
  const now = slots[0];
  const result: ForecastHighlight[] = [];
  const at = (i: number) => ({ slotIndex: i, inMinutes: Math.max(0, slots[i].start - now.start) });

  const golden = slots.findIndex(
    (s) => s.phase === "golden" && (s.sky === "clear" || s.sky === "partly"),
  );
  if (golden !== -1) result.push({ kind: "golden", ...at(golden) });

  if (isWet(now.sky)) {
    const dry = slots.findIndex((s) => !isWet(s.sky));
    if (dry !== -1) result.push({ kind: "clearing", ...at(dry) });
  } else {
    const wet = slots.findIndex((s) => isWet(s.sky));
    if (wet !== -1) result.push({ kind: "rain", ...at(wet) });
  }

  return result.slice(0, 2);
}
