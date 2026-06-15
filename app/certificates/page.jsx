"use client";
import { useEffect, useState } from "react";
import { api, getSession } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Certificates() {
  const router = useRouter();
  const [certs, setCerts] = useState(null);
  useEffect(() => {
    if (!getSession()) { router.push("/login?next=/certificates"); return; }
    api("/me/certificates").then(setCerts).catch(() => setCerts([]));
  }, []);

  if (!certs) return <p className="max-w-4xl mx-auto p-8 font-mono text-haze">Loading…</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <p className="font-mono text-xs tracking-[0.3em] text-haze">CREDENTIALS</p>
      <h1 className="font-display text-3xl mt-1 mb-8">Your certificates</h1>
      {certs.length === 0 && (
        <div className="card p-10 text-center text-haze">
          Complete every required item in a course, then claim your certificate from the player.
        </div>
      )}
      <div className="space-y-4">
        {certs.map(c => (
          <div key={c.code} className="board p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-haze">Certificate of completion</p>
            <p className="board-row text-xl mt-2">{c.courseTitle}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 font-mono text-sm">
              <span className="text-radar">{c.code}</span>
              <span className="text-haze">Issued {new Date(c.issuedAt).toLocaleDateString()}</span>
              <a className="text-sky underline" href={`/verify/${c.code}`}>Public verification link →</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
