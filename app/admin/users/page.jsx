"use client";
import { useEffect, useState } from "react";
import { api, getSession } from "@/lib/api";

export default function Users() {
  const [users, setUsers] = useState(null);
  const isAdmin = getSession()?.user?.role === "Admin";
  const load = () => api("/admin/users").then(setUsers).catch(() => setUsers([]));
  useEffect(() => { load(); }, []);

  const setRole = async (id, role) => { await api(`/admin/users/${id}/role`, { method: "POST", body: { role } }); load(); };

  if (!users) return <p className="max-w-5xl mx-auto p-8 font-mono text-haze">Loading…</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <p className="font-mono text-xs tracking-[0.3em] text-haze">STUDIO</p>
      <h1 className="font-display text-3xl mt-1 mb-8">Users</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-edge font-mono text-xs uppercase tracking-wider text-haze text-left">
            <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">XP</th><th className="p-3">Role</th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-edge/50">
                <td className="p-3">{u.displayName}</td>
                <td className="p-3 font-mono text-haze">{u.email}</td>
                <td className="p-3 font-mono text-radar">{u.xp}</td>
                <td className="p-3">
                  {isAdmin ? (
                    <select className="input !w-auto !py-1" value={u.role} onChange={e => setRole(u.id, e.target.value)}>
                      {["Student", "Instructor", "Admin"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  ) : <span className="tag border-edge text-haze">{u.role}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
