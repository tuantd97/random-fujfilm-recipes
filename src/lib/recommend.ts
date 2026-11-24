import type { Recipe } from "@/lib/recipes";
import { lightPhase, skyFromCode, type LightPhase, type Sky, type Weather } from "@/lib/weather";

/**
 * A signal matches a recipe by scene category ("cat:night"), free-form tag
 * ("tag:low light") or slug ("slug:eterna-overcast-rain") and adds `weight`
 * to its score. Positive signals double as the "why" shown to the user.
 */
type Signal = { match: string; weight: number; reason: string };

export type WeatherProfile = {
  phase: LightPhase;
  sky: Sky;
  harshSun: boolean;
  /** Short description of the conditions, e.g. "Ban đêm · Mưa". */
  summary: string;
  signals: Signal[];
};

export type Recommendation = {
  recipe: Recipe;
  score: number;
  reasons: string[];
};

const PHASE_LABEL: Record<LightPhase, string> = {
  night: "Ban đêm",
  golden: "Giờ vàng",
  day: "Ban ngày",
};

const SKY_LABEL: Record<Sky, string> = {
  clear: "Trời nắng",
  partly: "Mây rải rác",
  overcast: "Trời âm u",
  fog: "Sương mù",
  rain: "Trời mưa",
  storm: "Có dông",
  snow: "Có tuyết",
};

function skySignals(sky: Sky, phase: LightPhase, harshSun: boolean): Signal[] {
  switch (sky) {
    case "clear":
      if (phase === "night") return [];
      return [
        { match: "tag:daylight", weight: 3, reason: "Hợp trời nắng" },
        { match: "tag:vivid color", weight: 3, reason: "Màu rực dưới nắng" },
        { match: "tag:midday sun", weight: harshSun ? 5 : 3, reason: "Chịu được nắng gắt" },
        { match: "cat:travel", weight: 2, reason: "Hợp đi chơi ngày nắng" },
        ...(harshSun
          ? [{ match: "cat:black-and-white", weight: 1, reason: "Đen trắng hợp nắng gắt" }]
          : []),
        { match: "cat:overcast", weight: -2, reason: "" },
      ];
    case "partly":
      if (phase === "night") return [];
      return [
        { match: "tag:daylight", weight: 3, reason: "Hợp ánh sáng ban ngày" },
        { match: "cat:street-photography", weight: 2, reason: "Hợp chụp phố" },
        { match: "tag:everyday", weight: 2, reason: "Recipe dùng hằng ngày" },
        { match: "cat:travel", weight: 2, reason: "Hợp đi chơi" },
        { match: "cat:portraits", weight: 1, reason: "Mây làm ánh sáng dịu cho chân dung" },
      ];
    case "overcast":
      return [
        { match: "cat:overcast", weight: 5, reason: "Làm cho trời âm u" },
        { match: "cat:black-and-white", weight: 2, reason: "Đen trắng hợp ánh sáng phẳng" },
        { match: "tag:moody", weight: 2, reason: "Hợp không khí trầm" },
        { match: "cat:cinematic", weight: 1, reason: "Tông điện ảnh" },
        { match: "cat:portraits", weight: phase === "night" ? 0 : 1, reason: "Ánh sáng mềm cho chân dung" },
        { match: "tag:midday sun", weight: -3, reason: "" },
        { match: "tag:vivid color", weight: -2, reason: "" },
      ];
    case "fog":
      return [
        { match: "cat:cinematic", weight: 3, reason: "Sương mù lên phim đẹp" },
        { match: "tag:moody", weight: 3, reason: "Hợp không khí trầm" },
        { match: "cat:overcast", weight: 3, reason: "Làm cho ánh sáng khuếch tán" },
        { match: "cat:black-and-white", weight: 2, reason: "Đen trắng hợp sương mù" },
        { match: "tag:vivid color", weight: -2, reason: "" },
      ];
    case "rain":
    case "storm":
      return [
        { match: "slug:eterna-overcast-rain", weight: 4, reason: "Làm riêng cho ngày mưa" },
        { match: "cat:overcast", weight: 4, reason: "Hợp trời mưa, u ám" },
        { match: "cat:cinematic", weight: 2, reason: "Phố mưa lên tông điện ảnh" },
        { match: "tag:moody", weight: sky === "storm" ? 4 : 2, reason: "Hợp không khí trầm" },
        { match: "cat:black-and-white", weight: 1, reason: "Đen trắng hợp trời mưa" },
        { match: "cat:street-photography", weight: 1, reason: "Hợp chụp phố" },
        { match: "tag:midday sun", weight: -3, reason: "" },
        { match: "tag:vivid color", weight: -2, reason: "" },
        { match: "tag:daylight", weight: -1, reason: "" },
      ];
    case "snow":
      return [
        { match: "cat:black-and-white", weight: 3, reason: "Đen trắng hợp tuyết" },
        { match: "cat:overcast", weight: 2, reason: "Hợp ánh sáng tuyết phẳng" },
        { match: "cat:cinematic", weight: 1, reason: "Tông điện ảnh" },
        { match: "tag:vivid color", weight: -1, reason: "" },
      ];
  }
}

function phaseSignals(phase: LightPhase, sky: Sky): Signal[] {
  const sunVisible = sky === "clear" || sky === "partly";
  switch (phase) {
    case "night":
      return [
        { match: "cat:night", weight: 5, reason: "Làm cho chụp đêm" },
        { match: "tag:low light", weight: 3, reason: "Hợp ánh sáng yếu" },
        { match: "tag:neon & city lights", weight: 2, reason: "Hợp đèn phố, neon" },
        { match: "tag:indoor portraits", weight: 1, reason: "Hợp chân dung trong nhà" },
        { match: "tag:daylight", weight: -4, reason: "" },
        { match: "tag:midday sun", weight: -4, reason: "" },
        { match: "tag:vivid color", weight: -2, reason: "" },
        { match: "cat:golden-hour", weight: -2, reason: "" },
      ];
    case "golden":
      return [
        { match: "cat:golden-hour", weight: sunVisible ? 5 : 2, reason: "Đang giờ vàng" },
        { match: "tag:warm tones", weight: sunVisible ? 2 : 1, reason: "Tông ấm hợp giờ vàng" },
        { match: "cat:night", weight: -2, reason: "" },
      ];
    case "day":
      return [
        { match: "cat:night", weight: -4, reason: "" },
        { match: "tag:low light", weight: -2, reason: "" },
      ];
  }
}

export function weatherProfile(weather: Weather): WeatherProfile {
  const phase = lightPhase(weather);
  const sky = skyFromCode(weather.weatherCode, weather.cloudCover);
  const harshSun = phase === "day" && sky === "clear" && weather.uvIndex >= 6;
  const skyLabel =
    harshSun ? "Nắng gắt" : sky === "clear" && phase === "night" ? "Trời quang" : SKY_LABEL[sky];
  const parts = [PHASE_LABEL[phase], skyLabel];
  return {
    phase,
    sky,
    harshSun,
    summary: parts.join(" · "),
    signals: [...phaseSignals(phase, sky), ...skySignals(sky, phase, harshSun)],
  };
}

function recipeKeys(recipe: Recipe) {
  return new Set([
    `slug:${recipe.slug}`,
    ...recipe.categories.map((c) => `cat:${c}`),
    ...recipe.scenes.map((t) => `tag:${t.toLowerCase()}`),
  ]);
}

/** Stable per day, so ties don't reshuffle on every refresh but do vary day to day. */
function tieBreaker(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function recommend(pool: Recipe[], profile: WeatherProfile, day: string, limit = 3) {
  return pool
    .map((recipe): Recommendation => {
      const keys = recipeKeys(recipe);
      const hits = profile.signals.filter((s) => keys.has(s.match));
      const score = hits.reduce((sum, s) => sum + s.weight, 0);
      const reasons = hits
        .filter((s) => s.weight > 0 && s.reason)
        .sort((a, b) => b.weight - a.weight)
        .map((s) => s.reason)
        .filter((r, i, all) => all.indexOf(r) === i)
        .slice(0, 2);
      return { recipe, score, reasons };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        tieBreaker(`${day}:${a.recipe.slug}`) - tieBreaker(`${day}:${b.recipe.slug}`),
    )
    .slice(0, limit);
}
