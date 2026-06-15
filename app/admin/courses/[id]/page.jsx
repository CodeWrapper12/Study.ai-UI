"use client";
import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const ITEM_TYPES = ["Article", "Video", "Quiz", "Assignment", "CodeExercise", "Resource"];

const emptyPayload = {
  Article: { contentMarkdown: "" },
  Video: { url: "", durationSec: 600, notesMarkdown: "" },
  Quiz: { passPercent: 70, questions: [] },
  Assignment: { instructionsMarkdown: "", totalPoints: 100, rubric: [], submissionHint: "" },
  CodeExercise: { language: "python", promptMarkdown: "", starterCode: "", tests: [{ name: "verified output", stdin: null, expectedStdout: "" }], solutionCode: "", hintMarkdown: "" },
  Resource: { descriptionMarkdown: "", links: [] }
};

function ListEditor({ label, items, onChange, placeholder }) {
  return (
    <div>
      <label className="label">{label}</label>
      {items.map((v, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input className="input" value={v} placeholder={placeholder}
            onChange={e => onChange(items.map((x, j) => j === i ? e.target.value : x))} />
          <button className="btn-ghost !px-3" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button className="btn-ghost !py-1 !text-xs" onClick={() => onChange([...items, ""])}>+ Add</button>
    </div>
  );
}

function QuizEditor({ payload, setPayload }) {
  const qs = payload.questions;
  const setQ = (i, q) => setPayload({ ...payload, questions: qs.map((x, j) => j === i ? q : x) });
  return (
    <div className="space-y-4">
      <div><label className="label">Pass percent</label>
        <input className="input !w-28" type="number" value={payload.passPercent}
          onChange={e => setPayload({ ...payload, passPercent: Number(e.target.value) })} /></div>
      {qs.map((q, i) => (
        <div key={i} className="card p-4 space-y-3 !bg-board">
          <div className="flex gap-2 items-start">
            <textarea className="input" placeholder={`Question ${i + 1}`} value={q.text}
              onChange={e => setQ(i, { ...q, text: e.target.value })} />
            <select className="input !w-32" value={q.kind} onChange={e => setQ(i, { ...q, kind: e.target.value })}>
              <option value="single">single</option><option value="multi">multi</option><option value="truefalse">true/false</option>
            </select>
            <button className="btn-ghost !px-3" onClick={() => setPayload({ ...payload, questions: qs.filter((_, j) => j !== i) })}>✕</button>
          </div>
          {q.options.map((o, oi) => (
            <div key={oi} className="flex gap-2 items-center ml-4">
              <input type="checkbox" className="accent-radar" checked={o.correct}
                onChange={e => setQ(i, { ...q, options: q.options.map((x, j) => j === oi ? { ...x, correct: e.target.checked } : x) })} />
              <input className="input" placeholder="Option text" value={o.text}
                onChange={e => setQ(i, { ...q, options: q.options.map((x, j) => j === oi ? { ...x, text: e.target.value } : x) })} />
              <button className="btn-ghost !px-2 !py-1" onClick={() => setQ(i, { ...q, options: q.options.filter((_, j) => j !== oi) })}>✕</button>
            </div>
          ))}
          <button className="btn-ghost !py-1 !text-xs ml-4" onClick={() =>
            setQ(i, { ...q, options: [...q.options, { id: `q${i + 1}o${q.options.length + 1}-${Date.now()}`, text: "", correct: false }] })}>+ Option</button>
          <input className="input" placeholder="Explanation shown after answering (optional)" value={q.explanation || ""}
            onChange={e => setQ(i, { ...q, explanation: e.target.value })} />
        </div>
      ))}
      <button className="btn-ghost" onClick={() => setPayload({
        ...payload,
        questions: [...qs, { id: `q${qs.length + 1}-${Date.now()}`, text: "", kind: "single", options: [], explanation: "" }]
      })}>+ Add question</button>
    </div>
  );
}

function PayloadEditor({ type, payload, setPayload }) {
  const set = (patch) => setPayload({ ...payload, ...patch });
  if (type === "Article") return (
    <div><label className="label">Content (Markdown — supports tables, code, mermaid diagrams)</label>
      <textarea className="input min-h-[400px] font-mono text-sm" value={payload.contentMarkdown}
        onChange={e => set({ contentMarkdown: e.target.value })} /></div>
  );
  if (type === "Video") return (
    <div className="space-y-3">
      <div><label className="label">Video URL (YouTube, Vimeo, or direct .mp4)</label>
        <input className="input" value={payload.url} onChange={e => set({ url: e.target.value })} /></div>
      <div><label className="label">Duration (seconds)</label>
        <input className="input !w-32" type="number" value={payload.durationSec} onChange={e => set({ durationSec: Number(e.target.value) })} /></div>
      <div><label className="label">Watch notes (Markdown, optional)</label>
        <textarea className="input min-h-[120px]" value={payload.notesMarkdown || ""} onChange={e => set({ notesMarkdown: e.target.value })} /></div>
    </div>
  );
  if (type === "Quiz") return <QuizEditor payload={payload} setPayload={setPayload} />;
  if (type === "Assignment") return (
    <div className="space-y-3">
      <div><label className="label">Instructions (Markdown)</label>
        <textarea className="input min-h-[240px] font-mono text-sm" value={payload.instructionsMarkdown}
          onChange={e => set({ instructionsMarkdown: e.target.value })} /></div>
      <div><label className="label">Total points</label>
        <input className="input !w-28" type="number" value={payload.totalPoints} onChange={e => set({ totalPoints: Number(e.target.value) })} /></div>
      <label className="label">Rubric</label>
      {payload.rubric.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input className="input" placeholder="Criterion" value={r.criterion}
            onChange={e => set({ rubric: payload.rubric.map((x, j) => j === i ? { ...x, criterion: e.target.value } : x) })} />
          <input className="input !w-24" type="number" placeholder="pts" value={r.points}
            onChange={e => set({ rubric: payload.rubric.map((x, j) => j === i ? { ...x, points: Number(e.target.value) } : x) })} />
          <button className="btn-ghost !px-3" onClick={() => set({ rubric: payload.rubric.filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <button className="btn-ghost !py-1 !text-xs" onClick={() => set({ rubric: [...payload.rubric, { criterion: "", points: 10 }] })}>+ Rubric row</button>
      <div><label className="label">Submission hint</label>
        <input className="input" value={payload.submissionHint} onChange={e => set({ submissionHint: e.target.value })} /></div>
    </div>
  );
  if (type === "CodeExercise") return (
    <div className="space-y-3">
      <div><label className="label">Language ("python" runs in-browser)</label>
        <input className="input !w-48" value={payload.language} onChange={e => set({ language: e.target.value })} /></div>
      <div><label className="label">Prompt (Markdown)</label>
        <textarea className="input min-h-[140px] font-mono text-sm" value={payload.promptMarkdown} onChange={e => set({ promptMarkdown: e.target.value })} /></div>
      <div><label className="label">Starter code</label>
        <textarea className="input min-h-[160px] font-mono text-sm" value={payload.starterCode} onChange={e => set({ starterCode: e.target.value })} /></div>
      <div><label className="label">Expected stdout (exact output to verify against)</label>
        <textarea className="input min-h-[80px] font-mono text-sm" value={payload.tests?.[0]?.expectedStdout || ""}
          onChange={e => set({ tests: [{ name: "verified output", stdin: null, expectedStdout: e.target.value }] })} /></div>
      <div><label className="label">Model solution (revealed after completion)</label>
        <textarea className="input min-h-[160px] font-mono text-sm" value={payload.solutionCode || ""} onChange={e => set({ solutionCode: e.target.value })} /></div>
      <div><label className="label">Hint (Markdown, optional)</label>
        <textarea className="input" value={payload.hintMarkdown || ""} onChange={e => set({ hintMarkdown: e.target.value })} /></div>
    </div>
  );
  if (type === "Resource") return (
    <div className="space-y-3">
      <div><label className="label">Description (Markdown)</label>
        <textarea className="input min-h-[100px]" value={payload.descriptionMarkdown} onChange={e => set({ descriptionMarkdown: e.target.value })} /></div>
      <label className="label">Links</label>
      {payload.links.map((l, i) => (
        <div key={i} className="flex gap-2">
          <input className="input" placeholder="Title" value={l.title}
            onChange={e => set({ links: payload.links.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} />
          <input className="input" placeholder="https://…" value={l.url}
            onChange={e => set({ links: payload.links.map((x, j) => j === i ? { ...x, url: e.target.value } : x) })} />
          <button className="btn-ghost !px-3" onClick={() => set({ links: payload.links.filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <button className="btn-ghost !py-1 !text-xs" onClick={() => set({ links: [...payload.links, { title: "", url: "" }] })}>+ Link</button>
    </div>
  );
  return null;
}

export default function CourseBuilder({ params }) {
  const { id } = use(params);
  const [c, setC] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [newSection, setNewSection] = useState(false);
  const [sectionForm, setSectionForm] = useState({ code: "", title: "", summary: "", track: "", weekRange: "" });
  // item editor state
  const [editingItem, setEditingItem] = useState(null); // {sectionId, id?, type, title, estMinutes, isFreePreview, countsTowardCompletion, payload}

  const load = useCallback(() => api(`/admin/courses/${id}`).then(d => {
    setC(d);
    setMeta({
      slug: d.slug, title: d.title, subtitle: d.subtitle, descriptionMarkdown: d.descriptionMarkdown,
      category: d.category, level: d.level, language: d.language, thumbnailUrl: d.thumbnailUrl,
      promoVideoUrl: d.promoVideoUrl, weeksEstimate: d.weeksEstimate,
      outcomes: d.outcomes || [], prerequisites: d.prerequisites || [], targetAudience: d.targetAudience || []
    });
  }).catch(e => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  const saveMeta = async () => {
    setError(null);
    try {
      await api(`/admin/courses/${id}`, { method: "PUT", body: meta });
      setSaved(true); setTimeout(() => setSaved(false), 2000); load();
    } catch (e) { setError(e.message); }
  };

  const togglePublish = async () => {
    setError(null);
    try {
      await api(`/admin/courses/${id}/${c.status === "Published" ? "unpublish" : "publish"}`, { method: "POST" });
      load();
    } catch (e) { setError(e.message); }
  };

  const addSection = async () => {
    await api(`/admin/courses/${id}/sections`, {
      method: "POST", body: { ...sectionForm, order: (c.sections.length || 0) + 1 }
    });
    setNewSection(false); setSectionForm({ code: "", title: "", summary: "", track: "", weekRange: "" }); load();
  };
  const deleteSection = async (sid) => { if (confirm("Delete this section and all its items?")) { await api(`/admin/sections/${sid}`, { method: "DELETE" }); load(); } };
  const moveSection = async (idx, dir) => {
    const ids = c.sections.map(s => s.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    await api(`/admin/courses/${id}/sections/reorder`, { method: "POST", body: { orderedIds: ids } });
    load();
  };

  const openNewItem = (sectionId) => setEditingItem({
    sectionId, type: "Article", title: "", estMinutes: 15, isFreePreview: false,
    countsTowardCompletion: true, payload: emptyPayload.Article
  });
  const openExistingItem = async (it, sectionId) => {
    const full = await api(`/admin/items/${it.id}`);
    setEditingItem({
      sectionId, id: it.id, type: full.type, title: full.title, estMinutes: full.estMinutes,
      isFreePreview: full.isFreePreview, countsTowardCompletion: full.countsTowardCompletion, payload: full.payload
    });
  };
  const saveItem = async () => {
    setError(null);
    const e = editingItem;
    const body = {
      type: e.type, title: e.title, estMinutes: e.estMinutes, isFreePreview: e.isFreePreview,
      countsTowardCompletion: e.countsTowardCompletion, payload: e.payload,
      order: e.id ? (c.sections.flatMap(s => s.items).find(i => i.id === e.id)?.order ?? 1)
                  : (c.sections.find(s => s.id === e.sectionId)?.items.length || 0) + 1
    };
    try {
      if (e.id) await api(`/admin/items/${e.id}`, { method: "PUT", body });
      else await api(`/admin/sections/${e.sectionId}/items`, { method: "POST", body });
      setEditingItem(null); load();
    } catch (err) { setError(err.message); }
  };
  const deleteItem = async (iid) => { if (confirm("Delete this item?")) { await api(`/admin/items/${iid}`, { method: "DELETE" }); load(); } };
  const moveItem = async (section, idx, dir) => {
    const ids = section.items.map(i => i.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    await api(`/admin/sections/${section.id}/items/reorder`, { method: "POST", body: { orderedIds: ids } });
    load();
  };

  if (!c || !meta) return <p className="max-w-5xl mx-auto p-8 font-mono text-haze">{error || "Loading…"}</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin" className="font-mono text-xs text-haze hover:text-paper">← Studio</Link>
          <h1 className="font-display text-3xl mt-1">{c.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`tag ${c.status === "Published" ? "border-radar/50 text-radar" : "border-haze/50 text-haze"}`}>{c.status}</span>
          <button className={c.status === "Published" ? "btn-ghost" : "btn-amber"} onClick={togglePublish}>
            {c.status === "Published" ? "Unpublish" : "Publish course"}
          </button>
        </div>
      </div>
      {error && <p className="font-mono text-sm text-amber">{error}</p>}

      {/* Meta */}
      <section className="card p-6 space-y-4">
        <p className="label">Course details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Title</label><input className="input" value={meta.title} onChange={e => setMeta({ ...meta, title: e.target.value })} /></div>
          <div><label className="label">Slug</label><input className="input" value={meta.slug} onChange={e => setMeta({ ...meta, slug: e.target.value })} /></div>
        </div>
        <div><label className="label">Subtitle</label><input className="input" value={meta.subtitle} onChange={e => setMeta({ ...meta, subtitle: e.target.value })} /></div>
        <div><label className="label">Description (Markdown — the course landing page)</label>
          <textarea className="input min-h-[180px] font-mono text-sm" value={meta.descriptionMarkdown} onChange={e => setMeta({ ...meta, descriptionMarkdown: e.target.value })} /></div>
        <div className="grid sm:grid-cols-4 gap-4">
          <div><label className="label">Category</label><input className="input" value={meta.category} onChange={e => setMeta({ ...meta, category: e.target.value })} /></div>
          <div><label className="label">Level</label>
            <select className="input" value={meta.level} onChange={e => setMeta({ ...meta, level: e.target.value })}>
              {["Beginner", "Intermediate", "Advanced", "Expert"].map(l => <option key={l}>{l}</option>)}
            </select></div>
          <div><label className="label">Language</label><input className="input" value={meta.language} onChange={e => setMeta({ ...meta, language: e.target.value })} /></div>
          <div><label className="label">Weeks</label><input className="input" type="number" value={meta.weeksEstimate} onChange={e => setMeta({ ...meta, weeksEstimate: Number(e.target.value) })} /></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          <ListEditor label="Outcomes" items={meta.outcomes} placeholder="Learners will be able to…" onChange={v => setMeta({ ...meta, outcomes: v })} />
          <ListEditor label="Prerequisites" items={meta.prerequisites} placeholder="Required before starting…" onChange={v => setMeta({ ...meta, prerequisites: v })} />
          <ListEditor label="Target audience" items={meta.targetAudience} placeholder="Built for…" onChange={v => setMeta({ ...meta, targetAudience: v })} />
        </div>
        <button className="btn-green" onClick={saveMeta}>{saved ? "Saved ✓" : "Save details"}</button>
      </section>

      {/* Curriculum */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">Curriculum</h2>
          <button className="btn-amber" onClick={() => setNewSection(v => !v)}>+ Section</button>
        </div>

        {newSection && (
          <div className="card p-4 mb-4 grid sm:grid-cols-5 gap-3 items-end">
            <div><label className="label">Code</label><input className="input" placeholder="M1" value={sectionForm.code} onChange={e => setSectionForm({ ...sectionForm, code: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">Title</label><input className="input" value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })} /></div>
            <div><label className="label">Week range</label><input className="input" placeholder="Weeks 1–3" value={sectionForm.weekRange} onChange={e => setSectionForm({ ...sectionForm, weekRange: e.target.value })} /></div>
            <button className="btn-green" onClick={addSection} disabled={!sectionForm.title}>Add</button>
          </div>
        )}

        <div className="space-y-4">
          {c.sections.map((s, si) => (
            <div key={s.id} className="card">
              <div className="p-4 flex items-center gap-3 border-b border-edge">
                <span className="font-mono text-amber text-sm">{s.code}</span>
                <span className="flex-1 font-medium">{s.title}</span>
                <div className="font-mono text-xs flex gap-2">
                  <button className="btn-ghost !px-2 !py-1" onClick={() => moveSection(si, -1)}>↑</button>
                  <button className="btn-ghost !px-2 !py-1" onClick={() => moveSection(si, 1)}>↓</button>
                  <button className="btn-ghost !px-2 !py-1" onClick={() => openNewItem(s.id)}>+ Item</button>
                  <button className="btn-ghost !px-2 !py-1 hover:text-amber" onClick={() => deleteSection(s.id)}>✕</button>
                </div>
              </div>
              <ul>
                {s.items.map((it, ii) => (
                  <li key={it.id} className="px-4 py-2 flex items-center gap-3 border-b border-edge/40 last:border-0 text-sm">
                    <span className="tag border-edge text-haze !text-[10px]">{it.type}</span>
                    <button className="flex-1 text-left hover:text-amber truncate" onClick={() => openExistingItem(it, s.id)}>{it.title}</button>
                    {it.isFreePreview && <span className="tag border-sky/50 text-sky !text-[10px]">Preview</span>}
                    <span className="font-mono text-xs text-haze">{it.estMinutes}m</span>
                    <button className="btn-ghost !px-2 !py-0.5" onClick={() => moveItem(s, ii, -1)}>↑</button>
                    <button className="btn-ghost !px-2 !py-0.5" onClick={() => moveItem(s, ii, 1)}>↓</button>
                    <button className="btn-ghost !px-2 !py-0.5 hover:text-amber" onClick={() => deleteItem(it.id)}>✕</button>
                  </li>
                ))}
                {s.items.length === 0 && <li className="px-4 py-3 text-haze text-sm">Empty section — add the first item.</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Item editor drawer */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setEditingItem(null)}>
          <div className="w-full max-w-2xl bg-panel border-l border-edge h-full overflow-y-auto p-6 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">{editingItem.id ? "Edit item" : "New item"}</h3>
              <button className="btn-ghost !px-3" onClick={() => setEditingItem(null)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Type</label>
                <select className="input" value={editingItem.type} disabled={!!editingItem.id}
                  onChange={e => setEditingItem({ ...editingItem, type: e.target.value, payload: emptyPayload[e.target.value] })}>
                  {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
                </select></div>
              <div><label className="label">Est. minutes</label>
                <input className="input" type="number" value={editingItem.estMinutes}
                  onChange={e => setEditingItem({ ...editingItem, estMinutes: Number(e.target.value) })} /></div>
            </div>
            <div><label className="label">Title</label>
              <input className="input" value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} /></div>
            <div className="flex gap-6 font-mono text-sm">
              <label className="flex items-center gap-2 text-haze">
                <input type="checkbox" className="accent-amber" checked={editingItem.isFreePreview}
                  onChange={e => setEditingItem({ ...editingItem, isFreePreview: e.target.checked })} /> Free preview</label>
              <label className="flex items-center gap-2 text-haze">
                <input type="checkbox" className="accent-radar" checked={editingItem.countsTowardCompletion}
                  onChange={e => setEditingItem({ ...editingItem, countsTowardCompletion: e.target.checked })} /> Counts toward completion</label>
            </div>
            <PayloadEditor type={editingItem.type} payload={editingItem.payload}
              setPayload={p => setEditingItem({ ...editingItem, payload: p })} />
            {error && <p className="font-mono text-sm text-amber">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button className="btn-amber" onClick={saveItem} disabled={!editingItem.title}>Save item</button>
              <button className="btn-ghost" onClick={() => setEditingItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
