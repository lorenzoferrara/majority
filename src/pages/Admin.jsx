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
      setMessage("Poll created.");
      setMonth("");
      setStatus("DRAFT");
      setOptions([""]);
    } else {
      const data = await res.json();
      setMessage("Error: " + data.error);
    }

    setLoading(false);
  }

  const inputClass = "w-full bg-transparent border-b border-graphite-700 pb-2.5 text-sm text-parchment-100 placeholder-graphite-600 focus:outline-none focus:border-gold-600 transition-colors duration-200";
  const labelClass = "block text-[9px] tracking-[0.4em] uppercase text-graphite-400 mb-3";

  return (
    <main className="min-h-screen bg-graphite-950 px-8 py-20">
      <div className="max-w-xs mx-auto">

        <header className="mb-14">
          <p className="text-[9px] tracking-[0.5em] uppercase text-gold-600 font-medium mb-5">Administration</p>
          <h1 className="font-display text-5xl font-semibold text-parchment-100 leading-none">New Poll</h1>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-9">

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
              className={`${inputClass} appearance-none cursor-pointer`}
            >
              <option value="DRAFT" className="bg-graphite-900 text-parchment-200">DRAFT</option>
              <option value="OPEN" className="bg-graphite-900 text-parchment-200">OPEN</option>
              <option value="CLOSED" className="bg-graphite-900 text-parchment-200">CLOSED</option>
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
                    required
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-graphite-600 hover:text-graphite-400 transition-colors pb-2.5 text-lg leading-none shrink-0"
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
              className="mt-5 text-[9px] tracking-[0.4em] uppercase text-gold-600 hover:text-gold-500 font-medium transition-colors"
            >
              + Add book
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3.5 bg-gold-600 text-graphite-950 text-[10px] font-semibold tracking-[0.35em] uppercase hover:bg-gold-500 transition-colors disabled:opacity-40"
          >
            {loading ? "Creating…" : "Create Poll"}
          </button>
        </form>

        {message && (
          <p className={`mt-8 text-xs tracking-wide ${message.startsWith("Error") ? "text-red-400" : "text-graphite-400"}`}>
            {message}
          </p>
        )}

      </div>
    </main>
  );
}
