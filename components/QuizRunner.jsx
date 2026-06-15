"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function QuizRunner({ item, onCompleted }) {
  const questions = item.payload?.questions || [];
  const [answers, setAnswers] = useState({}); // qid -> Set of option ids
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const toggle = (q, optId) => {
    setAnswers(prev => {
      const next = { ...prev };
      const set = new Set(next[q.id] || []);
      if (q.kind === "multi") {
        set.has(optId) ? set.delete(optId) : set.add(optId);
      } else {
        set.clear(); set.add(optId);
      }
      next[q.id] = set;
      return next;
    });
  };

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const res = await api(`/items/${item.id}/quiz-attempt`, {
        method: "POST",
        body: { answers: questions.map(q => ({ questionId: q.id, optionIds: [...(answers[q.id] || [])] })) }
      });
      setResult(res);
      if (res.passed) onCompleted?.(res);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const per = result ? Object.fromEntries(result.perQuestion.map(p => [p.questionId, p])) : {};

  return (
    <div className="space-y-6">
      <p className="font-mono text-sm text-haze">
        {questions.length} questions · pass at {item.payload?.passPercent}% · retake any time
        {item.bestScorePercent != null && <span className="text-radar"> · best: {item.bestScorePercent}%</span>}
      </p>

      {questions.map((q, qi) => {
        const verdict = per[q.id];
        return (
          <div key={q.id} className={`card p-5 ${verdict ? (verdict.correct ? "border-radar/50" : "border-amber/50") : ""}`}>
            <p className="font-medium mb-1">{qi + 1}. {q.text}</p>
            {q.kind === "multi" && <p className="label">Select all that apply</p>}
            <div className="space-y-2 mt-3">
              {q.options.map(o => {
                const selected = answers[q.id]?.has(o.id);
                return (
                  <button
                    key={o.id}
                    disabled={!!result}
                    onClick={() => toggle(q, o.id)}
                    className={`w-full text-left px-3 py-2 rounded border font-body text-sm transition-colors
                      ${selected ? "border-amber bg-amber/10 text-paper" : "border-edge bg-board text-paper/80 hover:border-haze"}`}
                  >
                    <span className="font-mono text-xs mr-2 text-haze">{q.kind === "multi" ? (selected ? "▣" : "▢") : (selected ? "●" : "○")}</span>
                    {o.text}
                  </button>
                );
              })}
            </div>
            {verdict && (
              <div className="mt-3 text-sm">
                <p className={`font-mono ${verdict.correct ? "text-radar" : "text-amber"}`}>
                  {verdict.correct ? "✓ Correct" : "✗ Incorrect"}
                </p>
                {verdict.explanation && <p className="text-haze mt-1">{verdict.explanation}</p>}
              </div>
            )}
          </div>
        );
      })}

      {error && <p className="font-mono text-sm text-amber">{error}</p>}

      {!result ? (
        <button className="btn-amber" onClick={submit} disabled={busy || Object.keys(answers).length < questions.length}>
          {busy ? "Grading…" : "Submit answers"}
        </button>
      ) : (
        <div className={`board p-5 flap ${result.passed ? "" : "opacity-95"}`}>
          <p className="board-row text-xl">
            {result.passed ? "PASSED" : "NOT YET"} — {result.score}% ({result.correct}/{result.total})
          </p>
          {result.xpAwarded > 0 && <p className="font-mono text-radar text-sm mt-1">+{result.xpAwarded} XP</p>}
          {!result.passed && (
            <button className="btn-ghost mt-3" onClick={() => { setResult(null); setAnswers({}); }}>
              Review the lesson, then retake
            </button>
          )}
        </div>
      )}
    </div>
  );
}
