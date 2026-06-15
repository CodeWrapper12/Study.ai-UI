"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState } from "react";

let mermaidPromise = null;
function loadMermaid() {
  mermaidPromise ??= new Promise((resolve) => {
    if (window.mermaid) return resolve(window.mermaid);
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    s.onload = () => {
      window.mermaid.initialize({
        startOnLoad: false, theme: "dark",
        themeVariables: { primaryColor: "#18212F", primaryTextColor: "#EDF2FA", primaryBorderColor: "#FFB547", lineColor: "#8FA0B8", fontFamily: "IBM Plex Mono" }
      });
      resolve(window.mermaid);
    };
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return mermaidPromise;
}

function Mermaid({ code }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadMermaid().then(async (m) => {
      if (!m || !live) return setFailed(!m);
      try {
        const { svg } = await m.render(`mmd-${Math.random().toString(36).slice(2)}`, code);
        if (live && ref.current) ref.current.innerHTML = svg;
      } catch { if (live) setFailed(true); }
    });
    return () => { live = false; };
  }, [code]);
  if (failed) return <pre><code>{code}</code></pre>;
  return <div ref={ref} className="my-4 flex justify-center [&_svg]:max-w-full" />;
}

export default function Markdown({ children }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children: kids, ...props }) {
            const text = String(kids ?? "");
            if (!inline && /language-mermaid/.test(className || "")) return <Mermaid code={text} />;
            return <code className={className} {...props}>{kids}</code>;
          }
        }}
      >
        {children || ""}
      </ReactMarkdown>
    </div>
  );
}
