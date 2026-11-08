import anime from "animejs";
import { useEffect, useRef, useState } from "react";
import { SettingsModal } from "./components/SettingsModal";
import { Clock, StatusBlock, WeatherBlock } from "./components/TopBar";
import { useConfig } from "./config";
import { useGarmin } from "./hooks/useGarmin";
import { useNow, useWeather } from "./hooks/useMisc";
import { OverviewPage } from "./pages/OverviewPage";
import { RunningPage } from "./pages/RunningPage";
import { SleepPage } from "./pages/SleepPage";
import { WorkoutsPage } from "./pages/WorkoutsPage";

const PAGES = 4;

export default function App() {
  const { cfg, setCfg } = useConfig();
  const now = useNow();
  const garmin = useGarmin(cfg);
  const wx = useWeather(cfg.lat, cfg.lon);
  const [page, setPage] = useState(1);
  const [settings, setSettings] = useState(() => !cfg.apiKey && !cfg.demo);
  const wrap = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const fx = cfg.anim !== false;

  const go = (d: number) => setPage((p) => ((p - 1 + d + PAGES) % PAGES) + 1);

  /* CRT power-on: collapse to a bright line, expand, flicker. Widgets re-measure afterwards. */
  useEffect(() => {
    const el = wrap.current!;
    if (!fx) {
      window.dispatchEvent(new Event("crt-ready"));
      return;
    }
    anime
      .timeline({ targets: el })
      .add({
        scaleY: [0.004, 0.004],
        scaleX: [0.05, 1],
        opacity: [0, 1],
        filter: ["brightness(5)", "brightness(5)"],
        duration: 280,
        easing: "easeOutQuad",
      })
      .add({ scaleY: [0.004, 1], filter: ["brightness(5)", "brightness(1)"], duration: 650, easing: "easeOutExpo" })
      .add({ opacity: [1, 0.75, 1, 0.85, 1], duration: 350, easing: "steps(5)" })
      .finished.then(() => {
        el.style.transform = "none";
        el.style.filter = "none";
        window.dispatchEvent(new Event("crt-ready"));
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* random screen glitch every 18–40 s */
  useEffect(() => {
    if (!fx) return;
    let t = 0;
    const sched = () => {
      t = window.setTimeout(
        () => {
          anime({
            targets: wrap.current,
            translateX: [0, -4, 3, -1, 0],
            opacity: [1, 0.82, 1, 0.9, 1],
            duration: 260,
            easing: "steps(5)",
            complete: () => {
              if (wrap.current) wrap.current.style.transform = "none";
            },
          });
          sched();
        },
        18000 + Math.random() * 22000,
      );
    };
    sched();
    return () => clearTimeout(t);
  }, [fx]);

  /* page switch flicker */
  useEffect(() => {
    if (fx && pageRef.current)
      anime({ targets: pageRef.current, opacity: [0, 0.4, 0.15, 1], duration: 380, easing: "steps(4)" });
    window.dispatchEvent(new Event("crt-ready"));
  }, [page, fx]);

  /* keyboard: ← → pages, Esc exit, F5 refresh */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settings) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Escape") window.close();
      if (e.key === "F5") {
        e.preventDefault();
        garmin.refresh();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings, garmin.refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const valKey = garmin.lastOk?.getTime() ?? 0;

  return (
    <>
      <div className={`wrap glow ${fx ? "fx-on" : ""}`} ref={wrap}>
        <div className="top">
          <Clock now={now} />
          <WeatherBlock wx={wx} place={cfg.place} />
          <StatusBlock
            demo={cfg.demo}
            lastOk={garmin.lastOk}
            nextAt={garmin.nextAt}
            error={garmin.error}
            loading={garmin.loading}
            now={now}
            page={page}
            pages={PAGES}
            onRefresh={garmin.refresh}
            onSettings={() => setSettings(true)}
            onExit={() => window.close()}
            onPage={go}
          />
        </div>
        <div ref={pageRef} className="pagehost">
          {page === 1 && <OverviewPage data={garmin.data} cfg={cfg} now={now} fx={fx} fxValKey={valKey} />}
          {page === 2 && <WorkoutsPage data={garmin.data} now={now} fx={fx} />}
          {page === 3 && <SleepPage data={garmin.data} fx={fx} />}
          {page === 4 && <RunningPage data={garmin.data} now={now} fx={fx} />}
        </div>
        <div className="roll" />
        <div className="scan" />
      </div>
      {settings && (
        <SettingsModal
          cfg={cfg}
          raw={garmin.raw}
          data={garmin.data}
          onClose={() => setSettings(false)}
          onSave={(c) => {
            setCfg(c);
            setSettings(false);
          }}
        />
      )}
    </>
  );
}
