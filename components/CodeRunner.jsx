"use client";
import { useState, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import Markdown from "./Markdown";
import { api } from "@/lib/api";

let pyodidePromise = null;
function loadPyodide() {
  pyodidePromise ??= new Promise((resolve, reject) => {
    if (window.loadPyodide) {
      window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" }).then(resolve, reject);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
    s.onload = () => window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" }).then(resolve, reject);
    s.onerror = () => reject(new Error("Could not load the Python runtime. Check your connection."));
    document.head.appendChild(s);
  });
  return pyodidePromise;
}

const dark = {
  background: "#0B1019", foreground: "#EDF2FA", caret: "#FFB547",
  selection: "rgba(255,181,71,.25)", lineHighlight: "rgba(255,255,255,.03)"
};

export default function CodeRunner({ item, onCompleted }) {
  const p = item.payload;
  const [code, setCode] = useState(p.starterCode || "");
  const [output, setOutput] = useState(null);
  const [verdict, setVerdict] = useState(null); // null | 'pass' | 'fail' | 'error'
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [solution, setSolution] = useState(p.solutionCode || null);
  const isPython = (p.language || "").toLowerCase() === "python";

  const run = useCallback(async () => {
    setRunning(true); setOutput(null); setVerdict(null);
    try {
      const py = await loadPyodide();
      let captured = "";
      py.setStdout({ batched: (t) => { captured += t + "\n"; } });
      py.setStderr({ batched: (t) => { captured += t + "\n"; } });
      try {
        await py.runPythonAsync(code);
      } catch (err) {
        setOutput(captured + String(err));
        setVerdict("error");
        setRunning(false);
        return;
      }
      setOutput(captured);
      const test = p.tests?.[0];
      if (test) {
        const norm = (s) => s.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trimEnd();
        const pass = norm(captured) === norm(test.expectedStdout);
        setVerdict(pass ? "pass" : "fail");
        if (pass && !item.completed) {
          try {
            const res = await api(`/items/${item.id}/complete`, { method: "POST" });
            const fresh = await api(`/items/${item.id}`);
            if (fresh?.payload?.solutionCode) setSolution(fresh.payload.solutionCode);
            onCompleted?.(res);
          } catch { /* unauthenticated preview */ }
        }
      } else {
        setVerdict("pass");
      }
    } catch (err) {
      setOutput(String(err.message || err));
      setVerdict("error");
    }
    setRunning(false);
  }, [code, p, item, onCompleted]);

  return (
    <div className="space-y-4">
      <Markdown>{p.promptMarkdown}</Markdown>

      {!isPython && (
        <p className="text-haze text-sm font-mono">
          This exercise is in {p.language}. Run it locally and verify against the expected output below.
        </p>
      )}

      <div className="board overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-edge">
          <span className="font-mono text-xs uppercase tracking-widest text-haze">{p.language} · in-browser runner</span>
          <div className="flex gap-2">
            {p.hintMarkdown && (
              <button className="btn-ghost !py-1 !text-xs" onClick={() => setShowHint(v => !v)}>
                {showHint ? "Hide hint" : "Hint"}
              </button>
            )}
            {isPython && (
              <button className="btn-amber !py-1 !text-xs" onClick={run} disabled={running}>
                {running ? "Running…" : "▶ Run & verify"}
              </button>
            )}
          </div>
        </div>
        <CodeMirror
          value={code}
          height="320px"
          theme="dark"
          extensions={[python()]}
          onChange={setCode}
          basicSetup={{ lineNumbers: true, autocompletion: false }}
          style={{ background: dark.background, fontSize: 14 }}
        />
      </div>

      {showHint && p.hintMarkdown && (
        <div className="card p-4 border-sky/40">
          <p className="label !text-sky">Hint</p>
          <Markdown>{p.hintMarkdown}</Markdown>
        </div>
      )}

      {output !== null && (
        <div className="board p-4">
          <p className="label">Output</p>
          <pre className="font-mono text-sm text-paper/90 whitespace-pre-wrap">{output || "(no output)"}</pre>
        </div>
      )}

      {verdict === "pass" && (
        <div className="card p-4 border-radar/50 flap">
          <p className="font-mono text-radar">✓ VERIFIED — output matches. Exercise complete.</p>
        </div>
      )}
      {verdict === "fail" && (
        <div className="card p-4 border-amber/50">
          <p className="font-mono text-amber mb-2">✗ Output doesn't match yet.</p>
          <p className="label">Expected</p>
          <pre className="font-mono text-sm text-haze whitespace-pre-wrap">{p.tests?.[0]?.expectedStdout}</pre>
        </div>
      )}
      {verdict === "error" && (
        <p className="font-mono text-sm text-amber">The code raised an error — read the traceback above.</p>
      )}

      {solution && (
        <details className="card p-4">
          <summary className="font-mono text-sm text-haze cursor-pointer">Model solution (unlocked)</summary>
          <pre className="font-mono text-sm text-paper/90 whitespace-pre-wrap mt-3">{solution}</pre>
        </details>
      )}
    </div>
  );
}
