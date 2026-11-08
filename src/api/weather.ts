/* Open-Meteo: free, no key, CORS enabled. */
import type { Weather } from "../lib/types";
import { http } from "./http";

export async function fetchWeather(lat: number, lon: number): Promise<Weather | null> {
  const u =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1";
  const r = await http("GET", u, { Accept: "application/json" }, 20000);
  if (r.status !== 200) return null;
  try {
    const j = JSON.parse(r.text);
    return {
      t: j.current.temperature_2m,
      code: j.current.weather_code,
      day: j.current.is_day === 1,
      min: j.daily.temperature_2m_min[0],
      max: j.daily.temperature_2m_max[0],
    };
  } catch {
    return null;
  }
}

export async function geocode(name: string): Promise<{ lat: number; lon: number; place: string } | null> {
  const u = `https://geocoding-api.open-meteo.com/v1/search?count=1&language=ru&name=${encodeURIComponent(name)}`;
  const r = await http("GET", u, { Accept: "application/json" }, 20000);
  try {
    const g = JSON.parse(r.text).results[0];
    return { lat: g.latitude, lon: g.longitude, place: g.name };
  } catch {
    return null;
  }
}

export const WX_TXT: Record<number, string> = {
  0: "ЯСНО",
  1: "ПРЕИМ. ЯСНО",
  2: "ПЕРЕМ. ОБЛАЧН.",
  3: "ПАСМУРНО",
  45: "ТУМАН",
  48: "ИЗМОРОЗЬ",
  51: "МОРОСЬ",
  53: "МОРОСЬ",
  55: "МОРОСЬ",
  56: "ЛЕДЯН. МОРОСЬ",
  57: "ЛЕДЯН. МОРОСЬ",
  61: "НЕБОЛЬШОЙ ДОЖДЬ",
  63: "ДОЖДЬ",
  65: "ЛИВЕНЬ",
  66: "ЛЕДЯН. ДОЖДЬ",
  67: "ЛЕДЯН. ДОЖДЬ",
  71: "НЕБОЛЬШОЙ СНЕГ",
  73: "СНЕГ",
  75: "СНЕГОПАД",
  77: "СНЕЖН. ЗЁРНА",
  80: "ЛИВЕНЬ",
  81: "ЛИВЕНЬ",
  82: "СИЛЬН. ЛИВЕНЬ",
  85: "СНЕГОПАД",
  86: "СНЕГОПАД",
  95: "ГРОЗА",
  96: "ГРОЗА С ГРАДОМ",
  99: "ГРОЗА С ГРАДОМ",
};

export type WxKind = "sun" | "moon" | "cloud" | "part" | "fog" | "rain" | "snow" | "storm";
export function wxKind(code: number, day: boolean): WxKind {
  if (code === 0) return day ? "sun" : "moon";
  if (code <= 2) return day ? "part" : "moon";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  if (code >= 51) return "rain";
  return "cloud";
}
