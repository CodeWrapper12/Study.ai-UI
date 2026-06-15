"use client";
import { useEffect, useState, use } from "react";
import { api } from "@/lib/api";

export default function Verify({ params }) {
  const { code } = use(params);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api(`/certificates/${code}`, { auth: false }).then(setCert).catch(e => setError(e.message));
  }, [code]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      {error && (
        <div className="card p-8 text-center">
          <p className="font-mono text-amber">This certificate code is not on record.</p>
        </div>
      )}
      {cert && (
        <div className="board p-10 max-w-lg w-full text-center flap">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-haze">Verified credential</p>
          <p className="board-row text-2xl mt-4">{cert.displayName}</p>
          <p className="text-haze mt-2">completed</p>
          <p className="font-display text-xl mt-2">{cert.courseTitle}</p>
          <p className="font-mono text-sm text-radar mt-5">{cert.code}</p>
          <p className="font-mono text-xs text-haze mt-1">Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
