"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getSession } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [d, setD] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!getSession()) { router.push("/login?next=/dashboard"); return; }
    api("/me/dashboard").then(setD).catch(() => {});
    api("/me/bookmarks").then(setBookmarks).catch(() => {});
    api("/me/notes").then(setNotes).catch(() => {});
  }, []);

  if (!d) return <p className="max-w-5xl mx-auto p-8 font-mono text-haze">Loading…</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div>
        <p className="font-mono text-xs tracking-[0.3em] text-haze">FLIGHT DECK</p>
        <h1 className="font-display text-3xl mt-1">Welcome back, {d.displayName}</h1>
      </div>

      {/* Stats board */}
      <div className="board p-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          ["Streak", `${d.streak} day${d.streak === 1 ? "" : "s"}`],
          ["Level", d.level],
          ["XP", `${d.xpIntoLevel}/${d.xpPerLevel}`],
          ["Certificates", d.certificates]
        ].map(([k, v]) => (
          <div key={k}>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-haze">{k}</p>
            <p className="board-row text-2xl mt-1">{v}</p>
          </div>
        ))}
      </div>

      {/* Continue learning */}
      <section>
        <h2 className="font-display text-xl mb-4">Continue learning</h2>
        {d.courses.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-haze">You're not enrolled in anything yet.</p>
            <Link href="/" className="btn-amber mt-4">Browse the catalog</Link>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          {d.courses.map(c => (
            <div key={c.slug} className="card p-5">
              <p className="font-medium">{c.title}</p>
              <div className="flex justify-between font-mono text-xs text-haze mt-3 mb-1">
                <span>{c.done}/{c.total}</span><span>{c.percent}%</span>
              </div>
              <div className="h-1.5 bg-board rounded overflow-hidden">
                <div className="h-full bg-radar" style={{ width: `${c.percent}%` }} />
              </div>
              <Link className="btn-green mt-4"
                href={c.resumeItemId ? `/learn/${c.slug}?item=${c.resumeItemId}` : `/learn/${c.slug}`}>
                {c.percent > 0 ? "Resume →" : "Start →"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Bookmarks + notes */}
      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <h2 className="font-display text-xl mb-4">Bookmarked lessons</h2>
          {bookmarks.length === 0 && <p className="text-haze text-sm">Bookmark lessons with ⚑ in the player to pin them here.</p>}
          <div className="space-y-2">
            {bookmarks.map(b => (
              <div key={b.itemId} className="card p-3 flex items-center gap-3">
                <span className="text-amber">⚑</span>
                <span className="text-sm flex-1">{b.itemTitle}</span>
                <span className="tag border-edge text-haze">{b.type}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-display text-xl mb-4">Recent notes</h2>
          {notes.length === 0 && <p className="text-haze text-sm">Notes you take in lessons appear here.</p>}
          <div className="space-y-2">
            {notes.slice(0, 8).map(n => (
              <div key={n.id} className="card p-3">
                <p className="text-sm text-paper/90 line-clamp-2">{n.body}</p>
                <p className="font-mono text-xs text-haze mt-1">on {n.itemTitle}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
