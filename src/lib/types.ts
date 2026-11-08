export type MuscleKey =
  | "shoulders"
  | "chest"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "back"
  | "traps"
  | "lowerback";

export interface Config {
  apiKey: string;
  interval: number; // minutes
  days: number; // days on charts
  goal: number; // fallback step goal
  demo: boolean;
  anim: boolean;
  gender: "male" | "female";
  city: string;
  lat: number;
  lon: number;
  place: string;
  week: string[]; // preset id per weekday, [0] = Sunday
}

export interface SleepNight {
  score: number | null;
  qual: string | null;
  deep: number;
  light: number;
  rem: number;
  awake: number;
  start: number | null; // "local" epoch ms (Garmin encodes local time as UTC)
  end: number | null;
  hr: number | null;
  resp: number | null;
  respLo: number | null;
  respHi: number | null;
  stress: number | null;
  awakeN: number | null;
  need: number | null; // minutes
  remP: number | null;
  deepP: number | null;
  lightP: number | null;
  sub: [string, string | null][];
}

export interface Day {
  date: string;
  wd: string;
  steps: number | null;
  goal?: number | null;
  sleepH: number | null;
  rhr: number | null;
  bbMax: number | null;
  bbMin?: number | null;
  bbNow: number | null;
  stress: number | null;
  im?: number | null;
  imGoal?: number | null;
  kcal?: number | null;
  sl?: SleepNight;
}

export interface RunStats {
  spd?: number;
  gap?: number;
  maxSpd?: number;
  cad?: number;
  stride?: number;
  vo?: number;
  gct?: number;
  vr?: number;
  pw?: number;
  npw?: number;
  up?: number;
  down?: number;
  load?: number;
  label: string;
  vo2: number | null;
  k1: number | null;
  k5: number | null;
  k10: number | null;
  z: number[];
}

export interface ExerciseSet {
  category?: string;
  subCategory?: string;
  sets?: number;
  reps?: number;
  maxWeight?: number;
}

export interface Activity {
  name: string;
  type: string;
  muscles: MuscleKey[];
  start: string; // "YYYY-MM-DD HH:MM:SS" local
  dist: number | null;
  dur: number | null;
  hr: number | null;
  kcal: number | null;
  maxHr?: number | null;
  teA?: number | null;
  teN?: number | null;
  sets?: ExerciseSet[];
  run?: RunStats | null;
}

export interface DashData {
  days: Day[];
  acts: Activity[];
}

export interface Weather {
  t: number;
  code: number;
  day: boolean;
  min: number;
  max: number;
}
