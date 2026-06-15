"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, setSession } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      setSession(await api("/auth/login", { method: "POST", body: { email, password }, auth: false }));
      router.push(next);
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card p-8 w-full max-w-md space-y-4">
      <p className="font-mono text-xs tracking-[0.3em] text-haze">CHECK-IN</p>
      <h1 className="font-display text-2xl">Sign in</h1>
      <div><label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
      <div><label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
      {error && <p className="font-mono text-sm text-amber">{error}</p>}
      <button className="btn-amber w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <p className="text-sm text-haze">No account? <Link href="/register" className="text-sky underline">Create one</Link></p>
    </form>
  );
}

export default function Login() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Suspense><LoginForm /></Suspense>
    </div>
  );
}
