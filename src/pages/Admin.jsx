import { useState, useRef, useEffect, useCallback } from "react";
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

  // ── Create form ─────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState("");
  const [newStatus, setNewStatus] = useState("OPEN");
  const [options, setOptions] = useState([""]);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [focusIndex, setFocusIndex] = useState(null);
  const inputRefs = useRef([]);

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

  useEffect(() => {
    if (focusIndex !== null && inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
      setFocusIndex(null);
    }
  }, [focusIndex, options.length]);

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

  // ── Create form helpers ─────────────────────────────────────────────────
  function handleOptionChange(index, value) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  }

  function addOption() {
    setOptions([...options, ""]);
    setFocusIndex(options.length);
  }

  function removeOption(index) {
    setOptions(options.filter((_, i) => i !== index));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateMessage("");
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, status: newStatus, options: options.filter((o) => o.trim()) }),
    });
    if (res.ok) {
      setCreateMessage("Poll created.");
      setMonth(""); setNewStatus("OPEN"); setOptions([""]); setShowForm(false);
      loadPolls();
    } else {
      const data = await res.json();
      setCreateMessage("Error: " + data.error);
    }
    setCreating(false);
  }

  const inputClass = "w-full bg-transparent border-b border-pastel-border pb-2.5 text-sm text-pastel-ink placeholder-pastel-muted focus:outline-none focus:border-pastel-gold transition-colors duration-200";
  const labelClass = "block text-[11px] tracking-[0.4em] uppercase text-pastel-muted mb-3";

  return (
    <main className="min-h-screen bg-pastel-bg flex items-start justify-center px-6 py-12">
      <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-14 py-14">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium">Administration</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>

        <div className="flex items-end justify-between mb-10">
          <h1 className="font-display text-5xl font-light text-pastel-ink leading-none">Polls</h1>
          <button
            onClick={() => { setShowForm((v) => !v); setCreateMessage(""); }}
            className="text-[11px] tracking-[0.35em] uppercase text-pastel-gold hover:opacity-70 transition-opacity font-medium"
          >
            {showForm ? "− Cancel" : "+ New Poll"}
          </button>
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
                      title={`Set to ${STATUS_CYCLE[poll.status]}`}
                      className="text-[10px] tracking-[0.25em] uppercase text-pastel-mid border border-pastel-border px-3 py-1.5 hover:border-pastel-gold hover:text-pastel-gold transition-colors"
                    >
                      → {STATUS_CYCLE[poll.status]}
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

        {/* ── Create form ── */}
        {showForm && (
          <>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-pastel-border" />
              <span className="text-[11px] tracking-[0.4em] uppercase text-pastel-muted">New Poll</span>
              <div className="h-px flex-1 bg-pastel-border" />
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-9">
              <div>
                <label className={labelClass}>Month</label>
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass} required />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Books</label>
                <div className="flex flex-col gap-5">
                  {options.map((opt, index) => (
                    <div key={index} className="flex items-end gap-3">
                      <input
                        type="text"
                        placeholder={`Book ${index + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className={`${inputClass} flex-1`}
                        ref={(el) => (inputRefs.current[index] = el)}
                        required
                      />
                      {options.length > 1 && (
                        <button type="button" onClick={() => removeOption(index)}
                          className="text-pastel-muted hover:text-pastel-ink transition-colors pb-2.5 text-lg leading-none shrink-0">×</button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addOption}
                  className="mt-5 text-[11px] tracking-[0.4em] uppercase text-pastel-gold hover:opacity-70 font-medium transition-opacity">
                  + Add book
                </button>
              </div>

              <button type="submit" disabled={creating}
                className="mt-2 py-3.5 bg-pastel-ink text-pastel-card text-[11px] font-semibold tracking-[0.35em] uppercase hover:opacity-80 transition-opacity disabled:opacity-30">
                {creating ? "Creating…" : "Create Poll"}
              </button>
            </form>

            {createMessage && (
              <p className={`mt-6 text-sm tracking-wide ${createMessage.startsWith("Error") ? "text-red-500" : "text-pastel-mid"}`}>
                {createMessage}
              </p>
            )}
          </>
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
