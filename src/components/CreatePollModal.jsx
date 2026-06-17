import { useState } from "react";
import { useNavigate } from "react-router-dom";

function emptyBookOption() {
  return { label: "", author: "", pageLength: "", goodreadsScore: "" };
}

export default function CreatePollModal({ onClose, onPollCreated }) {
  const navigate = useNavigate();
  const [pollNameMode, setPollNameMode] = useState("month");
  const [month, setMonth] = useState("");
  const [customName, setCustomName] = useState("");
  const [options, setOptions] = useState([emptyBookOption()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleOptionChange(index, field, value) {
    const next = [...options];
    next[index] = { ...next[index], [field]: value };
    setOptions(next);
  }

  function addOption() {
    setOptions((prev) => [...prev, emptyBookOption()]);
  }

  function removeOption(index) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const pollName = pollNameMode === "month" ? month : customName;
    if (!pollName || !pollName.trim()) {
      setError("Poll name is required");
      setSaving(false);
      return;
    }

    const payloadOptions = options
      .map((option) => ({
        label: option.label.trim(),
        author: option.author.trim() || null,
        pageLength: option.pageLength === "" ? null : Number.parseInt(option.pageLength, 10),
        goodreadsScore: option.goodreadsScore === "" ? null : Number.parseFloat(option.goodreadsScore),
      }))
      .filter((option) => option.label);

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ month: pollName, status: "OPEN", options: payloadOptions }),
      });

      if (res.status === 401) {
        navigate("/sign-in", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to create poll (${res.status})`);
      }

      onPollCreated(data);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create poll");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-transparent border-b border-pastel-border pb-2 sm:pb-2.5 text-xs sm:text-sm text-pastel-ink placeholder-[#8d8074] focus:outline-none focus:border-pastel-gold transition-colors duration-200";
  const labelClass = "block text-[9px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-pastel-muted mb-2 sm:mb-3";
  const optionCardClass = "border border-[#e9dfd4] bg-[linear-gradient(140deg,#fffdf9_0%,#f7efe2_100%)] px-3 sm:px-4 py-3 sm:py-4 shadow-[0_14px_32px_-24px_rgba(91,32,0,0.65)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-6">
      <button
        type="button"
        aria-label="Close create dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
      />
      <div className="relative w-full max-w-2xl border border-pastel-border bg-pastel-card px-4 sm:px-8 py-5 sm:py-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.35em] uppercase text-pastel-gold font-semibold mb-2">Create Poll</p>
            <p className="font-display text-2xl sm:text-3xl text-pastel-ink leading-tight">New Reading Vote</p>
            <p className="text-xs sm:text-sm text-pastel-mid mt-1">Choose a month or custom title, then add your books.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] sm:text-[11px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-pastel-mid hover:text-pastel-gold transition-colors"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 sm:space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pollNameMode"
                  value="month"
                  checked={pollNameMode === "month"}
                  onChange={() => setPollNameMode("month")}
                  className="w-4 h-4"
                />
                <span className="text-xs sm:text-sm text-pastel-mid">Month</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pollNameMode"
                  value="custom"
                  checked={pollNameMode === "custom"}
                  onChange={() => setPollNameMode("custom")}
                  className="w-4 h-4"
                />
                <span className="text-xs sm:text-sm text-pastel-mid">Custom Name</span>
              </label>
            </div>

            {pollNameMode === "month" ? (
              <>
                <label className={labelClass}>Month</label>
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass} required />
              </>
            ) : (
              <>
                <label className={labelClass}>Poll Name</label>
                <input type="text" placeholder="e.g. Winter Reading 2026" value={customName} onChange={(e) => setCustomName(e.target.value)} className={inputClass} required />
              </>
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-2 mb-1 sm:mb-2">
              <label className={labelClass}>Books</label>
            </div>

            <div className="flex flex-col gap-4 sm:gap-5">
              {options.map((opt, index) => (
                <div key={index} className={optionCardClass}>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                    <div className="sm:col-span-12">
                      <input
                        type="text"
                        placeholder={`Book Name`}
                        value={opt.label}
                        onChange={(e) => handleOptionChange(index, "label", e.target.value)}
                        className={inputClass}
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

                    <div className="sm:col-span-2">
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

                    <div className="sm:col-span-4">
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.01"
                        placeholder="Goodreads Score"
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
                        className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-pastel-mid hover:text-pastel-ink transition-colors"
                      >
                        Remove book
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-pastel-gold hover:opacity-70 font-medium transition-opacity"
            >
              + Add book
            </button>
          </div>

          {error && <p className="text-sm text-pastel-rose">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-pastel-mid border border-pastel-border px-3 sm:px-4 py-2 hover:border-pastel-gold hover:text-pastel-gold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-pastel-card bg-pastel-ink px-3 sm:px-4 py-2 hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
