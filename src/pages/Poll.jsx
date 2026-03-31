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
      className={`flex items-center gap-4 py-4 border-b cursor-grab select-none transition-colors duration-150 ${
        isDragging
          ? "border-gold-700 opacity-60"
          : "border-graphite-800 hover:border-graphite-600"
      }`}
      {...attributes}
      {...listeners}
    >
      {/* rank number */}
      <span className="text-[11px] text-gold-600 font-medium tabular-nums w-4 shrink-0 select-none">
        {index + 1}
      </span>

      {/* label */}
      <div className="flex-1 min-w-0">
        <p className="font-display text-lg text-parchment-100 leading-snug">{option.label}</p>
        {option.description && (
          <p className="text-parchment-300 text-xs mt-0.5 truncate">{option.description}</p>
        )}
      </div>

      {/* drag handle */}
      <span className="text-parchment-300 text-xs shrink-0 select-none">⠿</span>
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
      <div className="min-h-screen flex items-center justify-center bg-graphite-950">
        <p className="font-display text-2xl italic text-parchment-300">Loading…</p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-graphite-950">
        <p className="font-display text-xl text-parchment-300">{error}</p>
      </div>
    );
  }

  if (poll?.status === "DRAFT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-graphite-950">
        <p className="font-display text-xl italic text-parchment-300">Poll not open yet.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-graphite-950 px-8 py-20">
      <div className="max-w-lg mx-auto">

        <header className="mb-14">
          <p className="text-[9px] tracking-[0.5em] uppercase text-gold-600 font-medium mb-5">Your Ballot</p>
          <h1 className="font-display text-5xl font-semibold text-parchment-100 leading-none">{poll.month}</h1>
          <p className="text-[10px] tracking-[0.25em] uppercase text-parchment-300 mt-4">Drag to rank · Submit when ready</p>
        </header>

        {poll.status === "CLOSED" ? (
          <div className="py-12 border-t border-graphite-800">
            <p className="font-display text-xl italic text-parchment-300 mb-6">Voting is now closed.</p>
            <Link
              to={`/results/${poll.id}`}
              className="text-[10px] tracking-[0.35em] uppercase text-gold-600 hover:text-gold-500 transition-colors"
            >
              See results →
            </Link>
          </div>
        ) : (
          <>
            {submitted && (
              <div className="mb-10 py-4 border-t border-b border-graphite-800 flex items-center justify-between gap-4">
                <span className="text-xs text-parchment-200 tracking-wide">Vote recorded.</span>
                <Link
                  to={`/results/${poll.id}`}
                  className="text-[9px] tracking-[0.35em] uppercase text-gold-600 hover:text-gold-500 transition-colors shrink-0"
                >
                  See results →
                </Link>
              </div>
            )}

            {error && (
              <p className="mb-6 text-[11px] text-red-400">{error}</p>
            )}

            {submitted ? (
              <div className="flex flex-col opacity-40 pointer-events-none select-none">
                {ranking.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-4 py-4 border-b border-graphite-800">
                    <span className="text-[11px] text-gold-600 font-medium tabular-nums w-4 shrink-0">{index + 1}</span>
                    <p className="font-display text-lg text-parchment-100 leading-snug">{option.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={ranking.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col">
                    {ranking.map((option, index) => (
                      <SortableOption key={option.id} option={option} index={index} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {confirming && (
              <div className="mt-10 pt-8 border-t border-graphite-800">
                <p className="font-display text-2xl text-parchment-100 mb-1">Are you sure?</p>
                <p className="text-sm text-parchment-300 font-light mb-7">Your ballot cannot be changed after submission.</p>
                <div className="flex gap-5">
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-[9px] tracking-[0.35em] uppercase text-parchment-300 hover:text-parchment-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="text-[9px] tracking-[0.35em] uppercase text-gold-600 hover:text-gold-500 transition-colors disabled:opacity-40 font-medium"
                  >
                    {submitting ? "Submitting…" : "Confirm"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between">
              <Link to="/polls" className="text-[9px] tracking-[0.35em] uppercase text-parchment-300 hover:text-parchment-100 transition-colors">
                ← Back
              </Link>
              {!submitted && !confirming && (
                <button
                  onClick={() => setConfirming(true)}
                  className="py-3 px-8 bg-gold-600 text-graphite-950 text-[10px] font-semibold tracking-[0.35em] uppercase hover:bg-gold-500 transition-colors"
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
