import { describe, expect, it } from "vitest";
import { clk, deg, dmy, fmtDay, fmtInt, hm, hms, iso, mmss, pace, pad, segBar } from "./format";

describe("pad", () => {
  it("adds a leading zero below 10", () => {
    expect(pad(0)).toBe("00");
    expect(pad(7)).toBe("07");
    expect(pad(10)).toBe("10");
  });
});

describe("iso", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(iso(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(iso(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
});

describe("fmtInt", () => {
  it("rounds and groups thousands with spaces", () => {
    expect(fmtInt(0)).toBe("0");
    expect(fmtInt(999)).toBe("999");
    expect(fmtInt(12345)).toBe("12 345");
    expect(fmtInt(1234567.6)).toBe("1 234 568");
  });
});

describe("hm / hms", () => {
  it("formats hours as ЧММ", () => {
    expect(hm(0)).toBe("0Ч00М");
    expect(hm(7.5)).toBe("7Ч30М");
    expect(hm(1 / 60)).toBe("0Ч01М");
  });
  it("carries rounded minutes into hours", () => {
    expect(hm(1.9999)).toBe("2Ч00М");
  });
  it("hms converts seconds", () => {
    expect(hms(27000)).toBe("7Ч30М");
  });
});

describe("segBar", () => {
  it("fills proportionally", () => {
    expect(segBar(0.5, 4)).toBe("██░░");
    expect(segBar(0, 3)).toBe("░░░");
    expect(segBar(1, 3)).toBe("███");
  });
  it("clamps out-of-range fractions", () => {
    expect(segBar(-1, 3)).toBe("░░░");
    expect(segBar(2, 3)).toBe("███");
  });
  it("defaults to 18 segments", () => {
    expect(segBar(0.5)).toHaveLength(18);
  });
});

describe("dmy", () => {
  it("turns an ISO-like timestamp into DD.MM", () => {
    expect(dmy("2026-03-07 08:15:00")).toBe("07.03");
  });
  it("returns empty string for empty input", () => {
    expect(dmy("")).toBe("");
  });
});

describe("fmtDay", () => {
  it("prefixes the Russian weekday", () => {
    expect(fmtDay("2026-01-05")).toBe("ПН 05.01");
    expect(fmtDay("2026-01-04")).toBe("ВС 04.01");
  });
});

describe("clk", () => {
  it("reads Garmin local-as-UTC timestamps", () => {
    expect(clk(Date.UTC(2026, 0, 1, 23, 5))).toBe("23:05");
  });
  it("returns a dash for missing values", () => {
    expect(clk(null)).toBe("—");
    expect(clk(0)).toBe("—");
  });
});

describe("pace", () => {
  it("converts m/s to min/km", () => {
    expect(pace(1000 / 300)).toBe("5:00/КМ");
    expect(pace(3)).toBe("5:33/КМ");
  });
  it("returns a dash for missing or zero speed", () => {
    expect(pace(null)).toBe("—");
    expect(pace(undefined)).toBe("—");
    expect(pace(0)).toBe("—");
  });
});

describe("mmss", () => {
  it("formats durations under an hour as M:SS", () => {
    expect(mmss(65)).toBe("1:05");
    expect(mmss(59.6)).toBe("1:00");
  });
  it("formats durations over an hour as H:MM:SS", () => {
    expect(mmss(3725)).toBe("1:02:05");
  });
  it("returns a dash for missing values", () => {
    expect(mmss(null)).toBe("—");
    expect(mmss(0)).toBe("—");
  });
});

describe("deg", () => {
  it("adds a plus sign to positive temperatures only", () => {
    expect(deg(3.4)).toBe("+3°");
    expect(deg(0)).toBe("0°");
    expect(deg(-7.6)).toBe("-8°");
  });
});
