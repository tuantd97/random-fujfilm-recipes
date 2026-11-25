"use client";

import { useState } from "react";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Moon,
  RotateCw,
  Search,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  Umbrella,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";

import { CitySearch } from "@/components/city-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { useWeather } from "@/hooks/use-weather";
import { cn } from "@/lib/utils";
import {
  formatClock,
  goldenHours,
  skyFromCode,
  weatherLabel,
  type Sky,
  type Weather,
} from "@/lib/weather";

type WeatherHook = ReturnType<typeof useWeather>;

export function SkyIcon({ sky, isDay, className }: { sky: Sky; isDay: boolean; className?: string }) {
  const props = { className, strokeWidth: 1.5 };
  switch (sky) {
    case "clear":
      return isDay ? <Sun {...props} /> : <Moon {...props} />;
    case "partly":
      return isDay ? <CloudSun {...props} /> : <CloudMoon {...props} />;
    case "overcast":
      return <Cloud {...props} />;
    case "fog":
      return <CloudFog {...props} />;
    case "rain":
      return <CloudRain {...props} />;
    case "storm":
      return <CloudLightning {...props} />;
    case "snow":
      return <Snowflake {...props} />;
  }
}

const round = (n: number) => Math.round(n);

const ERROR_TEXT = {
  denied: "Bạn chưa cho phép truy cập vị trí. Hãy tìm thành phố bên dưới, hoặc bật quyền vị trí rồi bấm Làm mới.",
  "location-unavailable": "Không lấy được vị trí của bạn. Hãy tìm thành phố bên dưới.",
  network: "Không tải được dữ liệu thời tiết. Kiểm tra kết nối rồi bấm Làm mới.",
};

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function WeatherDetails({ weather }: { weather: Weather }) {
  const sky = skyFromCode(weather.weatherCode, weather.cloudCover);
  const { today } = weather;
  const golden = goldenHours(weather);

  return (
    <>
      <div className="flex items-center gap-4">
        <SkyIcon
          sky={sky}
          isDay={weather.isDay}
          className="size-12 shrink-0 text-amber-500 sm:size-14"
        />
        <div>
          <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {round(weather.temperature)}°C
          </p>
          <p className="text-sm text-muted-foreground">
            {weatherLabel(weather.weatherCode)} · Cảm giác {round(weather.apparentTemperature)}°
          </p>
        </div>
        <div className="ml-auto text-right text-sm">
          <p className="text-muted-foreground">Hôm nay</p>
          <p className="font-medium">{weatherLabel(today.weatherCode)}</p>
          <p className="text-muted-foreground">
            {round(today.temperatureMin)}° / {round(today.temperatureMax)}°
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat
          icon={Umbrella}
          label="Lượng mưa"
          value={`${today.precipitationSum.toFixed(1)} mm`}
          sub={`Hiện tại ${weather.precipitation.toFixed(1)} mm`}
        />
        <Stat
          icon={CloudRain}
          label="Khả năng mưa"
          value={today.precipitationProbability === null ? "—" : `${today.precipitationProbability}%`}
          sub={`Mây che ${weather.cloudCover}%`}
        />
        <Stat
          icon={Droplets}
          label="Độ ẩm"
          value={`${weather.humidity}%`}
          sub={`UV ${weather.uvIndex.toFixed(0)} (max ${today.uvIndexMax.toFixed(0)})`}
        />
        <Stat icon={Wind} label="Gió" value={`${round(weather.windSpeed)} km/h`} />
        <Stat icon={Sunrise} label="Bình minh" value={formatClock(today.sunrise)} />
        <Stat icon={Sunset} label="Hoàng hôn" value={formatClock(today.sunset)} />
        <Stat
          icon={Sun}
          label="Giờ vàng"
          value={golden.evening}
          sub={`Sáng ${golden.morning}`}
        />
      </div>
    </>
  );
}

export function WeatherPanel({ weather }: { weather: WeatherHook }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = weather.status === "loading";
  const needsManualPlace =
    weather.error === "denied" || weather.error === "location-unavailable";
  const showSearch = searchOpen || (needsManualPlace && !weather.weather);

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            {weather.place ? (
              <p className="truncate font-semibold">
                {weather.place.name}
                {weather.place.country && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {weather.place.country}
                  </span>
                )}
              </p>
            ) : loading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <p className="font-semibold">Chưa có vị trí</p>
            )}
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Đang lấy thời tiết…"
                : weather.updatedAt
                  ? `Cập nhật lúc ${weather.updatedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · Open-Meteo`
                  : "Thời tiết từ Open-Meteo"}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="outline" size="sm" onClick={weather.refresh} disabled={loading}>
              <RotateCw className={cn(loading && "animate-spin")} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            <Button
              variant={showSearch ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSearchOpen((o) => !o)}
              aria-expanded={showSearch}
            >
              {searchOpen ? <X /> : <Search />}
              <span className="hidden sm:inline">Đổi vị trí</span>
            </Button>
          </div>
        </div>

        {showSearch && (
          <CitySearch
            onPick={(place) => {
              setSearchOpen(false);
              weather.choosePlace(place);
            }}
            onLocateMe={() => {
              setSearchOpen(false);
              weather.locateMe();
            }}
          />
        )}

        {weather.status === "error" && weather.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {ERROR_TEXT[weather.error]}
          </p>
        )}

        {weather.weather ? (
          <div className={cn("flex flex-col gap-4 transition-opacity", loading && "opacity-50")}>
            <WeatherDetails weather={weather.weather} />
          </div>
        ) : (
          loading && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
