import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSSE } from "../hooks/useSSE";

function emptyBookOption() {
  return { label: "", author: "", pageLength: "", goodreadsScore: "" };
}

export default function PollsPage() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState("");
  const [options, setOptions] = useState([emptyBookOption()]);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [focusIndex, setFocusIndex] = useState(null);
  const clubTapRef = useRef({ count: 0, lastAt: 0 });
  const inputRefs = useRef([]);
  const formSectionRef = useRef(null);

  useSSE({ "polls-changed": loadPolls });

  function formatMonth(monthStr) {
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

  useEffect(() => {
    if (focusIndex !== null && inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
      setFocusIndex(null);
    }
  }, [focusIndex, options.length]);

  useEffect(() => {
    if (showForm && formSectionRef.current) {
      requestAnimationFrame(() => {
        formSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [showForm]);

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

  function handleOptionChange(index, field, value) {
    const next = [...options];
    next[index] = { ...next[index], [field]: value };
    setOptions(next);
  }

  function addOption() {
    setOptions([...options, emptyBookOption()]);
    setFocusIndex(options.length);
  }

  function removeOption(index) {
    setOptions(options.filter((_, i) => i !== index));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateMessage("");

    const payloadOptions = options
      .map((option) => ({
        label: option.label.trim(),
        author: option.author.trim() || null,
        pageLength: option.pageLength === "" ? null : Number.parseInt(option.pageLength, 10),
        goodreadsScore: option.goodreadsScore === "" ? null : Number.parseFloat(option.goodreadsScore),
      }))
      .filter((option) => option.label);

    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ month, status: "OPEN", options: payloadOptions }),
    });
    if (res.status === 401) {
      navigate("/sign-in", { replace: true });
      setCreating(false);
      return;
    }
    if (res.ok) {
      setCreateMessage("Poll created.");
      setMonth("");
      setOptions([emptyBookOption()]);
      setShowForm(false);
      loadPolls();
    } else {
      const data = await res.json();
      setCreateMessage("Error: " + data.error);
    }
    setCreating(false);
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // Ignore network errors and still redirect to sign in.
    }
    navigate("/sign-in", { replace: true });
  }

  const inputClass = "w-full bg-transparent border-b border-pastel-border pb-2 sm:pb-2.5 text-xs sm:text-sm text-pastel-ink placeholder-pastel-muted focus:outline-none focus:border-pastel-gold transition-colors duration-200";
  const labelClass = "block text-[9px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-pastel-muted mb-2 sm:mb-3";

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
              onClick={() => { setShowForm((v) => !v); setCreateMessage(""); }}
              className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.35em] uppercase text-pastel-gold hover:opacity-70 transition-opacity font-medium whitespace-nowrap"
            >
              {showForm ? "− Cancel" : "+ New Poll"}
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
                      {formatMonth(poll.month)}
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

        {showForm && (
          <div ref={formSectionRef}>
            <div className="flex items-center gap-3 my-8">
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
                <label className={labelClass}>Books</label>
                <div className="flex flex-col gap-4 sm:gap-5">
                  {options.map((opt, index) => (
                    <div key={index} className="border border-pastel-border bg-pastel-option px-3 sm:px-4 py-3 sm:py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                        <div className="sm:col-span-12">
                          <input
                            type="text"
                            placeholder={`Book ${index + 1} name`}
                            value={opt.label}
                            onChange={(e) => handleOptionChange(index, "label", e.target.value)}
                            className={inputClass}
                            ref={(el) => (inputRefs.current[index] = el)}
                            required
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <input
                            type="text"
                            placeholder="Author"
                            value={opt.author}
                            onChange={(e) => handleOptionChange(index, "author", e.target.value)}
                            className={inputClass}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Pages"
                            value={opt.pageLength}
                            onChange={(e) => handleOptionChange(index, "pageLength", e.target.value)}
                            className={inputClass}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.01"
                            placeholder="Goodreads"
                            value={opt.goodreadsScore}
                            onChange={(e) => handleOptionChange(index, "goodreadsScore", e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {options.length > 1 && (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-pastel-muted hover:text-pastel-ink transition-colors"
                          >
                            Remove book
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addOption}
                  className="mt-4 sm:mt-5 text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-pastel-gold hover:opacity-70 font-medium transition-opacity">
                  + Add book
                </button>
              </div>

              <button type="submit" disabled={creating}
                className="mt-2 w-full py-2.5 sm:py-3.5 bg-pastel-ink text-pastel-card text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] sm:tracking-[0.35em] uppercase hover:opacity-80 transition-opacity disabled:opacity-30">
                {creating ? "Creating…" : "Create Poll"}
              </button>
            </form>

            {createMessage && (
              <p className={`mt-6 text-sm tracking-wide ${createMessage.startsWith("Error") ? "text-red-500" : "text-pastel-mid"}`}>
                {createMessage}
              </p>
            )}
          </div>
        )}

        <p className="mt-10 text-center text-[11px] tracking-[0.2em] uppercase text-pastel-muted">
          Majority · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}