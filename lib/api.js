const API = process.env.NEXT_PUBLIC_API || "https://study-ai-fqk6.onrender.com";

export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("session") || "null");
  } catch {
    return null;
  }
}
export function setSession(s) {
  if (s) localStorage.setItem("session", JSON.stringify(s));
  else localStorage.removeItem("session");
  window.dispatchEvent(new Event("session-changed"));
}

let refreshing = null; // single-flight refresh

async function tryRefresh() {
  const s = getSession();
  if (!s?.refreshToken) return null;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: s.refreshToken }),
      });
      if (!res.ok) {
        setSession(null);
        return null;
      }
      const next = await res.json();
      setSession(next);
      return next;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api(
  path,
  { method = "GET", body, auth = true, retry = true } = {},
) {
  const headers = { "Content-Type": "application/json" };
  const s = auth ? getSession() : null;
  if (s?.accessToken) headers.Authorization = `Bearer ${s.accessToken}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && auth && retry && getSession()) {
    const next = await tryRefresh();
    if (next) return api(path, { method, body, auth, retry: false });
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export async function logout() {
  const s = getSession();
  if (s?.refreshToken) {
    try {
      await api("/auth/logout", {
        method: "POST",
        body: { refreshToken: s.refreshToken },
        retry: false,
      });
    } catch {}
  }
  setSession(null);
}
