import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableOption({ option, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 border bg-cream-50 cursor-grab select-none transition-shadow ${
        isDragging
          ? "border-gold-400 shadow-lg opacity-80"
          : "border-cream-300 hover:border-gold-300"
      }`}
      {...attributes}
      {...listeners}
    >
      {/* rank number */}
      <span className="w-7 h-7 flex items-center justify-center border border-gold-400 text-gold-600 text-xs font-medium shrink-0">
        {index + 1}
      </span>

      {/* drag handle */}
      <span className="text-ink-100 shrink-0">⠿</span>

      {/* label */}
      <div className="flex-1 min-w-0">
        <p className="font-display text-ink-900 font-medium leading-snug">{option.label}</p>
        {option.description && (
          <p className="text-ink-300 text-xs mt-0.5 truncate">{option.description}</p>
        )}
      </div>
    </div>
  );
}

export default function Poll() {
  const { pollId } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("majority_user") ?? "null");

  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
      return;
    }

    fetch(`/api/polls/${pollId}?userId=${encodeURIComponent(user.name)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setPoll(data);

        // If user already voted, restore their previous ranking order
        if (data.existingRanking?.length) {
          const ranked = data.existingRanking
            .map((id) => data.options.find((o) => o.id === id))
            .filter(Boolean);
          setRanking(ranked);
          setSubmitted(true);
        } else {
          setRanking(data.options);
        }
      })
      .catch(() => setError("Failed to load poll."))
      .finally(() => setLoading(false));
  }, [pollId]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRanking((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.name,
          ranking: ranking.map((o) => o.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit ballot.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="font-display text-xl text-ink-300 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="font-display text-xl text-ink-500">{error}</p>
      </div>
    );
  }

  if (poll?.status === "DRAFT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="font-display text-xl text-ink-500">Poll not open yet.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream-100 px-6 py-16">
      <div className="max-w-2xl mx-auto">

        <header className="mb-10 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium mb-3">Your Ballot</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-900">{poll.month}</h1>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-gold-400" />
            <span className="text-xs text-ink-200">Drag to rank · Submit when ready</span>
            <div className="h-px w-10 bg-gold-400" />
          </div>
        </header>

        {poll.status === "CLOSED" ? (
          <div className="text-center p-10 border border-cream-300 bg-cream-50">
            <p className="text-ink-700 mb-4 font-display text-lg">Voting is now closed.</p>
            <Link
              to={`/results/${poll.id}`}
              className="text-gold-600 hover:text-gold-500 underline underline-offset-4 font-medium text-sm"
            >
              See results →
            </Link>
          </div>
        ) : (
          <>
            {submitted && (
              <div className="mb-6 px-4 py-3 border border-green-300 bg-green-50 text-green-700 text-sm flex items-center justify-between gap-4">
                <span>✓ Your vote has been recorded.</span>
                <Link
                  to={`/results/${poll.id}`}
                  className="shrink-0 px-4 py-1.5 border border-green-600 text-green-700 text-xs tracking-widest uppercase font-medium hover:bg-green-100 transition-colors"
                >
                  See results →
                </Link>
              </div>
            )}

            {error && (
              <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            {submitted ? (
              <div className="flex flex-col gap-2 opacity-60 pointer-events-none select-none">
                {ranking.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-4 p-4 border border-cream-300 bg-cream-50">
                    <span className="w-7 h-7 flex items-center justify-center border border-gold-400 text-gold-600 text-xs font-medium shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-ink-900 font-medium leading-snug">{option.label}</p>
                      {option.description && (
                        <p className="text-ink-300 text-xs mt-0.5 truncate">{option.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={ranking.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2">
                    {ranking.map((option, index) => (
                      <SortableOption key={option.id} option={option} index={index} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {confirming && (
              <div className="mt-6 p-5 border border-gold-400 bg-cream-50 text-center">
                <p className="font-display text-ink-900 text-lg mb-1">Are you sure?</p>
                <p className="text-ink-300 text-sm mb-5">Your ballot cannot be changed after submission.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-6 py-2 border border-cream-300 text-ink-400 text-xs tracking-widest uppercase hover:border-ink-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2 bg-ink-900 text-cream-100 text-xs tracking-widest uppercase font-medium hover:bg-gold-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Submitting…" : "Confirm"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Link to="/polls" className="text-xs text-ink-200 hover:text-gold-500 transition-colors">
                ← Back to polls
              </Link>
              {!submitted && !confirming && (
                <button
                  onClick={() => setConfirming(true)}
                  className="px-8 py-3 bg-ink-900 text-cream-100 text-sm tracking-widest uppercase font-medium hover:bg-gold-700 transition-colors"
                >
                  Submit Ballot
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </main>
  );
}
