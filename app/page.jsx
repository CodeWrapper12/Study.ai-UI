"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Stars from "@/components/Stars";

export default function Catalog() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => { api("/catalog/categories", { auth: false }).then(setCategories).catch(() => {}); }, []);
  useEffect(() => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (category) q.set("category", category);
    if (level) q.set("level", level);
    const t = setTimeout(() =>
      api(`/catalog/courses?${q}`, { auth: false }).then(setData).catch(() => setData({ items: [] })), 250);
    return () => clearTimeout(t);
  }, [search, category, level]);

  return (
    <div>
      {/* Hero: the departures board */}
      <section className="border-b border-edge bg-board">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <p className="font-mono text-xs tracking-[0.3em] text-haze mb-4">NOW BOARDING · ENGINEERING CAREERS</p>
          <h1 className="font-display text-4xl sm:text-5xl max-w-3xl leading-tight">
            Courses built like systems: <span className="text-amber">deep, graded, and shipped to mastery.</span>
          </h1>
          <p className="text-haze max-w-2xl mt-4">
            Every course here follows one loop — deep theory, code you run in the browser, explained quizzes,
            and assignments graded against real rubrics. No video padding. No certificate theater.
          </p>
          <div className="board mt-8 p-4 max-w-3xl">
            <div className="grid grid-cols-12 font-mono text-[11px] uppercase tracking-widest text-haze px-2 pb-2 border-b border-edge">
              <span className="col-span-5">Destination</span><span className="col-span-3">Track</span>
              <span className="col-span-2">Duration</span><span className="col-span-2">Status</span>
            </div>
            {[
              ["Lead / Solution Architect", "Interview + Skills", "15 wk", "BOARDING"],
              ["Big-Tech Loop", "DSA + Design", "Daily", "BOARDING"],
              ["AI-Era .NET Engineer", "Differentiator", "1 wk", "ON TIME"]
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-12 board-row text-sm px-2 py-2">
                <span className="col-span-5">{row[0]}</span><span className="col-span-3 text-paper/70">{row[1]}</span>
                <span className="col-span-2 text-paper/70">{row[2]}</span><span className="col-span-2 text-radar">{row[3]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-3 mb-8">
          <input className="input !w-72" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input !w-auto" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input !w-auto" value={level} onChange={e => setLevel(e.target.value)}>
            <option value="">All levels</option>
            {["Beginner", "Intermediate", "Advanced", "Expert"].map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {!data && <p className="font-mono text-haze">Loading the board…</p>}
        {data?.items?.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-mono text-haze">No courses match. Clear a filter, or check back — new routes open regularly.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {data?.items?.map(c => (
            <Link key={c.id} href={`/courses/${c.slug}`} className="card overflow-hidden hover:border-amber/60 transition-colors group">
              <div className="board !rounded-none !border-x-0 !border-t-0 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-haze">{c.category}</p>
                <p className="board-row text-lg mt-1 group-hover:flap">{c.title}</p>
              </div>
              <div className="p-4">
                <p className="text-sm text-haze line-clamp-2">{c.subtitle}</p>
                <div className="flex items-center gap-3 mt-4 font-mono text-xs text-haze">
                  <span className="tag border-edge">{c.level}</span>
                  <span>{c.weeksEstimate} weeks</span>
                  <span>{c.itemCount} lessons</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-mono text-xs text-haze">by {c.instructor}</span>
                  {c.rating
                    ? <span className="flex items-center gap-2"><Stars value={c.rating} size="text-sm" /><span className="font-mono text-xs text-haze">({c.reviewCount})</span></span>
                    : <span className="font-mono text-xs text-haze">New</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
