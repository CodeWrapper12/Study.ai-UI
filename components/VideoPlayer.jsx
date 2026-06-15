"use client";
import { useEffect, useRef } from "react";
import Markdown from "./Markdown";
import { api } from "@/lib/api";

function toEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
    }
    if (u.hostname === "youtu.be") return { kind: "iframe", src: `https://www.youtube.com/embed${u.pathname}` };
    if (u.hostname.includes("vimeo.com")) return { kind: "iframe", src: `https://player.vimeo.com/video${u.pathname}` };
  } catch { /* fall through */ }
  return { kind: "file", src: url };
}

export default function VideoPlayer({ item }) {
  const p = item.payload;
  const embed = toEmbed(p.url);
  const videoRef = useRef(null);

  // Resume + periodic position save for direct video files
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (item.videoPositionSec > 0) v.currentTime = item.videoPositionSec;
    const save = setInterval(() => {
      if (!v.paused) {
        api(`/items/${item.id}/video-position`, {
          method: "POST", body: { positionSec: Math.floor(v.currentTime) }
        }).catch(() => {});
      }
    }, 10000);
    return () => clearInterval(save);
  }, [item.id, item.videoPositionSec]);

  return (
    <div className="space-y-5">
      <div className="board overflow-hidden aspect-video">
        {embed.kind === "iframe" ? (
          <iframe
            src={embed.src} title={item.title} className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video ref={videoRef} src={embed.src} controls className="w-full h-full" />
        )}
      </div>
      <p className="font-mono text-xs text-haze">
        ~{Math.round((p.durationSec || 0) / 60)} min{embed.kind === "file" ? " · position auto-saved, resumes where you left off" : ""}
      </p>
      {p.notesMarkdown && (
        <div className="card p-5">
          <p className="label">Watch notes</p>
          <Markdown>{p.notesMarkdown}</Markdown>
        </div>
      )}
    </div>
  );
}
