"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function GradingQueue() {
  const [subs, setSubs] = useState(null);
  const [grading, setGrading] = useState(null); // {id, grade, feedback}
  const load = () => api("/admin/submissions").then(setSubs).catch(() => setSubs([]));
  useEffect(() => { load(); }, []);

  const grade = async (requestChanges) => {
    await api(`/admin/submissions/${grading.id}/grade`, {
      method: "POST",
      body: { gradePercent: Number(grading.grade || 0), feedback: grading.feedback || "", requestChanges }
    });
    setGrading(null); load();
  };

  if (!subs) return <p className="max-w-5xl mx-auto p-8 font-mono text-haze">Loading…</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <p className="font-mono text-xs tracking-[0.3em] text-haze">STUDIO</p>
      <h1 className="font-display text-3xl mt-1 mb-8">Grading queue</h1>
      {subs.length === 0 && <div className="card p-10 text-center text-haze">Queue clear — nothing waiting for review.</div>}
      <div className="space-y-4">
        {subs.map(s => (
          <div key={s.id} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="font-medium">{s.itemTitle}</p>
              <p className="font-mono text-xs text-haze">{s.student} · {new Date(s.submittedAt).toLocaleString()}</p>
            </div>
            <p className="text-sm text-paper/85 mt-3 whitespace-pre-wrap">{s.contentText}</p>
            {s.artifactUrl && <a className="text-sky text-sm underline font-mono" href={s.artifactUrl} target="_blank" rel="noreferrer">{s.artifactUrl}</a>}
            {grading?.id === s.id ? (
              <div className="mt-4 space-y-3 border-t border-edge pt-4">
                <div className="flex gap-3 items-end">
                  <div><label className="label">Grade %</label>
                    <input className="input !w-24" type="number" min="0" max="100" value={grading.grade}
                      onChange={e => setGrading({ ...grading, grade: e.target.value })} /></div>
                  <div className="flex-1"><label className="label">Feedback</label>
                    <input className="input" value={grading.feedback}
                      onChange={e => setGrading({ ...grading, feedback: e.target.value })} /></div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-green" onClick={() => grade(false)}>Submit grade</button>
                  <button className="btn-ghost" onClick={() => grade(true)}>Request changes</button>
                  <button className="btn-ghost" onClick={() => setGrading(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn-amber mt-4" onClick={() => setGrading({ id: s.id, grade: "", feedback: "" })}>Grade</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
