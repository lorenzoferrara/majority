"use client";

import { useState } from "react";

export default function AdminPage() {
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [options, setOptions] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleOptionChange(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }

  function addOption() {
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, status, options: options.filter(o => o.trim() !== "") }),
    });

    if (res.ok) {
      setMessage("✅ Poll created!");
      setMonth("");
      setStatus("DRAFT");
      setOptions([""]);
    } else {
      const data = await res.json();
      setMessage("❌ Error: " + data.error);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <div className="bg-orange-400 text-black rounded-2xl p-8 w-full max-w-md shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Create New Poll</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="font-medium">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded px-3 py-2"
            required
          />

          <label className="font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded px-3 py-2"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <div>
            <label className="font-medium">Candidates</label>
            {options.map((opt, index) => (
              <div key={index} className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder={`Candidate #${index + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 rounded px-3 py-2"
                  required
                />
                {options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="bg-black text-orange-400 px-3 rounded hover:bg-gray-900 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="mt-2 bg-black text-orange-400 px-4 py-1 rounded hover:bg-gray-900 transition-colors"
            >
              + Add Candidate
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-orange-400 rounded py-2 font-medium hover:bg-gray-900 transition-colors mt-4"
          >
            {loading ? "Creating…" : "Create Poll"}
          </button>
        </form>

        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </main>
  );
}