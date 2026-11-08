import type { MuscleKey } from "./types";

export const GREEN = "#2dff8a";
export const DIM = "#0f5a31";
export const MID = "#159a52";
export const VERSION = `v${__APP_VERSION__}`;

export const MONTHS = [
  "ЯНВАРЯ",
  "ФЕВРАЛЯ",
  "МАРТА",
  "АПРЕЛЯ",
  "МАЯ",
  "ИЮНЯ",
  "ИЮЛЯ",
  "АВГУСТА",
  "СЕНТЯБРЯ",
  "ОКТЯБРЯ",
  "НОЯБРЯ",
  "ДЕКАБРЯ",
];
export const WEEKDAYS = ["ВОСКРЕСЕНЬЕ", "ПОНЕДЕЛЬНИК", "ВТОРНИК", "СРЕДА", "ЧЕТВЕРГ", "ПЯТНИЦА", "СУББОТА"];
export const WD_SHORT = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

export const MUSCLE_NAMES: Record<MuscleKey, string> = {
  shoulders: "ПЛЕЧИ",
  chest: "ГРУДЬ",
  biceps: "БИЦЕПС",
  triceps: "ТРИЦЕПС",
  forearms: "ПРЕДПЛЕЧЬЯ",
  abs: "ПРЕСС",
  obliques: "КОСЫЕ",
  quads: "КВАДРИЦЕПСЫ",
  hamstrings: "БИЦЕПС БЕДРА",
  glutes: "ЯГОДИЦЫ",
  calves: "ИКРЫ",
  back: "ШИРОЧАЙШИЕ",
  traps: "ТРАПЕЦИИ",
  lowerback: "ПОЯСНИЦА",
};

export interface Preset {
  id: string;
  name: string;
  m: MuscleKey[];
}
export const PRESETS: Preset[] = [
  { id: "rest", name: "ОТДЫХ", m: [] },
  { id: "legs", name: "НОГИ", m: ["quads", "hamstrings", "glutes", "calves"] },
  { id: "push", name: "ГРУДЬ + ТРИЦЕПС", m: ["chest", "shoulders", "triceps"] },
  { id: "pull", name: "СПИНА + БИЦЕПС", m: ["back", "traps", "biceps", "forearms", "lowerback"] },
  { id: "shld", name: "ПЛЕЧИ", m: ["shoulders", "traps"] },
  { id: "upper", name: "ВЕРХ ТЕЛА", m: ["chest", "back", "shoulders", "biceps", "triceps"] },
  { id: "full", name: "ВСЁ ТЕЛО", m: ["chest", "back", "shoulders", "quads", "hamstrings", "glutes", "abs"] },
  { id: "core", name: "КОР / ПРЕСС", m: ["abs", "obliques", "lowerback"] },
  { id: "run", name: "БЕГ", m: ["quads", "hamstrings", "glutes", "calves"] },
  { id: "bike", name: "ВЕЛОСИПЕД", m: ["quads", "glutes", "calves"] },
  { id: "swim", name: "ПЛАВАНИЕ", m: ["back", "shoulders", "chest", "triceps", "abs"] },
  { id: "stretch", name: "РАСТЯЖКА / ЙОГА", m: ["hamstrings", "lowerback", "shoulders"] },
];
export const preset = (id: string): Preset => PRESETS.find((p) => p.id === id) ?? PRESETS[0];

export const TYPE_RU: Record<string, string> = {
  strength_training: "СИЛОВАЯ",
  running: "БЕГ",
  trail_running: "ТРЕЙЛ",
  treadmill_running: "БЕГ (ДОРОЖКА)",
  cycling: "ВЕЛО",
  indoor_cycling: "ВЕЛОТРЕНАЖЁР",
  walking: "ХОДЬБА",
  hiking: "ПОХОД",
  lap_swimming: "БАССЕЙН",
  open_water_swimming: "ОТКР. ВОДА",
  yoga: "ЙОГА",
  pilates: "ПИЛАТЕС",
  hiit: "HIIT",
  cardio: "КАРДИО",
  indoor_cardio: "КАРДИО",
  breathwork: "ДЫХАНИЕ",
  elliptical: "ЭЛЛИПС",
  rowing: "ГРЕБЛЯ",
  indoor_rowing: "ГРЕБЛЯ",
};
export const typeRu = (t: string) =>
  TYPE_RU[t] ??
  String(t || "")
    .replace(/_/g, " ")
    .toUpperCase();

export const QUAL: Record<string, string> = { EXCELLENT: "ОТЛИЧНО", GOOD: "ХОРОШО", FAIR: "СРЕДНЕ", POOR: "ПЛОХО" };
export const qRu = (q: string | null) => (q ? (QUAL[q] ?? q) : "—");

export const TE_LBL: Record<string, string> = {
  RECOVERY: "ВОССТАНОВЛЕНИЕ",
  BASE: "БАЗА",
  TEMPO: "ТЕМП",
  THRESHOLD: "ПОРОГ",
  VO2MAX: "МПК",
  ANAEROBIC_CAPACITY: "АНАЭРОБН.",
  SPRINT: "СПРИНТ",
};
export const teLabel = (v: number | null | undefined) =>
  v == null
    ? ""
    : v < 1
      ? "НЕТ ЭФФЕКТА"
      : v < 2
        ? "НЕЗНАЧИТ."
        : v < 3
          ? "ПОДДЕРЖКА"
          : v < 4
            ? "УЛУЧШЕНИЕ"
            : v < 5
              ? "СИЛЬН. УЛУЧШ."
              : "ПЕРЕГРУЗКА";

export const PHASE_COLORS = { deep: "#2dff8a", rem: "#22b866", light: "#0f6e3a", awake: "#5a6b5f" };
