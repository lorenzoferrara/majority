import { useState } from "react";

export default function AdminPage() {
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [options, setOptions] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleOptionChange(index, value) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }

  function addOption() {
    setOptions([...options, ""]);
  }

  function removeOption(index) {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, status, options: options.filter(o => o.trim() !== "") }),
    });

    if (res.ok) {
      setMessage("Poll created successfully.");
      setMonth("");
      setStatus("DRAFT");
      setOptions([""]);
    } else {
      const data = await res.json();
      setMessage("Error: " + data.error);
    }

    setLoading(false);
  }

  const inputClass = "w-full px-4 py-2.5 text-sm bg-cream-50 border border-cream-300 text-ink-900 placeholder-ink-100 focus:outline-none focus:border-gold-500 transition-colors";
  const labelClass = "block text-xs font-medium tracking-widest uppercase text-ink-300 mb-1.5";

  return (
    <main className="min-h-screen bg-cream-100 px-6 py-16">
      <div className="max-w-md mx-auto">

        <header className="mb-10 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium mb-3">Administration</p>
          <h1 className="font-display text-4xl font-bold text-ink-900">New Monthly Vote</h1>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label className={labelClass}>Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Books</label>
            <div className="flex flex-col gap-2">
              {options.map((opt, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Book title #${index + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className={`${inputClass} flex-1`}
                    required
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-3 border border-cream-300 text-ink-300 hover:border-red-300 hover:text-red-600 transition-colors text-lg"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-3 text-xs tracking-wider uppercase text-gold-600 hover:text-gold-500 font-medium transition-colors underline underline-offset-4"
            >
              + Add Candidate
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3.5 bg-ink-900 text-cream-100 text-sm font-medium tracking-wide hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Poll"}
          </button>
        </form>

        {message && (
          <p className={`mt-6 text-sm text-center ${message.startsWith("Error") ? "text-red-700" : "text-green-700"}`}>
            {message}
          </p>
        )}

      </div>
    </main>
  );
}
