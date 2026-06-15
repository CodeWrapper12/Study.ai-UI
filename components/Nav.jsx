"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession, logout } from "@/lib/api";

export default function Nav() {
  const [session, setSessionState] = useState(null);
  useEffect(() => {
    const sync = () => setSessionState(getSession());
    sync();
    window.addEventListener("session-changed", sync);
    return () => window.removeEventListener("session-changed", sync);
  }, []);

  const staff = session?.user?.role === "Admin" || session?.user?.role === "Instructor";

  return (
    <header className="sticky top-0 z-40 bg-board/95 backdrop-blur border-b border-edge">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="font-mono text-amber tracking-[0.2em] text-sm board-row">
          ▮ ACCELERATOR
        </Link>
        <nav className="flex items-center gap-4 text-sm font-mono text-haze">
          <Link href="/" className="hover:text-paper">Catalog</Link>
          {session && <Link href="/dashboard" className="hover:text-paper">Dashboard</Link>}
          {session && <Link href="/certificates" className="hover:text-paper">Certificates</Link>}
          {staff && <Link href="/admin" className="hover:text-amber text-amber/80">Studio</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm font-mono">
          {session ? (
            <>
              <span className="text-haze hidden sm:inline">{session.user.displayName}</span>
              <button className="btn-ghost !py-1" onClick={async () => { await logout(); location.href = "/"; }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-haze hover:text-paper">Sign in</Link>
              <Link href="/register" className="btn-amber !py-1">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
