import { drawRuns } from "../components/charts";
import { CanvasBox, Frame, Kv } from "../components/ui";
import { TE_LBL, typeRu } from "../lib/constants";
import { dmy, hm, iso, mmss, pace, segBar } from "../lib/format";
import type { DashData } from "../lib/types";

export function RunningPage({ data, now, fx }: { data: DashData | null; now: Date; fx: boolean }) {
  const runs = (data?.acts ?? []).filter((a) => a.run);
  const r = runs[0];
  const x = r?.run;

  const since7 = iso(new Date(now.getTime() - 6 * 86400000));
  const w = { n: 0, d: 0, t: 0 },
    all = { n: 0, d: 0, t: 0, hr: 0, hc: 0, cad: 0, cc: 0 };
  let best1: number | null = null,
    best5: number | null = null,
    vo2: number | null = null;
  let longest = runs[0] ?? null;
  for (const q of runs) {
    const y = q.run!;
    if (q.start.substr(0, 10) >= since7) {
      w.n++;
      w.d += q.dist || 0;
      w.t += q.dur || 0;
    }
    all.n++;
    all.d += q.dist || 0;
    all.t += q.dur || 0;
    if (q.hr) {
      all.hr += q.hr;
      all.hc++;
    }
    if (y.cad) {
      all.cad += y.cad;
      all.cc++;
    }
    if (y.k1 && (!best1 || y.k1 < best1)) best1 = y.k1;
    if (y.k5 && (!best5 || y.k5 < best5)) best5 = y.k5;
    if ((q.dist || 0) > (longest?.dist || 0)) longest = q;
    if (!vo2 && y.vo2) vo2 = y.vo2;
  }
  const zt = x ? x.z.reduce((s, v) => s + v, 0) : 0;
  const chartRuns = runs.slice(0, 10).reverse();

  return (
    <div className="main">
      <div className="left">
        <Frame title="ПОСЛЕДНЯЯ ПРОБЕЖКА" className="p3l">
          <div className="p2in">
            {r && x ? (
              <>
                <div className="p2name">&gt; {r.name.toUpperCase()}</div>
                <div className="p2sub dim">
                  {typeRu(r.type)} · {dmy(r.start)} {r.start.substr(11, 5)}
                  {x.label ? ` · ${TE_LBL[x.label] ?? x.label}` : ""}
                </div>
                <Kv k="ДИСТАНЦИЯ">{((r.dist || 0) / 1000).toFixed(2)} КМ</Kv>
                <Kv k="ВРЕМЯ">{mmss(r.dur)}</Kv>
                <Kv k="ТЕМП СР.">
                  {pace(x.spd)}
                  {x.gap ? (
                    <>
                      {" "}
                      <span className="dim">GAP {pace(x.gap)}</span>
                    </>
                  ) : null}
                </Kv>
                {x.k1 && <Kv k="ЛУЧШИЙ КМ">{mmss(x.k1)}</Kv>}
                {r.hr && (
                  <Kv k="ПУЛЬС СР/МАКС">
                    {Math.round(r.hr)}
                    {r.maxHr ? ` / ${Math.round(r.maxHr)}` : ""} УД
                  </Kv>
                )}
                {x.cad && <Kv k="КАДЕНС">{Math.round(x.cad)} ШАГ/МИН</Kv>}
                {x.stride && <Kv k="ДЛИНА ШАГА">{(x.stride / 100).toFixed(2)} М</Kv>}
                {x.vo && (
                  <Kv k="ВЕРТ. КОЛЕБ.">
                    {x.vo.toFixed(1)} СМ
                    {x.vr ? (
                      <>
                        {" "}
                        <span className="dim">{x.vr.toFixed(1)}%</span>
                      </>
                    ) : null}
                  </Kv>
                )}
                {x.gct && <Kv k="КОНТАКТ С ЗЕМЛ.">{Math.round(x.gct)} МС</Kv>}
                {x.pw && (
                  <Kv k="МОЩНОСТЬ">
                    {Math.round(x.pw)}
                    {x.npw ? ` / NP ${Math.round(x.npw)}` : ""} ВТ
                  </Kv>
                )}
                {x.up != null && (
                  <Kv k="НАБОР / СБРОС">
                    {Math.round(x.up)} / {Math.round(x.down || 0)} М
                  </Kv>
                )}
                {x.load && (
                  <Kv k="НАГРУЗКА">
                    {Math.round(x.load)}
                    {r.teA != null ? (
                      <>
                        {" "}
                        <span className="dim">
                          TE {r.teA.toFixed(1)} / {(r.teN || 0).toFixed(1)}
                        </span>
                      </>
                    ) : null}
                  </Kv>
                )}
                {zt > 0 && <div className="p2sec">ПУЛЬСОВЫЕ ЗОНЫ</div>}
                {zt > 0 &&
                  [4, 3, 2, 1, 0].map((i) => (
                    <div className="zrow" key={i}>
                      <span className="zk">З{i + 1}</span>
                      <span className="zb">{segBar(x.z[i] / zt)}</span> {hm(x.z[i] / 3600)}
                    </div>
                  ))}
              </>
            ) : (
              <div className="dim">&gt; НЕТ ПРОБЕЖЕК СРЕДИ ПОСЛЕДНИХ {(data?.acts ?? []).length} ТРЕНИРОВОК</div>
            )}
          </div>
        </Frame>
      </div>
      <div className="right">
        <Frame title="ПРОБЕЖКИ: ДИСТАНЦИЯ, КМ / ТЕМП" className="p3c">
          <CanvasBox
            animKey={JSON.stringify(chartRuns.map((q) => q.start))}
            animate={fx}
            draw={(ctx, cw, ch, p) => drawRuns(ctx, cw, ch, p, chartRuns)}
          />
        </Frame>
        <Frame title="БЕГОВЫЕ ИТОГИ" className="p3a">
          <div className="p2in twocol">
            {all.n ? (
              <>
                <Kv k="ЗА 7 ДНЕЙ">
                  {w.n} · {(w.d / 1000).toFixed(1)} КМ
                </Kv>
                <Kv k="ВРЕМЯ 7 ДН.">{hm(w.t / 3600)}</Kv>
                <Kv k="ПРОБЕЖЕК">
                  {all.n} <span className="dim">С {dmy(runs[runs.length - 1].start)}</span>
                </Kv>
                <Kv k="ВСЕГО КМ">{(all.d / 1000).toFixed(1)}</Kv>
                <Kv k="СР. ТЕМП">{pace(all.t ? all.d / all.t : 0)}</Kv>
                {all.hc > 0 && <Kv k="СР. ПУЛЬС">{Math.round(all.hr / all.hc)} УД</Kv>}
                {all.cc > 0 && <Kv k="СР. КАДЕНС">{Math.round(all.cad / all.cc)}</Kv>}
                {best1 && <Kv k="ЛУЧШИЙ 1 КМ">{mmss(best1)}</Kv>}
                {best5 && <Kv k="ЛУЧШИЕ 5 КМ">{mmss(best5)}</Kv>}
                {longest && <Kv k="МАКС. ДИСТ.">{((longest.dist || 0) / 1000).toFixed(1)} КМ</Kv>}
                {vo2 && <Kv k="VO2MAX">{vo2}</Kv>}
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
