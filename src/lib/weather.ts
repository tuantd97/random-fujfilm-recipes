// Weather data from Open-Meteo (https://open-meteo.com), place names from
// BigDataCloud's free client-side reverse geocoder and Open-Meteo's geocoding
// search. All three are keyless and CORS-enabled, so they run in the browser.

export type Place = {
  latitude: number;
  longitude: number;
  /** Display name, e.g. "Hoàn Kiếm, Hà Nội". */
  name: string;
  country?: string;
  /** "gps" = from the browser's location, "search" = picked by the user. */
  source: "gps" | "search";
};

export type HourlyPoint = {
  /** Local wall-clock hour, e.g. "2026-11-25T17:00". */
  time: string;
  temperature: number;
  weatherCode: number;
  cloudCover: number;
  precipitation: number;
  precipitationProbability: number | null;
  uvIndex: number;
  isDay: boolean;
};

export type SunTimes = { sunrise: string; sunset: string };

export type Weather = {
  /** Local time at the place, as returned by Open-Meteo (no offset). */
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  windSpeed: number;
  isDay: boolean;
  uvIndex: number;
  today: {
    weatherCode: number;
    temperatureMax: number;
    temperatureMin: number;
    precipitationSum: number;
    precipitationProbability: number | null;
    sunrise: string;
    sunset: string;
    uvIndexMax: number;
  };
  /** Today and tomorrow, so the 12-hour outlook can cross midnight. */
  days: SunTimes[];
  hourly: HourlyPoint[];
};

const CURRENT_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "wind_speed_10m",
  "is_day",
  "uv_index",
];

const HOURLY_FIELDS = [
  "temperature_2m",
  "weather_code",
  "cloud_cover",
  "precipitation",
  "precipitation_probability",
  "uv_index",
  "is_day",
];

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "sunrise",
  "sunset",
  "uv_index_max",
];

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: CURRENT_FIELDS.join(","),
    hourly: HOURLY_FIELDS.join(","),
    daily: DAILY_FIELDS.join(","),
    timezone: "auto",
    forecast_days: "2",
  });
  type Response = {
    current: Record<string, number> & { time: string };
    hourly: Record<string, (number | string | null)[]>;
    daily: Record<string, (number | string | null)[]>;
  };
  const { current: c, hourly: h, daily: d } = await getJson<Response>(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    signal,
  );
  const day = (key: string) => d[key]?.[0];
  return {
    time: c.time,
    temperature: c.temperature_2m,
    apparentTemperature: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    precipitation: c.precipitation,
    weatherCode: c.weather_code,
    cloudCover: c.cloud_cover,
    windSpeed: c.wind_speed_10m,
    isDay: c.is_day === 1,
    uvIndex: c.uv_index,
    today: {
      weatherCode: day("weather_code") as number,
      temperatureMax: day("temperature_2m_max") as number,
      temperatureMin: day("temperature_2m_min") as number,
      precipitationSum: day("precipitation_sum") as number,
      precipitationProbability: (day("precipitation_probability_max") as number | null) ?? null,
      sunrise: day("sunrise") as string,
      sunset: day("sunset") as string,
      uvIndexMax: day("uv_index_max") as number,
    },
    days: (d.sunrise ?? []).map((sunrise, i) => ({
      sunrise: sunrise as string,
      sunset: d.sunset[i] as string,
    })),
    hourly: (h.time ?? []).map((time, i) => ({
      time: time as string,
      temperature: h.temperature_2m[i] as number,
      weatherCode: h.weather_code[i] as number,
      cloudCover: h.cloud_cover[i] as number,
      precipitation: h.precipitation[i] as number,
      precipitationProbability: (h.precipitation_probability[i] as number | null) ?? null,
      uvIndex: (h.uv_index[i] as number | null) ?? 0,
      isDay: h.is_day[i] === 1,
    })),
  };
}

/** Open-Meteo only knows coordinates, so the place name comes from a reverse geocoder. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<Pick<Place, "name" | "country">> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: "vi",
  });
  const data = await getJson<{
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
  }>(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`, signal);

  const parts = [data.locality, data.city || data.principalSubdivision].filter(
    (p, i, all): p is string => !!p && all.indexOf(p) === i,
  );
  return {
    name: parts.join(", ") || formatCoords(latitude, longitude),
    country: data.countryName,
  };
}

export type PlaceResult = Omit<Place, "source"> & { id: number; region?: string };

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const params = new URLSearchParams({ name: query, count: "6", language: "vi", format: "json" });
  const data = await getJson<{
    results?: {
      id: number;
      name: string;
      admin1?: string;
      country?: string;
      latitude: number;
      longitude: number;
    }[];
  }>(`https://geocoding-api.open-meteo.com/v1/search?${params}`, signal);
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    region: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 10 * 60_000,
    });
  });
}

export function formatCoords(latitude: number, longitude: number) {
  return `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
}

// WMO weather interpretation codes, see https://open-meteo.com/en/docs
const WEATHER_LABELS: Record<number, string> = {
  0: "Trời quang",
  1: "Gần như quang",
  2: "Có mây rải rác",
  3: "Nhiều mây, u ám",
  45: "Sương mù",
  48: "Sương mù đóng băng",
  51: "Mưa phùn nhẹ",
  53: "Mưa phùn",
  55: "Mưa phùn dày",
  56: "Mưa phùn băng giá",
  57: "Mưa phùn băng giá dày",
  61: "Mưa nhỏ",
  63: "Mưa vừa",
  65: "Mưa to",
  66: "Mưa băng giá",
  67: "Mưa băng giá to",
  71: "Tuyết nhẹ",
  73: "Tuyết vừa",
  75: "Tuyết dày",
  77: "Mưa tuyết hạt",
  80: "Mưa rào nhẹ",
  81: "Mưa rào",
  82: "Mưa rào rất to",
  85: "Tuyết rào nhẹ",
  86: "Tuyết rào dày",
  95: "Dông",
  96: "Dông kèm mưa đá",
  99: "Dông kèm mưa đá lớn",
};

export function weatherLabel(code: number) {
  return WEATHER_LABELS[code] ?? "Không rõ";
}

export type Sky = "clear" | "partly" | "overcast" | "fog" | "rain" | "storm" | "snow";

export function skyFromCode(code: number, cloudCover?: number): Sky {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code === 3 || (cloudCover !== undefined && cloudCover >= 75)) return "overcast";
  if (code === 2 || (cloudCover !== undefined && cloudCover >= 35)) return "partly";
  return "clear";
}

/** Open-Meteo returns local wall-clock times without an offset; compare them as-is. */
function minutesOfDay(isoLocal: string) {
  const [, time = "00:00"] = isoLocal.split("T");
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatClock(isoLocal: string) {
  return isoLocal.split("T")[1]?.slice(0, 5) ?? "";
}

function clockFromMinutes(total: number) {
  const m = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export type LightPhase = "night" | "golden" | "day";

export const GOLDEN_HOUR_MINUTES = 60;

/** Night, golden hour (the hour after sunrise / before sunset) or regular daylight. */
export function lightPhase(weather: Weather): LightPhase {
  const now = minutesOfDay(weather.time);
  const sunrise = minutesOfDay(weather.today.sunrise);
  const sunset = minutesOfDay(weather.today.sunset);
  if (!weather.isDay || now < sunrise || now >= sunset) return "night";
  if (now - sunrise < GOLDEN_HOUR_MINUTES || sunset - now <= GOLDEN_HOUR_MINUTES) {
    return "golden";
  }
  return "day";
}

export function goldenHours(weather: Weather) {
  const sunrise = minutesOfDay(weather.today.sunrise);
  const sunset = minutesOfDay(weather.today.sunset);
  return {
    morning: `${clockFromMinutes(sunrise)}–${clockFromMinutes(sunrise + GOLDEN_HOUR_MINUTES)}`,
    evening: `${clockFromMinutes(sunset - GOLDEN_HOUR_MINUTES)}–${clockFromMinutes(sunset)}`,
  };
}
