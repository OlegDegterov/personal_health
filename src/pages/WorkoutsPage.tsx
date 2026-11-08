import { Frame, Kv } from "../components/ui";
import { MUSCLE_NAMES, teLabel, typeRu } from "../lib/constants";
import { dmy, fmtInt, hm, iso } from "../lib/format";
import { avg } from "../lib/parse";
import type { DashData } from "../lib/types";

export function WorkoutsPage({ data, now, fx }: { data: DashData | null; now: Date; fx: boolean }) {
  const acts = data?.acts ?? [];
  const a = acts[0];
  const since = iso(new Date(now.getTime() - 6 * 86400000));
  const week = acts.filter((x) => x.start && x.start.substr(0, 10) >= since);
  const dur = week.reduce((s, x) => s + (x.dur || 0), 0);
  const dist = week.reduce((s, x) => s + (x.dist || 0), 0);
  const kc = week.reduce((s, x) => s + (x.kcal || 0), 0);
  const str = week.filter((x) => x.type === "strength_training").length;
  const last7 = (data?.days ?? []).slice(-7);
  const im = last7.reduce((s, d) => s + (d.im || 0), 0);
  const imGoal = last7.reduce<number | null>((g, d) => d.imGoal || g, null) || 150;
  const ar = avg(data?.days ?? [], "rhr");
  const exercises = (a?.sets ?? []).filter((e) => {
    const nm = e.subCategory || e.category;
    return nm && nm !== "UNKNOWN" && nm !== "WARM_UP";
  });

  return (
    <div className="main">
      <div className="left">
        <Frame title="ПОСЛЕДНЯЯ ТРЕНИРОВКА" className="p2l">
          <div className="p2in">
            {a ? (
              <>
                <div className="p2name">&gt; {a.name.toUpperCase()}</div>
                <div className="p2sub dim">
                  {typeRu(a.type)} · {dmy(a.start)} {a.start.substr(11, 5)}
                </div>
                {a.dur ? <Kv k="ВРЕМЯ">{hm(a.dur / 3600)}</Kv> : null}
                {a.dist ? <Kv k="ДИСТАНЦИЯ">{(a.dist / 1000).toFixed(2)} КМ</Kv> : null}
                {a.hr ? (
                  <Kv k="ПУЛЬС СР/МАКС">
                    {Math.round(a.hr)}
                    {a.maxHr ? ` / ${Math.round(a.maxHr)}` : ""} УД
                  </Kv>
                ) : null}
                {a.kcal ? <Kv k="КАЛОРИИ">{Math.round(a.kcal)} ККАЛ</Kv> : null}
                {a.teA != null && (
                  <>
                    <Kv k="АЭРОБН. ЭФФ." frac={a.teA / 5} animate={fx}>
                      {a.teA.toFixed(1)}
                    </Kv>
                    <div className="ex dim te">{teLabel(a.teA)}</div>
                  </>
                )}
                {a.teN != null && (
                  <>
                    <Kv k="АНАЭРОБН. ЭФФ." frac={a.teN / 5} animate={fx}>
                      {a.teN.toFixed(1)}
                    </Kv>
                    <div className="ex dim te">{teLabel(a.teN)}</div>
                  </>
                )}
                {exercises.length > 0 && <div className="p2sec">УПРАЖНЕНИЯ</div>}
                {exercises.map((e, i) => (
                  <div className="ex" key={i}>
                    · {String(e.subCategory || e.category).replace(/_/g, " ")}{" "}
                    <span className="dim">
                      {e.sets ? `${e.sets} ПОДХ.` : ""}
                      {e.reps ? ` · ${e.reps} ПОВТ.` : ""}
                      {e.maxWeight ? ` · ${Math.round(e.maxWeight / 1000)} КГ` : ""}
                    </span>
                  </div>
                ))}
                {a.muscles.length > 0 && (
                  <>
                    <div className="p2sec">МЫШЦЫ</div>
                    <div className="ex">{a.muscles.map((m) => MUSCLE_NAMES[m]).join(" · ")}</div>
                  </>
                )}
              </>
            ) : (
              <div className="dim">&gt; НЕТ ТРЕНИРОВОК</div>
            )}
          </div>
        </Frame>
      </div>
      <div className="right">
        <Frame title="ЗА 7 ДНЕЙ" className="p2w">
          <Kv k="ТРЕНИРОВОК">
            {week.length} <span className="dim">(СИЛОВЫХ {str})</span>
          </Kv>
          <Kv k="ОБЩЕЕ ВРЕМЯ">{hm(dur / 3600)}</Kv>
          {dist > 0 && <Kv k="ДИСТАНЦИЯ">{(dist / 1000).toFixed(1)} КМ</Kv>}
          <Kv k="КАЛОРИИ">{fmtInt(kc)} ККАЛ</Kv>
          <Kv k="МИН. ИНТЕНСИВН." frac={im / imGoal} animate={fx}>
            {im} / {imGoal}
          </Kv>
          {ar && <Kv k="ПУЛЬС ПОКОЯ СР.">{Math.round(ar)} УД</Kv>}
        </Frame>
        <Frame title="ИСТОРИЯ ТРЕНИРОВОК" className="p2h">
          <div className="p2in">
            {acts.length ? (
              acts.map((x, i) => (
                <div className="hrow" key={i}>
                  &gt;{" "}
                  <span className="c" style={{ width: "12%" }}>
                    {dmy(x.start)}
                  </span>
                  <span className="c" style={{ width: "38%" }}>
                    {x.name.toUpperCase()}
                  </span>
                  <span className="c dim" style={{ width: "16%" }}>
                    {typeRu(x.type)}
                  </span>
                  <span className="c" style={{ width: "12%" }}>
                    {x.dur ? hm(x.dur / 3600) : ""}
                  </span>
                  <span className="c" style={{ width: "10%" }}>
                    {x.dist ? `${(x.dist / 1000).toFixed(1)}КМ` : ""}
                  </span>
                  <span className="c dim" style={{ width: "9%" }}>
                    {x.hr ? `${Math.round(x.hr)}УД` : ""}
                  </span>
                </div>
              ))
            ) : (
              <div className="dim">&gt; НЕТ ЗАПИСЕЙ</div>
            )}
          </div>
        </Frame>
      </div>
    </div>
  );
}
