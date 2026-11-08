export interface HttpResult {
  status: number;
  text: string;
}

/** fetch with a hard timeout; never throws — status 0 means network/TLS/CORS failure. */
export async function http(
  method: "GET" | "POST",
  url: string,
  headers: Record<string, string>,
  timeoutMs = 45000,
): Promise<HttpResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method, headers, signal: ctrl.signal, body: method === "POST" ? "" : undefined });
    return { status: r.status, text: await r.text() };
  } catch {
    if (ctrl.signal.aborted) return { status: 0, text: `Таймаут ${Math.round(timeoutMs / 1000)}с — сервер не ответил` };
    return { status: 0, text: "Браузер заблокировал запрос (CORS/сеть) — запустите через start-dashboard.bat" };
  } finally {
    clearTimeout(timer);
  }
}
