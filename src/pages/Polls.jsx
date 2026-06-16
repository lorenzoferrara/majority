import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSSE } from "../hooks/useSSE";
import CreatePollModal from "../components/CreatePollModal";

export default function PollsPage() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const clubTapRef = useRef({ count: 0, lastAt: 0 });

  useSSE({ "polls-changed": loadPolls });

  function isDateMonth(str) {
    return /^\d{4}-\d{2}$/.test(str) || str.includes('Demo');
  }

  function formatMonth(monthStr) {
    if (!isDateMonth(monthStr)) {
      return monthStr;
    }
    if (monthStr.includes('Demo')) {
      const parts = monthStr.split(' – ');
      if (parts.length === 2) {
        const date = new Date(parts[1] + '-01');
        return `Demo – ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
      }
    }
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }

  function formatPollTitle(poll) {
    const base = formatMonth(poll.month);
    if ((poll.monthCount ?? 1) > 1) {
      return `${base} (${poll.monthOrdinal ?? 1})`;
    }
    return base;
  }

  function loadPolls() {
    setLoading(true);
    setError(null);
    fetch("/api/polls", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 401) {
          navigate("/sign-in", { replace: true });
          return null;
        }
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setPolls(d);
        setLoading(false);
      })
      .catch((e) => { setError(e.message || "Failed to load polls"); setLoading(false); });
  }

  useEffect(() => { loadPolls(); }, []);

  function handleBookClubTap() {
    if (showAdmin) return;

    const now = Date.now();
    const withinWindow = now - clubTapRef.current.lastAt <= 650;
    clubTapRef.current.count = withinWindow ? clubTapRef.current.count + 1 : 1;
    clubTapRef.current.lastAt = now;

    if (clubTapRef.current.count >= 3) {
      setShowAdmin(true);
      clubTapRef.current = { count: 0, lastAt: 0 };
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // Ignore network errors and still redirect to sign in.
    }
    navigate("/sign-in", { replace: true });
  }

  return (
    <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-3 sm:px-6 py-6 sm:py-12">
      <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-4 sm:px-16 py-6 sm:py-14">

        <div className="flex items-center gap-3 mb-12">
          <div className="h-px flex-1 bg-pastel-border" />
          <span
            onClick={handleBookClubTap}
            className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium select-none cursor-default"
            aria-label="Book Club"
          >
            Book Club
          </span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>

        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-3xl sm:text-5xl font-light text-pastel-ink leading-none mb-3">Monthly Votes</h1>
            <p className="text-xs sm:text-sm text-pastel-mid tracking-wide">Rank · Decide · Read</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.35em] uppercase text-pastel-gold hover:opacity-70 transition-opacity font-medium whitespace-nowrap"
            >
              + New Poll
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.35em] uppercase text-pastel-mid border border-pastel-border px-2 sm:px-4 py-1.5 sm:py-2 hover:border-pastel-gold hover:text-pastel-gold transition-colors duration-200 whitespace-nowrap"
            >
              Logout
            </button>
            {showAdmin && (
              <Link
                to="/admin"
                className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.35em] uppercase text-pastel-mid border border-pastel-border px-2 sm:px-4 py-1.5 sm:py-2 hover:border-pastel-gold hover:text-pastel-gold transition-colors duration-200 whitespace-nowrap"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        {loading && (
          <p className="text-[11px] tracking-[0.3em] uppercase text-pastel-muted py-4">Loading…</p>
        )}

        {error && (
          <div>
            <p className="text-sm text-pastel-ink mb-1">Something went wrong</p>
            <p className="text-xs text-pastel-mid mb-6">{error}</p>
            <button
              onClick={loadPolls}
              className="text-[9px] tracking-[0.35em] uppercase text-pastel-mid border border-pastel-border px-5 py-2.5 hover:border-pastel-gold hover:text-pastel-gold transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && polls.length === 0 && (
          <p className="text-sm text-pastel-mid font-light italic">No votes scheduled yet.</p>
        )}

        {!loading && !error && polls.length > 0 && (
          <>
            <div className="flex flex-col gap-3">
              {polls.map((poll) => (
                <Link
                  key={poll.id}
                  to={poll.status === "CLOSED" ? `/results/${poll.id}` : `/polls/${poll.id}`}
                  className="group flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border border-pastel-border bg-pastel-option hover:border-pastel-gold hover:bg-[#fdf8f0] transition-all duration-200 gap-2 sm:gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg sm:text-2xl text-pastel-ink group-hover:text-pastel-gold transition-colors duration-200 leading-snug">
                      {formatPollTitle(poll)}
                    </p>
                    <span className={`text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-medium mt-1 inline-block ${
                      poll.status === "OPEN" ? "text-pastel-sage"
                      : poll.status === "CLOSED" ? "text-pastel-rose"
                      : "text-pastel-muted"
                    }`}>{poll.status}</span>
                  </div>
                  <span className="text-pastel-muted group-hover:text-pastel-gold transition-colors duration-200 ml-2 shrink-0">→</span>
                </Link>
              ))}
            </div>
            <p className="mt-8 text-[11px] tracking-[0.2em] uppercase text-pastel-muted">
              {polls.length} votation{polls.length !== 1 ? "s" : ""} available
            </p>
          </>
        )}

        <p className="mt-10 text-center text-[11px] tracking-[0.2em] uppercase text-pastel-muted">
          Majority · {new Date().getFullYear()}
        </p>
      </div>

      {showCreateModal && (
        <CreatePollModal
          onClose={() => setShowCreateModal(false)}
          onPollCreated={() => loadPolls()}
        />
      )}
    </main>
  );
}