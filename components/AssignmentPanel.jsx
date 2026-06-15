"use client";
import { useState } from "react";
import Markdown from "./Markdown";
import { api } from "@/lib/api";

export default function AssignmentPanel({ item, onSubmitted }) {
  const p = item.payload;
  const sub = item.submission;
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await api(`/items/${item.id}/submit-assignment`, { method: "POST", body: { contentText: text, artifactUrl: url } });
      setDone(true);
      onSubmitted?.();
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <Markdown>{p.instructionsMarkdown}</Markdown>

      <div className="card p-5">
        <p className="label">Grading rubric · {p.totalPoints} points</p>
        <table className="w-full text-sm mt-2">
          <tbody>
            {p.rubric.map((r, i) => (
              <tr key={i} className="border-b border-edge/50">
                <td className="py-2 pr-3 text-paper/90">{r.criterion}</td>
                <td className="py-2 font-mono text-amber text-right whitespace-nowrap">{r.points} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sub && (
        <div className={`card p-5 ${sub.status === "Graded" ? "border-radar/50" : sub.status === "ChangesRequested" ? "border-amber/50" : ""}`}>
          <p className="label">Your submission · {new Date(sub.submittedAt).toLocaleDateString()}</p>
          <p className="font-mono text-sm mt-1">
            Status: <span className={sub.status === "Graded" ? "text-radar" : "text-amber"}>{sub.status}</span>
            {sub.gradePercent != null && <span className="text-radar"> · {sub.gradePercent}%</span>}
          </p>
          {sub.feedback && (
            <div className="mt-3">
              <p className="label">Instructor feedback</p>
              <p className="text-paper/90 text-sm whitespace-pre-wrap">{sub.feedback}</p>
            </div>
          )}
        </div>
      )}

      {done ? (
        <div className="board p-5 flap"><p className="board-row">SUBMITTED — queued for grading.</p></div>
      ) : (
        <div className="card p-5 space-y-3">
          <p className="label">{sub ? "Resubmit" : "Submit your work"}</p>
          <p className="text-haze text-sm">{p.submissionHint}</p>
          <textarea className="input min-h-[140px]" placeholder="Your write-up…" value={text} onChange={e => setText(e.target.value)} />
          <input className="input" placeholder="Artifact URL (repo, gist, doc) — optional" value={url} onChange={e => setUrl(e.target.value)} />
          {error && <p className="font-mono text-sm text-amber">{error}</p>}
          <button className="btn-amber" onClick={submit} disabled={busy || !text.trim()}>
            {busy ? "Submitting…" : "Submit for grading"}
          </button>
        </div>
      )}
    </div>
  );
}
