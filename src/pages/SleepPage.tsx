import { drawPhases } from "../components/charts";
import { CanvasBox, Frame, Kv } from "../components/ui";
import { PHASE_COLORS as PH, qRu } from "../lib/constants";
import { clk, fmtDay, hm, hms, pad } from "../lib/format";
import type { DashData } from "../lib/types";

const mm2 = (m: number) => {
  m = Math.round(m) % (24 * 60);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

export function SleepPage({ data, fx }: { data: DashData | null; fx: boolean }) {
  const nights = (data?.days ?? []).filter((d) => d.sl);
  const last = nights.length ? nights[nights.length - 1].sl! : null;

  /* averages */
  const a = { score: 0, sc: 0, slept: 0, deep: 0, rem: 0, hr: 0, hc: 0, bed: 0, wake: 0, tc: 0 };
  let best = null as (typeof nights)[number] | null,
    worst = best;
  for (const n of nights) {
    const x = n.sl!,
      s2 = x.deep + x.light + x.rem;
    if (x.score !== null) {
      a.score += x.score;
      a.sc++;
      if (!best || x.score > best.sl!.score!) best = n;
      if (!worst || x.score < worst.sl!.score!) worst = n;
    }
    a.slept += s2;
    a.deep += x.deep / (s2 || 1);
    a.rem += x.rem / (s2 || 1);
    if (x.hr) {
      a.hr += x.hr;
      a.hc++;
    }
    if (x.start && x.end) {
      const b = new Date(x.start),
        w = new Date(x.end);
      let bm = b.getUTCHours() * 60 + b.getUTCMinutes();
      if (bm < 12 * 60) bm += 24 * 60;
      a.bed += bm;
      a.wake += w.getUTCHours() * 60 + w.getUTCMinutes();
      a.tc++;
    }
  }
  const n = nights.length;

  let lastView = <div className="dim">&gt; НЕТ ДАННЫХ О СНЕ</div>;
  if (last) {
    const tot = last.deep + last.light + last.rem + last.awake || 1,
      slept = last.deep + last.light + last.rem;
    const pct = (v: number | null) => (v !== null ? ` (${v}%)` : "");
    lastView = (
      <>
        <div>
          <span className="score">{last.score ?? "—"}</span>
          <span className="scoreq">
            ОЦЕНКА СНА
            <br />
            {qRu(last.qual)}
          </span>
        </div>
        <Kv k="СОН" frac={last.need ? slept / 60 / last.need : undefined} animate={fx}>
          {hms(slept)}
        </Kv>
        {last.need && <Kv k="НОРМА СНА">{hm(last.need / 60)}</Kv>}
        <Kv k="ЛЁГ → ВСТАЛ">
          {clk(last.start)} → {clk(last.end)}
        </Kv>
        <div className="phase">
          {(["deep", "light", "rem", "awake"] as const).map((k) => (
            <div key={k} style={{ width: `${(last[k] / tot) * 100}%`, background: PH[k] }} />
          ))}
        </div>
        <div className="leg">
          <span style={{ background: PH.deep }} />
          ГЛУБОКИЙ {hms(last.deep)}
          {pct(last.deepP)}
          <br />
          <span style={{ background: PH.light }} />
          ЛЁГКИЙ {hms(last.light)}
          {pct(last.lightP)}
          <br />
          <span style={{ background: PH.rem }} />
          REM {hms(last.rem)}
          {pct(last.remP)}
          <br />
          <span style={{ background: PH.awake }} />
          БОДРСТВ. {hms(last.awake)}
          {last.awakeN !== null ? ` · ${last.awakeN} ПРОБУЖД.` : ""}
        </div>
        {last.hr && <Kv k="ПУЛЬС ВО СНЕ">{last.hr} УД</Kv>}
        {last.resp && (
          <Kv k="ДЫХАНИЕ">
            {last.resp}{" "}
            <span className="dim">
              ({last.respLo}–{last.respHi}) ВД/МИН
            </span>
          </Kv>
        )}
        {last.stress !== null && (
          <Kv k="СТРЕСС ВО СНЕ" frac={last.stress / 100} animate={fx}>
            {last.stress}
          </Kv>
        )}
        {last.sub.some((s) => s[1]) && <div className="p2sec">ФАКТОРЫ ОЦЕНКИ</div>}
        {last.sub
          .filter((s) => s[1])
          .map(([name, q]) => (
            <div className="ex" key={name}>
              · {name} <span className="dim">{qRu(q)}</span>
            </div>
          ))}
      </>
    );
  }

  return (
    <div className="main">
      <div className="left">
        <Frame title="ПОСЛЕДНЯЯ НОЧЬ" className="p3l">
          <div className="p2in">{lastView}</div>
        </Frame>
      </div>
      <div className="right">
        <Frame title="ФАЗЫ СНА ПО НОЧАМ, Ч" className="p3c">
          <CanvasBox
            animKey={JSON.stringify(nights.map((x) => x.date))}
            animate={fx}
            draw={(ctx, w, h, p) => drawPhases(ctx, w, h, p, nights)}
          />
        </Frame>
        <Frame title="СРЕДНЕЕ ЗА ПЕРИОД" className="p3a">
          <div className="p2in twocol">
            {n ? (
              <>
                <Kv k="ОЦЕНКА">{a.sc ? Math.round(a.score / a.sc) : "—"}</Kv>
                <Kv k="СОН">{hms(a.slept / n)}</Kv>
                {a.tc > 0 && <Kv k="ОТБОЙ">{mm2(a.bed / a.tc)}</Kv>}
                {a.tc > 0 && <Kv k="ПОДЪЁМ">{mm2(a.wake / a.tc)}</Kv>}
                <Kv k="ГЛУБОКИЙ">{Math.round((a.deep / n) * 100)}%</Kv>
                <Kv k="REM">{Math.round((a.rem / n) * 100)}%</Kv>
                {a.hc > 0 && <Kv k="ПУЛЬС ВО СНЕ">{Math.round(a.hr / a.hc)} УД</Kv>}
                <Kv k="НОЧЕЙ">{n}</Kv>
                {best && (
                  <Kv k="ЛУЧШАЯ">
                    {fmtDay(best.date)} · {best.sl!.score}
                  </Kv>
                )}
                {worst && (
                  <Kv k="ХУДШАЯ">
                    {fmtDay(worst.date)} · {worst.sl!.score}
                  </Kv>
                )}
              </>
            ) : (
              <div className="dim">&gt; НЕТ ДАННЫХ</div>
            )}
          </div>
        </Frame>
      </div>
    </div>
  );
}
