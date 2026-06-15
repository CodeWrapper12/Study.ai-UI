"use client";
import { useEffect, useState } from "react";
import { api, getSession } from "@/lib/api";

export default function Discussions({ itemId }) {
  const [threads, setThreads] = useState([]);
  const [open, setOpen] = useState(null); // thread detail
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState(null);

  const load = () => api(`/items/${itemId}/threads`, { auth: false }).then(setThreads).catch(() => {});
  useEffect(() => { load(); setOpen(null); }, [itemId]);

  const ask = async () => {
    setError(null);
    try {
      await api(`/items/${itemId}/threads`, { method: "POST", body: { title, body } });
      setTitle(""); setBody(""); load();
    } catch (e) { setError(e.message); }
  };
  const openThread = (id) => api(`/threads/${id}`, { auth: false }).then(setOpen);
  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      await api(`/threads/${open.id}/replies`, { method: "POST", body: { body: reply } });
      setReply(""); openThread(open.id); load();
    } catch (e) { setError(e.message); }
  };
  const resolve = async () => { await api(`/threads/${open.id}/resolve`, { method: "POST" }); openThread(open.id); load(); };

  if (open) {
    return (
      <div className="space-y-4">
        <button className="font-mono text-xs text-haze hover:text-paper" onClick={() => setOpen(null)}>← All questions</button>
        <div className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{open.title}</p>
            {open.isResolved
              ? <span className="tag border-radar/50 text-radar">Resolved</span>
              : <button className="btn-green !py-1 !text-xs" onClick={resolve}>Mark resolved</button>}
          </div>
          {open.body && <p className="text-sm text-paper/80 mt-2 whitespace-pre-wrap">{open.body}</p>}
          <p className="font-mono text-xs text-haze mt-2">{open.author} · {new Date(open.createdAt).toLocaleDateString()}</p>
        </div>
        {open.replies.map(r => (
          <div key={r.id} className={`card p-3 ml-4 ${r.isInstructorReply ? "border-amber/50" : ""}`}>
            {r.isInstructorReply && <span className="tag border-amber/50 text-amber mb-1">Instructor</span>}
            <p className="text-sm text-paper/90 whitespace-pre-wrap">{r.body}</p>
            <p className="font-mono text-xs text-haze mt-1">{r.author} · {new Date(r.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        <div className="flex gap-2">
          <input className="input" placeholder={getSession() ? "Write a reply…" : "Sign in to reply"} value={reply}
            onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} disabled={!getSession()} />
          <button className="btn-amber" onClick={sendReply} disabled={!getSession()}>Reply</button>
        </div>
        {error && <p className="font-mono text-xs text-amber">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-2">
        <p className="label">Ask the cohort</p>
        <input className="input" placeholder="Question title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="input" placeholder="Details (optional)" value={body} onChange={e => setBody(e.target.value)} />
        {error && <p className="font-mono text-xs text-amber">{error}</p>}
        <button className="btn-amber" onClick={ask} disabled={!title.trim()}>Post question</button>
      </div>
      {threads.length === 0 && <p className="text-haze text-sm">No questions on this lesson yet — be the first.</p>}
      {threads.map(t => (
        <button key={t.id} className="card p-4 w-full text-left hover:border-haze transition-colors" onClick={() => openThread(t.id)}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-sm">{t.title}</p>
            {t.isResolved && <span className="tag border-radar/50 text-radar">Resolved</span>}
          </div>
          <p className="font-mono text-xs text-haze mt-1">{t.author} · {t.replyCount} replies</p>
        </button>
      ))}
    </div>
  );
}
