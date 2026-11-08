import { describe, expect, it } from "vitest";
import activities from "./__fixtures__/activities.json";
import sleep from "./__fixtures__/sleep.json";
import summaries from "./__fixtures__/summaries.json";
import { avg, buildData, lastWith, musclesOfActivity } from "./parse";
import type { Day } from "./types";

const START = new Date(2026, 0, 5); // Monday
const build = () => buildData({ sum: summaries, sleep, acts: activities }, START, 3);

describe("buildData: days", () => {
  it("creates one entry per requested day, in order, with weekdays", () => {
    const { days } = build();
    expect(days.map((d) => d.date)).toEqual(["2026-01-05", "2026-01-06", "2026-01-07"]);
    expect(days.map((d) => d.wd)).toEqual(["ПН", "ВТ", "СР"]);
  });

  it("reads the nested summary format", () => {
    const d = build().days[0];
    expect(d).toMatchObject({ steps: 8421, goal: 9000, rhr: 54, bbMax: 88, bbMin: 21, bbNow: 47, stress: 31 });
    expect(d.im).toBe(20 + 2 * 15);
    expect(d.imGoal).toBe(150);
    expect(d.kcal).toBe(512);
    expect(d.sleepH).toBe(7);
  });

  it("reads the flat legacy summary format", () => {
    const d = build().days[1];
    expect(d).toMatchObject({ steps: 10400, goal: 10000, rhr: 56, bbMax: 75, bbMin: 30, bbNow: 60, stress: 28 });
    expect(d.im).toBeNull();
  });

  it("ignores records outside the window and leaves empty days null", () => {
    const d = build().days[2];
    expect(d).toMatchObject({ steps: null, sleepH: null, rhr: null, bbMax: null, bbNow: null, stress: null });
    expect(d.sl).toBeUndefined();
  });

  it("returns empty days for missing responses", () => {
    const { days, acts } = buildData({}, START, 2);
    expect(days).toHaveLength(2);
    expect(days.every((d) => d.steps === null)).toBe(true);
    expect(acts).toEqual([]);
  });
});

describe("buildData: sleep", () => {
  it("overrides sleep hours and fills the night details", () => {
    const d = build().days[1];
    expect(d.sleepH).toBe(7.5);
    expect(d.sl).toMatchObject({
      score: 84,
      qual: "GOOD",
      deep: 5400,
      light: 15000,
      rem: 6600,
      awake: 900,
      hr: 55,
      awakeN: 2,
      need: 480,
      remP: 24,
      deepP: 20,
      lightP: 56,
    });
    expect(d.sl?.sub).toContainEqual(["ДЛИТЕЛЬНОСТЬ", "EXCELLENT"]);
    expect(d.sl?.sub).toContainEqual(["БЕСПОКОЙСТВО", null]);
  });
});

describe("buildData: activities", () => {
  it("parses a run with running stats", () => {
    const run = build().acts[0];
    expect(run).toMatchObject({
      name: "Morning Run",
      type: "running",
      start: "2026-01-06 07:10:00",
      dist: 6420.5,
      dur: 2140.2,
      hr: 148,
      kcal: 420,
      maxHr: 171,
      teA: 3.1,
      teN: 0.8,
    });
    expect(run.muscles).toEqual(["quads", "hamstrings", "glutes", "calves"]);
    expect(run.run).toMatchObject({ spd: 3, cad: 172, label: "BASE", k1: 320, k5: null, z: [60, 600, 1100, 300, 0] });
  });

  it("parses a strength session without running stats", () => {
    const st = build().acts[1];
    expect(st.run).toBeNull();
    expect(st.sets).toHaveLength(2);
    expect(st.dist).toBeNull();
  });
});

describe("musclesOfActivity", () => {
  it("maps exercise categories to unique muscle groups", () => {
    const m = musclesOfActivity({
      summarizedExerciseSets: [{ category: "DEADLIFT" }, { category: "PULL_UP" }],
    });
    expect(m).toEqual(["hamstrings", "glutes", "lowerback", "back", "biceps", "forearms"]);
  });

  it("falls back to the sport type when there are no sets", () => {
    expect(musclesOfActivity({ activityType: { typeKey: "road_biking" } })).toEqual(["quads", "glutes", "calves"]);
  });

  it("returns nothing for unknown sports", () => {
    expect(musclesOfActivity({ activityType: { typeKey: "golf" } })).toEqual([]);
    expect(musclesOfActivity({})).toEqual([]);
  });
});

describe("lastWith / avg", () => {
  const days = [
    { steps: 1000, rhr: 50 },
    { steps: 3000, rhr: null },
    { steps: null, rhr: null },
  ] as Day[];

  it("lastWith returns the latest day having the field", () => {
    expect(lastWith(days, "steps")).toBe(days[1]);
    expect(lastWith(days, "rhr")).toBe(days[0]);
    expect(lastWith([], "steps")).toBeNull();
  });

  it("avg ignores nulls and returns null when nothing to average", () => {
    expect(avg(days, "steps")).toBe(2000);
    expect(avg([{ steps: null }] as Day[], "steps")).toBeNull();
  });
});
