import { useEffect, useRef, useState } from "react";
import { fetchWeather } from "../api/weather";
import type { Weather } from "../lib/types";

/** Current time, updated every second. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** Weather for the given point, refreshed every 30 minutes. */
export function useWeather(lat: number, lon: number): Weather | null {
  const [wx, setWx] = useState<Weather | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => fetchWeather(lat, lon).then((w) => alive && w && setWx(w));
    load();
    const id = window.setInterval(load, 30 * 60000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [lat, lon]);
  return wx;
}

/** Size of an element, tracked with ResizeObserver. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}
