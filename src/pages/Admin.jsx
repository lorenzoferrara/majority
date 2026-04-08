import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSSE } from "../hooks/useSSE";

const STATUS_CYCLE = { OPEN: "CLOSED", CLOSED: "OPEN" };
const STATUS_COLORS = {
  OPEN: "text-pastel-sage",
  CLOSED: "text-pastel-rose",
};

export default function AdminPage() {
  // ── Polls list ──────────────────────────────────────────────────────────
  const [polls, setPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(true);
  const [pollsError, setPollsError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // pollId pending deletion

  // ── Load polls ──────────────────────────────────────────────────────────
  const loadPolls = useCallback(() => {
    setPollsLoading(true);
    setPollsError(null);
    fetch("/api/polls")
      .then((r) => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then((d) => { setPolls(d); setPollsLoading(false); })
      .catch((e) => { setPollsError(e.message); setPollsLoading(false); });
  }, []);

  useEffect(() => { loadPolls(); }, [loadPolls]);
  useSSE({ "polls-changed": loadPolls });

  // ── Actions ─────────────────────────────────────────────────────────────
  async function cycleStatus(poll) {
    const next = STATUS_CYCLE[poll.status];
    const res = await fetch(`/api/polls/${poll.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) setPolls((prev) => prev.map((p) => p.id === poll.id ? { ...p, status: next } : p));
  }

  async function deletePoll(id) {
    const res = await fetch(`/api/polls/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setPolls((prev) => prev.filter((p) => p.id !== id));
      setConfirmDelete(null);
    }
  }


  return (
    <main className="min-h-screen bg-pastel-bg flex items-start justify-center px-6 py-12">
      <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-14 py-14">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium">Administration</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>

        <div className="mb-10">
          <h1 className="font-display text-5xl font-light text-pastel-ink leading-none">Polls</h1>
        </div>

        {/* ── Polls monitor ── */}
        {pollsLoading && (
          <p className="text-[11px] tracking-[0.3em] uppercase text-pastel-muted py-6">Loading…</p>
        )}
        {pollsError && (
          <div className="mb-8">
            <p className="text-sm text-pastel-ink mb-1">Could not load polls</p>
            <p className="text-xs text-pastel-mid mb-4">{pollsError}</p>
            <button onClick={loadPolls} className="text-[10px] tracking-[0.35em] uppercase text-pastel-mid border border-pastel-border px-4 py-2 hover:border-pastel-gold hover:text-pastel-gold transition-colors">Retry</button>
          </div>
        )}
        {!pollsLoading && !pollsError && polls.length === 0 && (
          <p className="text-sm text-pastel-mid font-light italic mb-10">No polls yet.</p>
        )}
        {!pollsLoading && !pollsError && polls.length > 0 && (
          <div className="mb-10">
            {polls.map((poll) => (
              <div key={poll.id} className="border-b border-pastel-border last:border-b-0 py-5">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: month + meta */}
                  <div className="min-w-0">
                    <p className="font-display text-xl text-pastel-ink leading-snug">{poll.month}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] tracking-[0.2em] uppercase font-medium ${STATUS_COLORS[poll.status]}`}>
                        {poll.status}
                      </span>
                      <span className="text-[10px] text-pastel-muted">
                        {poll._count?.ballots ?? 0} votes
                        · {poll.options?.length ?? 0} books
                      </span>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      to={`/polls/${poll.id}`}
                      className="text-[10px] tracking-[0.25em] uppercase text-pastel-mid hover:text-pastel-gold transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => cycleStatus(poll)}
                      title={`Set as ${STATUS_CYCLE[poll.status] === "OPEN" ? "Open" : "Closed"}`}
                      className="text-[10px] tracking-[0.25em] uppercase text-pastel-mid border border-pastel-border px-3 py-1.5 hover:border-pastel-gold hover:text-pastel-gold transition-colors"
                    >
                      Set as {STATUS_CYCLE[poll.status] === "OPEN" ? "Open" : "Closed"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(poll.id)}
                      className="text-[10px] tracking-[0.25em] uppercase text-pastel-muted hover:text-pastel-rose transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="mt-10 text-center text-[11px] tracking-[0.2em] uppercase text-pastel-muted">
          <Link to="/polls" className="text-[11px] tracking-[0.35em] uppercase text-pastel-mid hover:text-pastel-gold transition-colors duration-200">
            View Polls →
          </Link>
          <span className="text-pastel-border mx-3">·</span>
          Majority · {new Date().getFullYear()}
        </p>

      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <button
            type="button"
            aria-label="Close confirmation"
            onClick={() => setConfirmDelete(null)}
            className="absolute inset-0 bg-black/35"
          />
          <div className="relative w-full max-w-lg border border-pastel-border bg-pastel-card px-8 py-7 shadow-2xl">
            <p className="text-[11px] tracking-[0.35em] uppercase text-pastel-rose font-semibold mb-3">Confirm Delete</p>
            <p className="font-display text-3xl text-pastel-ink leading-tight mb-2">Delete this poll?</p>
            <p className="text-sm text-pastel-mid mb-7">
              This action cannot be undone. All ballots and rankings for this poll will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-[10px] tracking-[0.3em] uppercase text-pastel-mid border border-pastel-border px-4 py-2 hover:border-pastel-gold hover:text-pastel-gold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePoll(confirmDelete)}
                className="text-[10px] tracking-[0.3em] uppercase text-pastel-card bg-pastel-rose px-4 py-2 hover:opacity-80 transition-opacity"
              >
                Delete Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
