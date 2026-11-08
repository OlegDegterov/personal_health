import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Config } from "./lib/types";

// Same localStorage key as the old single-file version, so the tablet keeps its saved API key.
const KEY = "gdcfg";

export const DEFAULT_CONFIG: Config = {
  apiKey: "",
  interval: 30,
  days: 7,
  goal: 10000,
  demo: false,
  anim: true,
  gender: "male",
  city: "Могилёв",
  lat: 53.9168,
  lon: 30.3449,
  place: "МОГИЛЁВ",
  week: ["rest", "legs", "push", "run", "pull", "core", "full"],
};

export function loadConfig(): Config {
  let c: Config = { ...DEFAULT_CONFIG };
  try {
    const t = localStorage.getItem(KEY);
    if (t) c = { ...c, ...JSON.parse(t) };
  } catch {
    /* storage unavailable */
  }
  if (!c.apiKey) c.demo = true;
  return c;
}

interface Ctx {
  cfg: Config;
  setCfg: (c: Config) => void;
}
const ConfigContext = createContext<Ctx | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [cfg, setState] = useState<Config>(loadConfig);
  const setCfg = useCallback((c: Config) => {
    setState(c);
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch {
      /* ignore */
    }
  }, []);
  return <ConfigContext.Provider value={{ cfg, setCfg }}>{children}</ConfigContext.Provider>;
}

export function useConfig(): Ctx {
  const c = useContext(ConfigContext);
  if (!c) throw new Error("ConfigProvider missing");
  return c;
}
