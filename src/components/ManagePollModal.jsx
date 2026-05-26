import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function formatMonth(monthStr) {
  if (monthStr.includes("Demo")) {
    const parts = monthStr.split(" – ");
    if (parts.length === 2) {
      const date = new Date(parts[1] + "-01");
      return `Demo – ${date.toLocaleDateString("en-US", { year: "numeric", month: "long" })}`;
    }
  }
  const date = new Date(monthStr + "-01");
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function formatDateTime(value) {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ManagePollModal({ poll, onClose, onBallotReset }) {
  const navigate = useNavigate();
  const [ballots, setBallots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resettingBallotId, setResettingBallotId] = useState("");

  useEffect(() => {
    loadBallots();
  }, [poll.id]);

  async function loadBallots() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/polls/${poll.id}/ballots`, { credentials: "same-origin" });
      if (res.status === 401) {
        navigate("/sign-in", { replace: true });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load ballots (${res.status})`);
      }
      const data = await res.json();
      setBallots(data.ballots || []);
    } catch (err) {
      setError(err.message || "Failed to load ballots");
    } finally {
      setLoading(false);
    }
  }

  async function resetVote(ballot) {
    setResettingBallotId(ballot.id);
    try {
      const res = await fetch(`/api/polls/${ballot.pollId}/ballots/${ballot.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        navigate("/sign-in", { replace: true });
        return;
      }
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to reset vote (${res.status})`);
      }
      setBallots((prev) => prev.filter((b) => b.id !== ballot.id));
      onBallotReset(ballot.pollId);
    } catch (err) {
      setError(err.message || "Failed to reset vote");
    } finally {
      setResettingBallotId("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-6">
      <button
        type="button"
        aria-label="Close manage dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
      />
      <div className="relative w-full max-w-2xl border border-pastel-border bg-pastel-card px-4 sm:px-8 py-5 sm:py-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.35em] uppercase text-pastel-gold font-semibold mb-2">Manage Poll</p>
            <p className="font-display text-2xl sm:text-3xl text-pastel-ink leading-tight">{formatMonth(poll.month)}</p>
            <p className="text-xs sm:text-sm text-pastel-mid mt-1">Reset a ballot to let that user vote again.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] sm:text-[11px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-pastel-mid hover:text-pastel-gold transition-colors"
          >
            Close
          </button>
        </div>

        {loading && (
          <p className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase text-pastel-muted py-4">Loading ballots…</p>
        )}

        {!loading && error && (
          <div className="mb-4">
            <p className="text-sm text-pastel-ink mb-1">Could not load ballots</p>
            <p className="text-xs text-pastel-mid mb-3">{error}</p>
            <button
              onClick={loadBallots}
              className="text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.35em] uppercase text-pastel-mid border border-pastel-border px-3 sm:px-4 py-1.5 sm:py-2 hover:border-pastel-gold hover:text-pastel-gold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && ballots.length === 0 && (
          <p className="text-sm text-pastel-mid font-light italic">No votes recorded for this poll yet.</p>
        )}

        {!loading && !error && ballots.length > 0 && (
          <div className="space-y-3">
            {ballots.map((ballot) => (
              <div key={ballot.id} className="border border-pastel-border bg-pastel-option px-3 sm:px-4 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg sm:text-xl text-pastel-ink break-all">{ballot.userId}</p>
                    <p className="text-[10px] sm:text-[11px] tracking-[0.1em] uppercase text-pastel-muted mt-1">
                      Voted {formatDateTime(ballot.submittedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetVote(ballot)}
                    disabled={resettingBallotId === ballot.id}
                    className="w-full sm:w-auto text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-pastel-rose border border-pastel-rose/40 px-3 sm:px-4 py-2 hover:bg-pastel-rose hover:text-pastel-card transition-colors disabled:opacity-50"
                  >
                    {resettingBallotId === ballot.id ? "Resetting…" : "Reset Vote"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
