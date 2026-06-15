"use client";
import { useEffect, useState, use, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, getSession } from "@/lib/api";
import Markdown from "@/components/Markdown";
import QuizRunner from "@/components/QuizRunner";
import CodeRunner from "@/components/CodeRunner";
import VideoPlayer from "@/components/VideoPlayer";
import AssignmentPanel from "@/components/AssignmentPanel";
import NotesPanel from "@/components/NotesPanel";
import Discussions from "@/components/Discussions";

const typeIcon = { Article: "▤", Video: "▶", Quiz: "✓", Assignment: "✎", CodeExercise: "{}", Resource: "⛁" };

export default function Player({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const itemId = search.get("item");

  const [course, setCourse] = useState(null);
  const [item, setItem] = useState(null);
  const [tab, setTab] = useState("lesson");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [cert, setCert] = useState(null);

  const loadCourse = useCallback(() =>
    api(`/learn/${slug}`).then(setCourse).catch(e => setError(e.message)), [slug]);

  useEffect(() => {
    if (!getSession()) { router.push(`/login?next=/learn/${slug}`); return; }
    loadCourse();
  }, [slug]);

  // pick item: query param > resume > first
  useEffect(() => {
    if (!course) return;
    const all = course.sections.flatMap(s => s.items);
    const target = itemId || course.resumeItemId || all[0]?.id;
    if (!itemId && target) router.replace(`/learn/${slug}?item=${target}`);
    if (target) {
      setTab("lesson");
      api(`/items/${target}`).then(setItem).catch(e => setError(e.message));
    }
  }, [course, itemId]);

  const onCompleted = (res) => {
    if (res?.xpAwarded > 0) {
      setToast(`+${res.xpAwarded} XP`);
      setTimeout(() => setToast(null), 2500);
    }
    loadCourse();
    api(`/items/${item.id}`).then(setItem).catch(() => {});
  };

  const markComplete = async () => {
    const res = await api(`/items/${item.id}/complete`, { method: "POST" });
    onCompleted(res);
  };

  const toggleBookmark = async () => {
    await api(`/me/items/${item.id}/bookmark`, { method: "POST" });
    loadCourse();
  };

  const claim = async () => {
    try { setCert(await api(`/me/certificates/claim/${slug}`, { method: "POST" })); }
    catch (e) { setError(e.message); }
  };

  if (error && !course) return <p className="max-w-4xl mx-auto p-8 font-mono text-amber">{error}</p>;
  if (!course) return <p className="max-w-4xl mx-auto p-8 font-mono text-haze">Preparing your seat…</p>;

  const pct = course.totalItems ? Math.round((course.completedItems / course.totalItems) * 100) : 0;
  const bookmarked = course.sections.flatMap(s => s.items).find(i => i.id === item?.id)?.bookmarked;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="w-80 shrink-0 border-r border-edge bg-board hidden lg:flex flex-col">
        <div className="p-4 border-b border-edge">
          <Link href={`/courses/${slug}`} className="font-mono text-xs text-haze hover:text-paper">← Course page</Link>
          <p className="font-display mt-1 leading-snug">{course.title}</p>
          <div className="mt-3">
            <div className="flex justify-between font-mono text-xs text-haze mb-1">
              <span>{course.completedItems}/{course.totalItems} complete</span><span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-panel rounded overflow-hidden">
              <div className="h-full bg-radar transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {pct === 100 && (
            cert
              ? <Link className="btn-green w-full mt-3" href="/certificates">Certificate: {cert.code} →</Link>
              : <button className="btn-amber w-full mt-3" onClick={claim}>⛉ Claim certificate</button>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {course.sections.map(s => (
            <div key={s.id} className="mb-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-haze px-2 py-1">
                {s.code} · {s.title}
              </p>
              {s.items.map(it => (
                <button key={it.id}
                  onClick={() => router.push(`/learn/${slug}?item=${it.id}`)}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm
                    ${item?.id === it.id ? "bg-panel text-amber" : "text-paper/75 hover:bg-panel/60"}`}>
                  <span className={`font-mono text-xs ${it.completed ? "text-radar" : "text-haze"}`}>
                    {it.completed ? "●" : typeIcon[it.type] || "○"}
                  </span>
                  <span className="flex-1 truncate">{it.title}</span>
                  {it.bookmarked && <span className="text-amber text-xs">⚑</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {item && (
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-haze">{item.section.code} · {item.section.title} · {item.estMinutes} min</p>
                <h1 className="font-display text-3xl mt-1">{item.title}</h1>
              </div>
              <button className="btn-ghost !px-3" onClick={toggleBookmark} title="Bookmark">
                <span className={bookmarked ? "text-amber" : "text-haze"}>⚑</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-6 border-b border-edge font-mono text-sm">
              {["lesson", "notes", "discuss"].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 border-b-2 -mb-px capitalize
                    ${tab === t ? "border-amber text-amber" : "border-transparent text-haze hover:text-paper"}`}>
                  {t === "discuss" ? "Q&A" : t}
                </button>
              ))}
            </div>

            <div className="py-6">
              {tab === "lesson" && (
                <>
                  {item.type === "Article" && <Markdown>{item.payload?.contentMarkdown}</Markdown>}
                  {item.type === "Video" && <VideoPlayer item={item} />}
                  {item.type === "Quiz" && <QuizRunner item={item} onCompleted={onCompleted} />}
                  {item.type === "CodeExercise" && <CodeRunner item={item} onCompleted={onCompleted} />}
                  {item.type === "Assignment" && <AssignmentPanel item={item} onSubmitted={() => setToast("Submitted for grading")} />}
                  {item.type === "Resource" && (
                    <div className="space-y-4">
                      <Markdown>{item.payload?.descriptionMarkdown}</Markdown>
                      <div className="space-y-2">
                        {item.payload?.links?.map((l, i) => (
                          <a key={i} href={l.url} target="_blank" rel="noreferrer" className="card p-3 flex items-center gap-3 hover:border-sky/60">
                            <span className="font-mono text-sky">⛁</span>
                            <span className="text-sm">{l.title}</span>
                            <span className="ml-auto font-mono text-xs text-haze truncate max-w-[200px]">{l.url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="flex items-center justify-between mt-10 pt-6 border-t border-edge">
                    <button className="btn-ghost" disabled={!item.prevItemId}
                      onClick={() => router.push(`/learn/${slug}?item=${item.prevItemId}`)}>← Previous</button>
                    {["Article", "Video", "Resource"].includes(item.type) && !item.completed && (
                      <button className="btn-green" onClick={markComplete}>Mark complete</button>
                    )}
                    {item.completed && <span className="font-mono text-radar text-sm">● Completed</span>}
                    <button className="btn-ghost" disabled={!item.nextItemId}
                      onClick={() => router.push(`/learn/${slug}?item=${item.nextItemId}`)}>Next →</button>
                  </div>
                </>
              )}
              {tab === "notes" && <NotesPanel itemId={item.id} />}
              {tab === "discuss" && <Discussions itemId={item.id} />}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 board px-5 py-3 flap z-50">
          <p className="board-row">{toast}</p>
        </div>
      )}
    </div>
  );
}
