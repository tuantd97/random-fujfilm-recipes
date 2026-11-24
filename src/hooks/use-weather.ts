"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchWeather,
  formatCoords,
  getBrowserPosition,
  reverseGeocode,
  type Place,
  type PlaceResult,
  type Weather,
} from "@/lib/weather";

const SAVED_PLACE_KEY = "weather-place";

export type WeatherError = "denied" | "location-unavailable" | "network";

export type WeatherState = {
  status: "loading" | "ready" | "error";
  place?: Place;
  weather?: Weather;
  error?: WeatherError;
  updatedAt?: Date;
};

function readSavedPlace(): Place | undefined {
  try {
    const raw = localStorage.getItem(SAVED_PLACE_KEY);
    return raw ? (JSON.parse(raw) as Place) : undefined;
  } catch {
    return undefined;
  }
}

function savePlace(place: Place | undefined) {
  try {
    if (place) localStorage.setItem(SAVED_PLACE_KEY, JSON.stringify(place));
    else localStorage.removeItem(SAVED_PLACE_KEY);
  } catch {
    // Storage can be blocked (private mode); the place just won't be remembered.
  }
}

export function useWeather() {
  const [state, setState] = useState<WeatherState>({ status: "loading" });
  // Only the latest request may write state, so a slow response can't overwrite a newer one.
  const requestId = useRef(0);

  // The fetchers below only touch state after an await; callers set "loading" themselves.
  const fetchForPlace = useCallback(async (place: Place, id: number) => {
    try {
      const weather = await fetchWeather(place.latitude, place.longitude);
      if (id !== requestId.current) return;
      setState({ status: "ready", place, weather, updatedAt: new Date() });
    } catch {
      if (id !== requestId.current) return;
      setState((s) => ({ ...s, place, status: "error", error: "network" }));
    }
  }, []);

  const fetchForCurrentLocation = useCallback(async (id: number) => {
    let position: GeolocationPosition;
    try {
      position = await getBrowserPosition();
    } catch (err) {
      if (id !== requestId.current) return;
      const denied = (err as GeolocationPositionError)?.code === 1;
      setState((s) => ({
        ...s,
        status: "error",
        error: denied ? "denied" : "location-unavailable",
      }));
      return;
    }
    if (id !== requestId.current) return;

    const { latitude, longitude } = position.coords;
    try {
      // The place name is nice to have; weather still shows if the reverse lookup fails.
      const [weather, named] = await Promise.all([
        fetchWeather(latitude, longitude),
        reverseGeocode(latitude, longitude).catch(() => ({
          name: formatCoords(latitude, longitude),
          country: undefined,
        })),
      ]);
      if (id !== requestId.current) return;
      savePlace(undefined);
      setState({
        status: "ready",
        place: { latitude, longitude, ...named, source: "gps" },
        weather,
        updatedAt: new Date(),
      });
    } catch {
      if (id !== requestId.current) return;
      setState((s) => ({ ...s, status: "error", error: "network" }));
    }
  }, []);

  // Fetch once per page load: a city the user picked before wins over asking for location.
  useEffect(() => {
    const id = ++requestId.current;
    const saved = readSavedPlace();
    if (saved) void fetchForPlace(saved, id);
    else void fetchForCurrentLocation(id);
  }, [fetchForPlace, fetchForCurrentLocation]);

  const locateMe = useCallback(() => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, status: "loading", error: undefined }));
    void fetchForCurrentLocation(id);
  }, [fetchForCurrentLocation]);

  const loadPlace = useCallback(
    (place: Place) => {
      const id = ++requestId.current;
      setState((s) => ({ ...s, status: "loading", place, error: undefined }));
      void fetchForPlace(place, id);
    },
    [fetchForPlace],
  );

  const refresh = useCallback(() => {
    if (state.place?.source === "search") loadPlace(state.place);
    else locateMe();
  }, [state.place, loadPlace, locateMe]);

  const choosePlace = useCallback(
    (result: PlaceResult) => {
      const place: Place = {
        latitude: result.latitude,
        longitude: result.longitude,
        name: [result.name, result.region].filter((p, i, a) => p && a.indexOf(p) === i).join(", "),
        country: result.country,
        source: "search",
      };
      savePlace(place);
      loadPlace(place);
    },
    [loadPlace],
  );

  return { ...state, refresh, choosePlace, locateMe };
}
