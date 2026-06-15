"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api, getSession } from "@/lib/api";
import Markdown from "@/components/Markdown";
import Stars from "@/components/Stars";

const typeIcon = { Article: "▤", Video: "▶", Quiz: "✓", Assignment: "✎", CodeExercise: "{}", Resource: "⛁" };

export default function CourseLanding({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const [c, setC] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [openSection, setOpenSection] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);

  const load = () => api(`/catalog/courses/${slug}`, { auth: !!getSession() }).then(setC).catch(e => setError(e.message));
  useEffect(() => { load(); }, [slug]);

  const enroll = async () => {
    if (!getSession()) return router.push(`/login?next=/courses/${slug}`);
    setBusy(true);
    try {
      await api(`/learn/${slug}/enroll`, { method: "POST" });
      router.push(`/learn/${slug}`);
    } catch (e) { setError(e.message); setBusy(false); }
  };

  const saveReview = async () => {
    try {
      await api(`/courses/${c.id}/reviews`, { method: "PUT", body: { rating: myRating, body: myReview } });
      setReviewSaved(true); load();
    } catch (e) { setError(e.message); }
  };

  if (error && !c) return <p className="max-w-4xl mx-auto p-8 font-mono text-amber">{error}</p>;
  if (!c) return <p className="max-w-4xl mx-auto p-8 font-mono text-haze">Loading…</p>;

  const breakdown = [5, 4, 3, 2, 1].map(r => ({
    r, count: c.ratingBreakdown.find(b => b.rating === r)?.count || 0
  }));
  const maxCount = Math.max(1, ...breakdown.map(b => b.count));

  return (
    <div>
      {/* Hero */}
      <section className="bg-board border-b border-edge">
        <div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <p className="font-mono text-xs tracking-[0.25em] text-haze">{c.category.toUpperCase()} · {c.level.toUpperCase()} · {c.language.toUpperCase()}</p>
            <h1 className="font-display text-4xl mt-3 leading-tight board-row !tracking-normal">{c.title}</h1>
            <p className="text-haze mt-4 max-w-2xl">{c.subtitle}</p>
            <div className="flex flex-wrap items-center gap-4 mt-5 font-mono text-sm">
              {c.rating ? (
                <span className="flex items-center gap-2"><Stars value={c.rating} /> <span className="text-haze">{c.rating} · {c.reviewCount} reviews</span></span>
              ) : <span className="tag border-sky/50 text-sky">Newly published</span>}
              <span className="text-haze">{c.weeksEstimate} weeks · ~{c.totalHours} hrs of work</span>
            </div>
            <p className="font-mono text-xs text-haze mt-3">
              Taught by <span className="text-paper">{c.instructor.displayName}</span>
              {c.instructor.headline && <span> — {c.instructor.headline}</span>}
            </p>
          </div>
          <div className="card p-6 h-fit">
            <p className="label">Enrollment</p>
            <p className="font-display text-3xl text-radar">Free</p>
            <p className="text-haze text-sm mt-1">Full access · graded assignments · verifiable certificate</p>
            {c.enrolled ? (
              <button className="btn-green w-full mt-5" onClick={() => router.push(`/learn/${slug}`)}>Continue learning →</button>
            ) : (
              <button className="btn-amber w-full mt-5" onClick={enroll} disabled={busy}>
                {busy ? "Enrolling…" : "Enroll now"}
              </button>
            )}
            <ul className="mt-5 space-y-2 text-sm text-haze font-mono">
              <li>▤ {c.sections.reduce((a, s) => a + s.items.length, 0)} lessons across {c.sections.length} modules</li>
              <li>{"{}"} In-browser code exercises</li>
              <li>✎ Rubric-graded assignments</li>
              <li>⛉ Certificate on completion</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          {/* Outcomes */}
          <section>
            <h2 className="font-display text-2xl mb-4">What you'll be able to do</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {c.outcomes?.map((o, i) => (
                <div key={i} className="card p-4 flex gap-3">
                  <span className="text-radar font-mono">✓</span>
                  <p className="text-sm text-paper/90">{o}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Description */}
          <section>
            <h2 className="font-display text-2xl mb-4">About this course</h2>
            <Markdown>{c.descriptionMarkdown}</Markdown>
          </section>

          {/* Syllabus */}
          <section>
            <h2 className="font-display text-2xl mb-4">Syllabus</h2>
            <div className="space-y-3">
              {c.sections.map((s, i) => (
                <div key={s.id} className="card overflow-hidden">
                  <button className="w-full text-left p-4 flex items-center gap-4 hover:bg-board/50"
                    onClick={() => setOpenSection(openSection === i ? -1 : i)}>
                    <span className="font-mono text-amber text-sm w-10">{s.code}</span>
                    <span className="flex-1">
                      <span className="font-medium">{s.title}</span>
                      <span className="block font-mono text-xs text-haze mt-0.5">{s.weekRange} · {s.items.length} items · {s.track}</span>
                    </span>
                    <span className="font-mono text-haze">{openSection === i ? "−" : "+"}</span>
                  </button>
                  {openSection === i && (
                    <div className="border-t border-edge">
                      {s.summary && <p className="text-sm text-haze px-4 pt-3">{s.summary}</p>}
                      <ul className="p-4 space-y-2">
                        {s.items.map(it => (
                          <li key={it.id} className="flex items-center gap-3 text-sm">
                            <span className="font-mono text-haze w-5">{typeIcon[it.type] || "·"}</span>
                            <span className="flex-1 text-paper/90">{it.title}</span>
                            {it.isFreePreview && <span className="tag border-sky/50 text-sky">Free preview</span>}
                            <span className="font-mono text-xs text-haze">{it.estMinutes}m</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="font-display text-2xl mb-4">Reviews</h2>
            {c.reviewCount > 0 ? (
              <div className="grid sm:grid-cols-3 gap-6 mb-6">
                <div className="card p-5 text-center">
                  <p className="font-display text-5xl text-amber">{c.rating}</p>
                  <Stars value={c.rating} />
                  <p className="font-mono text-xs text-haze mt-1">{c.reviewCount} reviews</p>
                </div>
                <div className="sm:col-span-2 card p-5 space-y-1.5">
                  {breakdown.map(b => (
                    <div key={b.r} className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-haze w-3">{b.r}</span>
                      <div className="flex-1 h-2 bg-board rounded overflow-hidden">
                        <div className="h-full bg-amber" style={{ width: `${(b.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-haze w-6 text-right">{b.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-haze text-sm mb-4">No reviews yet — finish a module and be the first.</p>}

            <div className="space-y-3">
              {c.latestReviews.map((r, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center gap-3">
                    <Stars value={r.rating} size="text-sm" />
                    <span className="font-mono text-xs text-haze">{r.author}{r.headline ? ` · ${r.headline}` : ""}</span>
                  </div>
                  {r.body && <p className="text-sm text-paper/90 mt-2">{r.body}</p>}
                </div>
              ))}
            </div>

            {c.enrolled && (
              <div className="card p-5 mt-6 space-y-3">
                <p className="label">Rate this course</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} onClick={() => setMyRating(r)}
                      className={`text-2xl ${r <= myRating ? "text-amber" : "text-haze/40"} hover:text-amber`}>★</button>
                  ))}
                </div>
                <textarea className="input" placeholder="What worked? What should improve?" value={myReview} onChange={e => setMyReview(e.target.value)} />
                <button className="btn-amber" onClick={saveReview} disabled={!myRating}>
                  {reviewSaved ? "Saved ✓" : "Publish review"}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="card p-5">
            <p className="label">Prerequisites</p>
            <ul className="space-y-2 mt-2">
              {c.prerequisites?.map((p, i) => <li key={i} className="text-sm text-paper/85 flex gap-2"><span className="text-amber">·</span>{p}</li>)}
            </ul>
          </div>
          <div className="card p-5">
            <p className="label">Who this is for</p>
            <ul className="space-y-2 mt-2">
              {c.targetAudience?.map((p, i) => <li key={i} className="text-sm text-paper/85 flex gap-2"><span className="text-sky">·</span>{p}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
