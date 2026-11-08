/* Garmin Connect Personal API: personal key -> 24h bearer token -> JSON endpoints. */
import { buildData, type RawResponses } from "../lib/parse";
import { iso } from "../lib/format";
import type { DashData } from "../lib/types";
import { http } from "./http";

const BASE = "https://personal.connectapi.garmin.com";
const TOKEN_PATH = "/personalapitoken-service/personal-api/personal-api-key/token";

let token: string | null = null;
let tokenExp = 0;
let tokenKey = "";

function b64decode(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

async function getToken(apiKey: string): Promise<string> {
  const now = Date.now() / 1000;
  if (token && tokenKey === apiKey && tokenExp - now > 3600) return token;
  if (!apiKey) throw new Error("НЕ УКАЗАН API KEY — ОТКРОЙТЕ НАСТРОЙКИ");
  const r = await http("POST", BASE + TOKEN_PATH, { Accept: "*/*", Authorization: `ApiKey ${apiKey}` });
  if (r.status !== 200) throw new Error(`ТОКЕН: ${r.status ? `HTTP ${r.status} ` : ""}${r.text.substr(0, 160)}`);
  token = r.text.trim();
  tokenKey = apiKey;
  try {
    tokenExp = JSON.parse(b64decode(token.split(".")[1])).exp || now + 23 * 3600;
  } catch {
    tokenExp = now + 23 * 3600;
  }
  return token;
}

async function apiGet(tok: string, path: string): Promise<unknown> {
  const r = await http("GET", BASE + path, { Accept: "application/json", Authorization: `Bearer ${tok}` });
  if (r.status === 401) token = null;
  if (r.status !== 200)
    throw new Error(`${r.status ? `HTTP ${r.status}` : ""} ${path.split("?")[0]} ${r.text.substr(0, 200)}`);
  try {
    return JSON.parse(r.text);
  } catch {
    throw new Error(`НЕ JSON: ${path.split("?")[0]}`);
  }
}

export interface FetchResult {
  data: DashData;
  raw: Record<string, unknown>;
  error: string | null;
}

export async function fetchGarmin(apiKey: string, days: number): Promise<FetchResult> {
  const tok = await getToken(apiKey);
  const end = new Date(),
    start = new Date(end.getTime() - (days - 1) * 86400000);
  const q = `startDate=${iso(start)}&endDate=${iso(end)}`;
  const calls: [keyof RawResponses, string, string][] = [
    ["sum", "dailysummaries", `/usersummary-service/v2/dailysummaries?${q}`],
    ["sleep", "sleep", `/sleep-service/sleep/dailySleepSummariesByDate?${q}`],
    ["acts", "activities", "/activitylist-service/activities/search/activities?start=0&limit=20"],
    // calendar-service returns 404 in the Personal API: upcoming workouts come from the weekly plan
  ];
  const res: RawResponses = {},
    raw: Record<string, unknown> = {},
    errs: string[] = [];
  await Promise.all(
    calls.map(async ([k, name, path]) => {
      try {
        const r = await apiGet(tok, path);
        res[k] = r;
        raw[name] = r;
      } catch (e) {
        const msg = (e as Error).message;
        errs.push(msg);
        raw[name] = `ОШИБКА: ${msg}`;
      }
    }),
  );
  if (!res.sum && !res.sleep && !res.acts) throw new Error(errs.join("; "));
  return { data: buildData(res, start, days), raw, error: errs.length ? errs.join("; ") : null };
}
