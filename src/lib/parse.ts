/* Turns raw Garmin Personal API responses into dashboard data. */
import { WD_SHORT } from "./constants";
import { iso } from "./format";
import type { Activity, DashData, Day, MuscleKey } from "./types";

type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function deepFind(obj: Json, keys: string[], depth = 0): number | null {
  if (obj === null || typeof obj !== "object" || depth > 4) return null;
  for (const k of keys) {
    const v = obj[k];
    if (v !== null && v !== undefined && v !== "" && typeof v !== "object" && !isNaN(Number(v))) return Number(v);
  }
  for (const k of Object.keys(obj)) {
    if (obj[k] && typeof obj[k] === "object") {
      const r = deepFind(obj[k], keys, depth + 1);
      if (r !== null) return r;
    }
  }
  return null;
}

function findStr(obj: Json, keys: string[], depth = 0): string | null {
  if (obj === null || typeof obj !== "object" || depth > 4) return null;
  for (const k of keys) if (typeof obj[k] === "string") return obj[k];
  for (const k of Object.keys(obj)) {
    if (obj[k] && typeof obj[k] === "object") {
      const r = findStr(obj[k], keys, depth + 1);
      if (r !== null) return r;
    }
  }
  return null;
}

function getPath(obj: Json, path: string): number | null {
  let cur = obj;
  for (const p of path.split(".")) {
    if (cur === null || typeof cur !== "object") return null;
    cur = cur[p];
  }
  return cur === null || cur === undefined || cur === "" || isNaN(Number(cur)) ? null : Number(cur);
}
const pick = (obj: Json, paths: string[]) => {
  for (const p of paths) {
    const v = getPath(obj, p);
    if (v !== null) return v;
  }
  return null;
};

function asList(res: Json): Json[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  for (const k of [
    "data",
    "dailySummaries",
    "values",
    "items",
    "entries",
    "dailySleepSummaries",
    "summaries",
    "activityList",
  ])
    if (Array.isArray(res[k])) return res[k];
  for (const k of Object.keys(res)) if (Array.isArray(res[k])) return res[k];
  return [res];
}
const dateOf = (rec: Json) => {
  const s = findStr(rec, ["calendarDate", "date", "summaryDate", "startDate"]);
  return s ? s.substr(0, 10) : null;
};

/* Garmin exercise categories -> muscle groups */
const EX_RULES: [RegExp, MuscleKey[]][] = [
  [/DEADLIFT|GOOD_MORNING|ROMANIAN/, ["hamstrings", "glutes", "lowerback", "back"]],
  [/SQUAT|LUNGE|STEP_UP|LEG_PRESS|WALL_SIT|BOX_JUMP|JUMP/, ["quads", "glutes", "hamstrings", "calves"]],
  [/HIP_RAISE|HIP_THRUST|GLUTE|BRIDGE|HIP_SWING|KETTLEBELL_SWING/, ["glutes", "hamstrings"]],
  [/LEG_CURL/, ["hamstrings"]],
  [/CALF/, ["calves"]],
  [/PULL_UP|CHIN_UP|ROW|LAT_|PULLDOWN/, ["back", "biceps", "forearms"]],
  [/PUSH_UP|BENCH|CHEST|FLYE|FLY|DIP/, ["chest", "triceps", "shoulders"]],
  [/SHOULDER|OVERHEAD|LATERAL_RAISE|FRONT_RAISE|ARNOLD|MILITARY/, ["shoulders"]],
  [/SHRUG/, ["traps"]],
  [/CURL/, ["biceps", "forearms"]],
  [/TRICEPS|SKULL/, ["triceps"]],
  [/HYPEREXTENSION|BACK_EXTENSION|SUPERMAN/, ["lowerback"]],
  [/CARRY|FARMER/, ["forearms", "traps"]],
  [/PLANK|MOUNTAIN_CLIMBER/, ["abs", "obliques", "shoulders"]],
  [/CORE|CRUNCH|SIT_UP|SCISSOR|ROLL_DOWN|KNEE_FOLD|LEG_RAISE|V_UP|HOLLOW|RUSSIAN_TWIST|INCHWORM/, ["abs", "obliques"]],
  [/SLAM|THROW|MEDICINE_BALL/, ["shoulders", "abs", "back"]],
  [/BURPEE|THRUSTER|CLEAN|SNATCH/, ["quads", "glutes", "shoulders", "back"]],
];
const SPORT_MUSCLES: [RegExp, MuscleKey[]][] = [
  [/run|walk|hik/, ["quads", "hamstrings", "glutes", "calves"]],
  [/cycl|bik/, ["quads", "glutes", "calves"]],
  [/swim/, ["back", "shoulders", "chest", "triceps", "abs"]],
  [/row/, ["back", "biceps", "quads", "glutes"]],
  [/yoga|pilates|stretch|breath/, ["hamstrings", "lowerback", "shoulders"]],
];

export function musclesOfActivity(x: Json): MuscleKey[] {
  const set = new Set<MuscleKey>();
  const sets: Json[] = x.summarizedExerciseSets || [];
  for (const s of sets) {
    const t = `${s.category || ""} ${s.subCategory || ""}`;
    for (const [re, ms] of EX_RULES) if (re.test(t)) ms.forEach((m) => set.add(m));
  }
  if (!sets.length) {
    const tk = x.activityType?.typeKey || "";
    const hit = SPORT_MUSCLES.find(([re]) => re.test(tk));
    if (hit) hit[1].forEach((m) => set.add(m));
  }
  return [...set];
}

const num = (v: unknown) => (typeof v === "number" ? v : null);

function parseActivity(x: Json): Activity {
  const typeKey: string = x.activityType?.typeKey || "";
  return {
    name: findStr(x, ["activityName", "name"]) || "ТРЕНИРОВКА",
    type: typeKey,
    muscles: musclesOfActivity(x),
    start: findStr(x, ["startTimeLocal", "startTimeGMT", "startTime"]) || "",
    dist: deepFind(x, ["distance", "distanceInMeters"]),
    dur: deepFind(x, ["duration", "elapsedDuration", "movingDuration", "durationInSeconds"]),
    hr: deepFind(x, ["averageHR", "averageHeartRate", "avgHr"]),
    kcal: deepFind(x, ["calories", "activeKilocalories"]),
    maxHr: num(x.maxHR),
    teA: num(x.aerobicTrainingEffect),
    teN: num(x.anaerobicTrainingEffect),
    sets: (x.summarizedExerciseSets || []).slice(0, 12),
    run: /run/.test(typeKey)
      ? {
          spd: x.averageSpeed,
          gap: x.avgGradeAdjustedSpeed,
          maxSpd: x.maxSpeed,
          cad: x.averageRunningCadenceInStepsPerMinute,
          stride: x.avgStrideLength,
          vo: x.avgVerticalOscillation,
          gct: x.avgGroundContactTime,
          vr: x.avgVerticalRatio,
          pw: x.avgPower,
          npw: x.normPower,
          up: x.elevationGain,
          down: x.elevationLoss,
          load: x.activityTrainingLoad,
          label: x.trainingEffectLabel || "",
          vo2: x.vO2MaxValue || null,
          k1: x.fastestSplit_1000 || null,
          k5: x.fastestSplit_5000 || null,
          k10: x.fastestSplit_10000 || null,
          z: [1, 2, 3, 4, 5].map((i) => x[`hrTimeInZone_${i}`] || 0),
        }
      : null,
  };
}

export interface RawResponses {
  sum?: Json;
  sleep?: Json;
  acts?: Json;
}

export function buildData(res: RawResponses, start: Date, days: number): DashData {
  const byDate: Record<string, Day> = {};
  const order: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000),
      k = iso(d);
    byDate[k] = {
      date: k,
      wd: WD_SHORT[d.getDay()],
      steps: null,
      sleepH: null,
      rhr: null,
      bbMax: null,
      bbNow: null,
      stress: null,
    };
    order.push(k);
  }
  for (const r of asList(res.sum)) {
    const dk = dateOf(r);
    if (!dk || !byDate[dk]) continue;
    const o = byDate[dk];
    o.steps = pick(r, ["movement.steps.value", "totalSteps"]);
    o.goal = pick(r, ["movement.steps.goal", "dailyStepGoal"]);
    o.rhr = pick(r, ["heartRate.restingValue", "restingHeartRate"]);
    o.bbMax = pick(r, ["bodyBattery.maxValue", "bodyBatteryHighestValue"]);
    o.bbMin = pick(r, ["bodyBattery.minValue", "bodyBatteryLowestValue"]);
    o.bbNow = pick(r, ["bodyBattery.latestValue", "bodyBatteryMostRecentValue"]);
    o.stress = pick(r, ["stress.avgLevel", "averageStressLevel"]);
    const imM = pick(r, ["intensityMinutes.moderate"]),
      imV = pick(r, ["intensityMinutes.vigorous"]);
    o.im = imM === null && imV === null ? null : (imM || 0) + 2 * (imV || 0);
    o.imGoal = pick(r, ["intensityMinutes.goal"]);
    o.kcal = pick(r, ["calories.burnedActive"]);
    const sl = deepFind(r, ["sleepingSeconds", "sleepTimeSeconds"]);
    if (sl) o.sleepH = sl / 3600;
  }
  for (const q of asList(res.sleep)) {
    const dk = dateOf(q);
    if (!dk || !byDate[dk]) continue;
    const sec = deepFind(q, ["sleepTimeSeconds", "totalSleepSeconds", "sleepingSeconds", "value"]);
    if (sec) byDate[dk].sleepH = sec > 48 ? sec / 3600 : sec;
    const sc = q.sleepScores || {};
    const qk = (k: string): string | null => sc[k]?.qualifierKey ?? null;
    byDate[dk].sl = {
      score: sc.overall ? sc.overall.value : null,
      qual: qk("overall"),
      deep: q.deepSleepSeconds || 0,
      light: q.lightSleepSeconds || 0,
      rem: q.remSleepSeconds || 0,
      awake: q.awakeSleepSeconds || 0,
      start: q.sleepStartTimestampLocal || null,
      end: q.sleepEndTimestampLocal || null,
      hr: q.avgHeartRate || null,
      resp: q.averageRespirationValue || null,
      respLo: q.lowestRespirationValue || null,
      respHi: q.highestRespirationValue || null,
      stress: q.avgSleepStress ?? null,
      awakeN: q.awakeCount ?? null,
      need: q.sleepNeed?.actual || null,
      remP: sc.remPercentage?.value ?? null,
      deepP: sc.deepPercentage?.value ?? null,
      lightP: sc.lightPercentage?.value ?? null,
      sub: [
        ["ДЛИТЕЛЬНОСТЬ", qk("totalDuration")],
        ["СТРЕСС", qk("stress")],
        ["ПРОБУЖДЕНИЯ", qk("awakeCount")],
        ["БЕСПОКОЙСТВО", qk("restlessness")],
        ["ГЛУБОКИЙ", qk("deepPercentage")],
        ["БЫСТРЫЙ (REM)", qk("remPercentage")],
        ["ЛЁГКИЙ", qk("lightPercentage")],
      ],
    };
  }
  const acts = asList(res.acts).slice(0, 20).map(parseActivity);
  return { days: order.map((k) => byDate[k]), acts };
}

/* small helpers shared by pages */
export const lastWith = (days: Day[], f: keyof Day) => {
  for (let i = days.length - 1; i >= 0; i--) if (days[i][f] !== null && days[i][f] !== undefined) return days[i];
  return null;
};
export const avg = (days: Day[], f: keyof Day) => {
  let s = 0,
    c = 0;
  for (const d of days) {
    const v = d[f];
    if (typeof v === "number") {
      s += v;
      c++;
    }
  }
  return c ? s / c : null;
};
