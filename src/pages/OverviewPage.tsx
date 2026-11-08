import { BodyMap } from "../components/BodyMap";
import { drawDayBars } from "../components/charts";
import { CanvasBox, Frame, SegBar, Typewriter } from "../components/ui";
import { MUSCLE_NAMES, WD_SHORT, preset } from "../lib/constants";
import { dmy, fmtInt, hm, iso } from "../lib/format";
import { lastWith } from "../lib/parse";
import type { Config, DashData } from "../lib/types";

export function OverviewPage({
  data,
  cfg,
  now,
  fx,
  fxValKey,
}: {
  data: DashData | null;
  cfg: Config;
  now: Date;
  fx: boolean;
  fxValKey: number;
}) {
  const today = iso(now);
  const tp = preset(cfg.week[now.getDay()]);
  const np = preset(cfg.week[(now.getDay() + 1) % 7]);
  const acts = data?.acts ?? [];
  const done = acts.find((a) => a.start.substr(0, 10) === today && a.muscles.length) ?? null;
  const lastStr = acts.find((a) => a.type === "strength_training") ?? null;
  const muscles = done ? done.muscles : tp.m;
  const title = done ? done.name.toUpperCase() : tp.name;
  const names = muscles.map((m) => MUSCLE_NAMES[m]);
  const planKey = `${done ? "done" : "plan"}|${title}|${muscles.join(",")}`;

  const days = data?.days ?? [];
  const d0 = days[days.length - 1];
  const goal = d0?.goal || cfg.goal;
  const sl = lastWith(days, "sleepH"),
    hr = lastWith(days, "rhr"),
    st = lastWith(days, "stress");
  const bb = lastWith(days, "bbNow") ?? lastWith(days, "bbMax");
  const bbv = bb ? (bb.bbNow ?? bb.bbMax) : null;
  const chartKey = JSON.stringify(days);

  return (
    <div className="main">
      <div className="left">
        <Frame title="ТРЕНИРОВКА" className="body">
          <div className="plan">
            {done ? "ВЫПОЛНЕНО: " : "СЕГОДНЯ: "}
            <b>
              <Typewriter text={title} animate={fx} />
            </b>
            <span className="cursor">_</span>
          </div>
          <BodyMap muscles={muscles} animKey={planKey} animate={fx} gender={cfg.gender} />
          <div className="muscles">
            {names.length
              ? `${done ? "ПРОРАБОТАНО: " : "ЦЕЛЬ: "}${names.join(" · ")}`
              : "ВОССТАНОВЛЕНИЕ. МЫШЦЫ ОТДЫХАЮТ."}
          </div>
          <div className="next dim">
            ЗАВТРА ({WD_SHORT[(now.getDay() + 1) % 7]}): {np.name}
            {lastStr && lastStr !== done && (
              <>
                <br />
                ПОСЛ. СИЛОВАЯ: {lastStr.name.toUpperCase()} ({dmy(lastStr.start)})
              </>
            )}
          </div>
        </Frame>
      </div>

      <div className="right">
        <Frame title="ПОКАЗАТЕЛИ" className="stats">
          <div className="fxv" key={fxValKey}>
            <Stat n="ШАГИ" frac={d0?.steps ? d0.steps / goal : 0} fx={fx}>
              {d0?.steps != null ? (
                <>
                  {fmtInt(d0.steps)}
                  <span className="dim">/{fmtInt(goal)}</span>
                </>
              ) : (
                "—"
              )}
            </Stat>
            <Stat n="СОН" frac={sl ? sl.sleepH! / 8 : 0} fx={fx}>
              {sl ? hm(sl.sleepH!) : "—"}
            </Stat>
            <Stat n="ПУЛЬС ПОКОЯ" frac={hr ? Math.max(0, (90 - hr.rhr!) / 50) : 0} fx={fx}>
              {hr ? `${Math.round(hr.rhr!)} УД` : "—"}
            </Stat>
            <Stat n="ЭНЕРГИЯ (BB)" frac={bbv ? bbv / 100 : 0} fx={fx}>
              {bbv != null ? (
                <>
                  {Math.round(bbv)}
                  {bb!.bbMin != null && bb!.bbMax != null ? (
                    <>
                      {" "}
                      <span className="dim">
                        {Math.round(bb!.bbMin)}-{Math.round(bb!.bbMax)}
                      </span>
                    </>
                  ) : (
                    "/100"
                  )}
                </>
              ) : (
                "—"
              )}
            </Stat>
            <Stat n="СТРЕСС" frac={st ? st.stress! / 100 : 0} fx={fx}>
              {st
                ? `${Math.round(st.stress!)} ${st.stress! < 26 ? "ОТДЫХ" : st.stress! < 51 ? "НИЗК" : st.stress! < 76 ? "СРЕД" : "ВЫС"}`
                : "—"}
            </Stat>
          </div>
        </Frame>
        <div className="charts">
          <Frame title="ШАГИ / ДНИ" className="chart">
            {days.length > 0 && (
              <CanvasBox
                animKey={chartKey}
                animate={fx}
                draw={(ctx, w, h, p) =>
                  drawDayBars(ctx, w, h, p, days, "steps", goal, (v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(Math.round(v)),
                  )
                }
              />
            )}
          </Frame>
          <Frame title="СОН, Ч" className="chart">
            {days.length > 0 && (
              <CanvasBox
                animKey={chartKey}
                animate={fx}
                draw={(ctx, w, h, p) => drawDayBars(ctx, w, h, p, days, "sleepH", 8, (v) => v.toFixed(1))}
              />
            )}
          </Frame>
        </div>
        <Frame title="ЖУРНАЛ ТРЕНИРОВОК" className="acts">
          <div className="inner fxv" key={fxValKey}>
            {acts.length ? (
              acts.slice(0, 3).map((a, i) => {
                const p: string[] = [];
                if (a.start) p.push(`${dmy(a.start)} ${a.start.substr(11, 5)}`);
                if (a.dist) p.push(`${(a.dist / 1000).toFixed(1)}КМ`);
                if (a.dur) p.push(hm(a.dur / 3600));
                if (a.hr) p.push(`${Math.round(a.hr)}УД`);
                if (a.kcal) p.push(`${Math.round(a.kcal)}КК`);
                return (
                  <div className="act" key={i}>
                    &gt; {a.name.toUpperCase()} <span className="dim">{p.join(" | ")}</span>
                  </div>
                );
              })
            ) : (
              <div className="act dim">&gt; НЕТ ЗАПИСЕЙ</div>
            )}
          </div>
        </Frame>
      </div>
    </div>
  );
}

function Stat({ n, frac, fx, children }: { n: string; frac: number; fx: boolean; children: React.ReactNode }) {
  return (
    <div className="stat">
      <span className="n">{n}</span>
      <span className="bar">
        <SegBar frac={frac} animate={fx} />
      </span>
      <span className="v">{children}</span>
    </div>
  );
}
