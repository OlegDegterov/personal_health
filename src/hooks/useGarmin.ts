import { useCallback, useEffect, useRef, useState } from "react";
import { fetchGarmin } from "../api/garmin";
import { demoData } from "../lib/demo";
import type { Config, DashData } from "../lib/types";

const CACHE = "gdcache";

export interface GarminState {
  data: DashData | null;
  raw: Record<string, unknown>;
  lastOk: Date | null;
  error: string | null;
  loading: boolean;
  nextAt: number;
  refresh: () => void;
}

/** Fetches Garmin data now and then every cfg.interval minutes; caches the last result. */
export function useGarmin(cfg: Config): GarminState {
  const [state, setState] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE) || "null");
      if (c) return { data: c.data as DashData, lastOk: new Date(c.at), raw: {}, error: null as string | null };
    } catch {
      /* ignore */
    }
    return { data: null as DashData | null, lastOk: null as Date | null, raw: {}, error: null as string | null };
  });
  const [loading, setLoading] = useState(false);
  const [nextAt, setNextAt] = useState(0);
  const timer = useRef<number>();
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const run = useCallback(async () => {
    const c = cfgRef.current;
    window.clearTimeout(timer.current);
    const ms = Math.max(1, Number(c.interval) || 30) * 60000;
    if (c.demo) {
      setState({ data: demoData(c.days), lastOk: new Date(), raw: {}, error: null });
    } else {
      setLoading(true);
      try {
        const r = await fetchGarmin(c.apiKey, c.days);
        const at = new Date();
        setState({ data: r.data, lastOk: at, raw: r.raw, error: r.error });
        try {
          localStorage.setItem(CACHE, JSON.stringify({ at: at.getTime(), data: r.data }));
        } catch {
          /* ignore */
        }
      } catch (e) {
        setState((s) => ({ ...s, error: (e as Error).message }));
      } finally {
        setLoading(false);
      }
    }
    setNextAt(Date.now() + ms);
    timer.current = window.setTimeout(run, ms);
  }, []);

  // refetch when settings that affect the data change
  useEffect(() => {
    run();
    return () => window.clearTimeout(timer.current);
  }, [run, cfg.apiKey, cfg.days, cfg.demo, cfg.interval]);

  return { ...state, loading, nextAt, refresh: run };
}
