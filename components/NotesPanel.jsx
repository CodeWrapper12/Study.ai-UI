"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function NotesPanel({ itemId }) {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(null); // {id, body}
  const load = () => api(`/me/items/${itemId}/notes`).then(setNotes).catch(() => {});
  useEffect(() => { load(); }, [itemId]);

  const add = async () => {
    if (!draft.trim()) return;
    await api(`/me/items/${itemId}/notes`, { method: "POST", body: { body: draft } });
    setDraft(""); load();
  };
  const save = async () => {
    await api(`/me/notes/${editing.id}`, { method: "PUT", body: { body: editing.body } });
    setEditing(null); load();
  };
  const remove = async (id) => { await api(`/me/notes/${id}`, { method: "DELETE" }); load(); };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="input" placeholder="Capture a note for this lesson…" value={draft}
          onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <button className="btn-amber" onClick={add}>Add</button>
      </div>
      {notes.length === 0 && <p className="text-haze text-sm">No notes yet — notes are private to you and searchable from your dashboard.</p>}
      {notes.map(n => (
        <div key={n.id} className="card p-3">
          {editing?.id === n.id ? (
            <div className="space-y-2">
              <textarea className="input" value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} />
              <div className="flex gap-2">
                <button className="btn-green !py-1 !text-xs" onClick={save}>Save</button>
                <button className="btn-ghost !py-1 !text-xs" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-paper/90 whitespace-pre-wrap">{n.body}</p>
              <div className="flex gap-3 mt-2 font-mono text-xs text-haze">
                <button className="hover:text-paper" onClick={() => setEditing({ id: n.id, body: n.body })}>Edit</button>
                <button className="hover:text-amber" onClick={() => remove(n.id)}>Delete</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
