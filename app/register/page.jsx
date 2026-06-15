"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setSession } from "@/lib/api";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      setSession(await api("/auth/register", { method: "POST", body: form, auth: false }));
      router.push("/dashboard");
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <form onSubmit={submit} className="card p-8 w-full max-w-md space-y-4">
        <p className="font-mono text-xs tracking-[0.3em] text-haze">NEW PASSENGER</p>
        <h1 className="font-display text-2xl">Create your account</h1>
        <div><label className="label">Display name</label>
          <input className="input" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} required /></div>
        <div><label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
        <div><label className="label">Password (8+ characters)</label>
          <input className="input" type="password" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
        {error && <p className="font-mono text-sm text-amber">{error}</p>}
        <button className="btn-amber w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        <p className="text-sm text-haze">Already aboard? <Link href="/login" className="text-sky underline">Sign in</Link></p>
      </form>
    </div>
  );
}
