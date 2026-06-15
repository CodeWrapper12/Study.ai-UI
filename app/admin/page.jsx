"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getSession } from "@/lib/api";

export default function Studio() {
  const router = useRouter();
  const [courses, setCourses] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ slug: "", title: "" });
  const [error, setError] = useState(null);

  const load = () => api("/admin/courses").then(setCourses).catch(e => setError(e.message));
  useEffect(() => {
    const s = getSession();
    if (!s || (s.user.role !== "Admin" && s.user.role !== "Instructor")) { router.push("/login?next=/admin"); return; }
    load();
  }, []);

  const create = async () => {
    setError(null);
    try {
      const res = await api("/admin/courses", {
        method: "POST",
        body: {
          slug: form.slug, title: form.title, subtitle: "", descriptionMarkdown: "",
          category: "Engineering", level: "Advanced", language: "English",
          thumbnailUrl: null, promoVideoUrl: null, weeksEstimate: 4,
          outcomes: [], prerequisites: [], targetAudience: []
        }
      });
      router.push(`/admin/courses/${res.id}`);
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-haze">STUDIO</p>
          <h1 className="font-display text-3xl mt-1">Courses</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/submissions" className="btn-ghost">Grading queue</Link>
          <Link href="/admin/users" className="btn-ghost">Users</Link>
          <button className="btn-amber" onClick={() => setCreating(v => !v)}>+ New course</button>
        </div>
      </div>

      {creating && (
        <div className="card p-5 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]"><label className="label">Title</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="flex-1 min-w-[200px]"><label className="label">Slug (URL)</label>
            <input className="input" placeholder="my-course" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
          <button className="btn-green" onClick={create} disabled={!form.slug || !form.title}>Create draft</button>
        </div>
      )}
      {error && <p className="font-mono text-sm text-amber mb-4">{error}</p>}

      <div className="space-y-3">
        {courses?.map(c => (
          <Link key={c.id} href={`/admin/courses/${c.id}`} className="card p-4 flex items-center gap-4 hover:border-amber/60">
            <span className={`tag ${c.status === "Published" ? "border-radar/50 text-radar" : "border-haze/50 text-haze"}`}>{c.status}</span>
            <span className="flex-1">
              <span className="font-medium">{c.title}</span>
              <span className="block font-mono text-xs text-haze">/{c.slug} · {c.sections} sections · {c.items} items</span>
            </span>
            <span className="font-mono text-xs text-haze">edited {new Date(c.updatedAt).toLocaleDateString()}</span>
          </Link>
        ))}
        {courses?.length === 0 && <p className="text-haze">No courses yet — create your first.</p>}
      </div>
    </div>
  );
}
