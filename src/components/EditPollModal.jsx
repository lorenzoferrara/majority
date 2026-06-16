import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function isDateMonth(str) {
  return /^\d{4}-\d{2}$/.test(str) || str.includes("Demo");
}

function formatMonth(monthStr) {
  if (!isDateMonth(monthStr)) {
    return monthStr;
  }
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

function toFieldValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

export default function EditPollModal({ poll, onClose, onPollUpdated }) {
  const navigate = useNavigate();
  const [options, setOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initial = (poll.options || []).map((option) => ({
      id: option.id,
      label: option.label || "",
      author: option.author || "",
      pageLength: toFieldValue(option.pageLength),
      goodreadsScore: toFieldValue(option.goodreadsScore),
    }));
    setOptions(initial.length > 0 ? initial : [{ label: "", author: "", pageLength: "", goodreadsScore: "" }]);
    setError("");
  }, [poll.id]);

  function handleOptionChange(index, field, value) {
    const next = [...options];
    next[index] = { ...next[index], [field]: value };
    setOptions(next);
  }

  function addOption() {
    setOptions((prev) => [...prev, { label: "", author: "", pageLength: "", goodreadsScore: "" }]);
  }

  function removeOption(index) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payloadOptions = options.map((option) => ({
        id: option.id,
        label: option.label,
        author: option.author,
        pageLength: option.pageLength,
        goodreadsScore: option.goodreadsScore,
      }));

      const res = await fetch(`/api/polls/${poll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ options: payloadOptions }),
      });

      if (res.status === 401) {
        navigate("/sign-in", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to save poll (${res.status})`);
      }

      onPollUpdated(data);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save poll");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-transparent border-b border-pastel-border pb-2 sm:pb-2.5 text-xs sm:text-sm text-pastel-ink placeholder-[#8d8074] focus:outline-none focus:border-pastel-gold transition-colors duration-200";
  const optionCardClass = "border border-[#e9dfd4] bg-[linear-gradient(140deg,#fffdf9_0%,#f7efe2_100%)] px-3 sm:px-4 py-3 sm:py-4 shadow-[0_14px_32px_-24px_rgba(91,32,0,0.65)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-6">
      <button
        type="button"
        aria-label="Close edit dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
      />
      <div className="relative w-full max-w-2xl border border-pastel-border bg-pastel-card px-4 sm:px-8 py-5 sm:py-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.35em] uppercase text-pastel-gold font-semibold mb-2">Edit Poll</p>
            <p className="font-display text-2xl sm:text-3xl text-pastel-ink leading-tight">{formatMonth(poll.month)}</p>
            <p className="text-xs sm:text-sm text-pastel-mid mt-1">Add, update, or remove books for this poll.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] sm:text-[11px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-pastel-mid hover:text-pastel-gold transition-colors"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
          {options.map((opt, index) => (
            <div key={opt.id || `new-${index}`} className={optionCardClass}>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                <div className="sm:col-span-12">
                  <input
                    type="text"
                    placeholder={`Book ${index + 1} name *`}
                    value={opt.label}
                    onChange={(e) => handleOptionChange(index, "label", e.target.value)}
                    className={inputClass}
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

          <button
            type="button"
            onClick={addOption}
            className="text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-pastel-gold hover:opacity-70 font-medium transition-opacity"
          >
            + Add book
          </button>

          {error && (
            <p className="text-sm text-pastel-rose">{error}</p>
          )}

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
              {saving ? "Saving…" : "Save Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
