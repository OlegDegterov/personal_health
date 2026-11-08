import { useState } from "react";
import { geocode } from "../api/weather";
import { PRESETS, WD_SHORT } from "../lib/constants";
import type { Config } from "../lib/types";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun

export function SettingsModal({
  cfg,
  raw,
  data,
  onSave,
  onClose,
}: {
  cfg: Config;
  raw: Record<string, unknown>;
  data: unknown;
  onSave: (c: Config) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<Config>({ ...cfg, week: [...cfg.week] });
  const [cityMsg, setCityMsg] = useState("");
  const set = <K extends keyof Config>(k: K, v: Config[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    let next: Config = { ...f, apiKey: f.apiKey.trim(), goal: Number(String(f.goal).replace(/\D/g, "")) || 10000 };
    const city = next.city.trim();
    if (city && city !== cfg.city) {
      setCityMsg("ПОИСК ГОРОДА...");
      const g = await geocode(city);
      if (g) next = { ...next, city, ...g };
      else next = { ...next, place: `${city} (не найден)` };
    }
    onSave(next);
  };

  const dump = () => {
    const txt = JSON.stringify({ at: new Date().toString(), parsed: data, raw }, null, 1);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "application/json" }));
    a.download = "garmin-debug.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const rawTxt = Object.keys(raw).length ? JSON.stringify(raw, null, 1).substr(0, 6000) : "ПОКА НЕТ ОТВЕТОВ";

  return (
    <div className="modal">
      <div className="panel glow">
        <h2>&gt; НАСТРОЙКИ_</h2>
        <div className="row">
          <label>PERSONAL API KEY GARMIN</label>
          <input type="password" autoComplete="off" value={f.apiKey} onChange={(e) => set("apiKey", e.target.value)} />
          <div className="hint dim">
            Garmin Connect → Настройки → Personal API Token. Хранится только в этом браузере.
          </div>
        </div>
        <div className="row">
          <label>ИНТЕРВАЛ ОБНОВЛЕНИЯ</label>
          <select value={f.interval} onChange={(e) => set("interval", Number(e.target.value))}>
            {[
              [5, "5 минут"],
              [15, "15 минут"],
              [30, "30 минут"],
              [60, "1 час"],
              [120, "2 часа"],
              [240, "4 часа"],
            ].map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="row">
          <label>ДНЕЙ НА ГРАФИКАХ</label>
          <select value={f.days} onChange={(e) => set("days", Number(e.target.value))}>
            {[7, 14, 30].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="row">
          <label>ГОРОД ДЛЯ ПОГОДЫ</label>
          <input type="text" value={f.city} onChange={(e) => set("city", e.target.value)} />
          <div className="hint dim">
            {cityMsg || "Погода: Open-Meteo (бесплатно, без ключа). Например: Могилёв, Минск, Moscow."}
          </div>
        </div>
        <div className="row">
          <label>МОДЕЛЬ ТЕЛА</label>
          <select value={f.gender} onChange={(e) => set("gender", e.target.value as Config["gender"])}>
            <option value="male">Мужская</option>
            <option value="female">Женская</option>
          </select>
        </div>
        <div className="row">
          <label>ЦЕЛЬ ПО ШАГАМ</label>
          <input
            type="text"
            value={f.goal}
            onChange={(e) => set("goal", Number(e.target.value.replace(/\D/g, "")) || 0)}
          />
        </div>
        <div className="row">
          <label>НЕДЕЛЬНЫЙ ПЛАН ТРЕНИРОВОК</label>
          <div className="week">
            {ORDER.map((d) => (
              <div key={d}>
                {WD_SHORT[d]}
                <select
                  value={f.week[d] || "rest"}
                  onChange={(e) => {
                    const w = [...f.week];
                    w[d] = e.target.value;
                    set("week", w);
                  }}
                >
                  {PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="row">
          <label>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={f.anim}
              onChange={(e) => set("anim", e.target.checked)}
            />{" "}
            АНИМАЦИИ (выключите, если планшет тормозит)
          </label>
        </div>
        <div className="row">
          <label>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={f.demo}
              onChange={(e) => set("demo", e.target.checked)}
            />{" "}
            ДЕМО-РЕЖИМ (случайные данные, без запросов к Garmin)
          </label>
        </div>
        <div className="row">
          <label>ПОСЛЕДНИЕ ОТВЕТЫ API (диагностика)</label>
          <pre>{rawTxt}</pre>
        </div>
        <div className="actions">
          <span className="btn" onClick={dump}>
            [СКАЧАТЬ ОТЛАДКУ]
          </span>
          <span className="btn" onClick={onClose}>
            [ОТМЕНА]
          </span>
          <span className="btn" onClick={save}>
            [СОХРАНИТЬ]
          </span>
        </div>
      </div>
    </div>
  );
}
