import { useEffect, useRef, useState } from "react";
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

const rankAccent = (i) => [
  { bar: "bg-pastel-gold",  num: "text-pastel-gold",  row: "hover:bg-amber-50" },
  { bar: "bg-pastel-sage",  num: "text-pastel-sage",  row: "hover:bg-emerald-50" },
  { bar: "bg-pastel-rose",  num: "text-pastel-rose",  row: "hover:bg-rose-50" },
][i] ?? { bar: "bg-pastel-border", num: "text-pastel-muted", row: "hover:bg-stone-50" };

const MEDALS = [
  { bg: "#FFD700", shadow: "#B8860B", text: "#7A5500" }, // gold
  { bg: "#C0C0C0", shadow: "#808080", text: "#3A3A3A" }, // silver
  { bg: "#CD7F32", shadow: "#8B4513", text: "#4B2000" }, // bronze
];

function RankBadge({ index }) {
  const medal = MEDALS[index];
  if (!medal) return (
    <span className="text-sm font-bold tabular-nums w-7 text-center shrink-0 select-none text-pastel-muted">
      {index + 1}
    </span>
  );
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 shrink-0 select-none font-bold text-sm"
      style={{
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${medal.bg}, ${medal.shadow})`,
        color: medal.text,
        boxShadow: `0 2px 4px ${medal.shadow}55`,
      }}
    >
      {index + 1}
    </span>
  );
}

function SortableOption({ option, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.id });

  const style = { transform: CSS.Transform.toString(transform), transition: isDragging ? "none" : transition };
  const accent = rankAccent(index);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 bg-[#f4f4f2] cursor-grab select-none transition-all duration-150 border-l-2 ${accent.bar.replace('bg-', 'border-')} ${
        isDragging ? "opacity-50 shadow-lg" : "hover:bg-[#eeeeeb]"
      }`}
      {...attributes}
      {...listeners}
    >
      {/* rank badge */}
      <RankBadge index={index} />

      {/* label */}
      <div className="flex-1 min-w-0">
        <p className="font-display text-lg text-pastel-ink leading-snug font-semibold">{option.label}</p>
        {option.description && (
          <p className="text-pastel-mid text-sm mt-0.5 truncate">{option.description}</p>
        )}
      </div>

      {/* drag handle */}
      <span className="text-pastel-mid text-base shrink-0 select-none">⠿</span>
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
  const confirmSectionRef = useRef(null);

  useEffect(() => {
    fetch(`/api/polls/${pollId}`, { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) {
          navigate("/sign-in", { replace: true });
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
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
  }, [navigate, pollId]);

  useEffect(() => {
    if (!confirming) return;
    confirmSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [confirming]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
  );

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
        credentials: "same-origin",
        body: JSON.stringify({
          ranking: ranking.map((o) => o.id),
        }),
      });
      if (res.status === 401) {
        navigate("/sign-in", { replace: true });
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit ballot.");
      } else {
        setConfirming(false);
        setSubmitted(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const cardClass = "min-h-screen bg-pastel-bg flex items-center justify-center px-6 py-12";
  const innerClass = "w-full max-w-2xl border border-pastel-border bg-pastel-card px-16 py-14";

  if (loading) {
    return (
      <main className={cardClass}>
        <div className={innerClass}>
          <p className="font-display text-2xl italic text-pastel-mid">Loading…</p>
        </div>
      </main>
    );
  }

  if (error && !poll) {
    return (
      <main className={cardClass}>
        <div className={innerClass}>
          <p className="font-display text-xl text-pastel-mid">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-16 py-14">

        <header className="mb-14">
          <p className="text-xs tracking-[0.5em] uppercase text-pastel-gold font-semibold mb-5">Your Ballot</p>
          <h1 className="font-display text-5xl font-bold text-pastel-ink leading-none">{poll.month}</h1>
          <p className="text-xs tracking-[0.25em] uppercase text-pastel-mid font-medium mt-4">Drag to rank · Submit when ready</p>
        </header>

        {poll.status === "CLOSED" ? (
          <div className="py-12 border-t border-pastel-border">
            <p className="font-display text-xl italic text-pastel-mid mb-6">Voting is now closed.</p>
            <Link
              to={`/results/${poll.id}`}
              className="inline-block text-[10px] tracking-[0.35em] uppercase font-bold text-white bg-pastel-sage px-5 py-2.5 hover:opacity-90 transition-opacity"
            >
              See results →
            </Link>
          </div>
        ) : (
          <>
            {submitted && (
              <div className="mb-10 py-4 border-t border-b border-pastel-border flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-pastel-ink tracking-wide">Vote recorded.</span>
                <Link
                  to={`/results/${poll.id}`}
                  className="inline-block text-[10px] tracking-[0.35em] uppercase font-bold text-white bg-pastel-sage px-5 py-2.5 hover:opacity-90 transition-opacity shrink-0"
                >
                  See results →
                </Link>
              </div>
            )}

            {error && !submitted && (
              <p className="mb-6 text-[11px] text-pastel-rose">{error}</p>
            )}

            {submitted ? (
              <div className="flex flex-col gap-2 opacity-60 pointer-events-none select-none">
                {ranking.map((option, index) => {
                  const accent = rankAccent(index);
                  return (
                    <div key={option.id} className={`flex items-center gap-3 px-4 py-3 bg-[#f4f4f2] border-l-2 ${accent.bar.replace('bg-', 'border-')}`}>
                      <RankBadge index={index} />
                      <p className="font-display text-lg font-semibold text-pastel-ink leading-snug">{option.label}</p>
                    </div>
                  );
                })}
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

            {confirming && !submitted && (
              <div ref={confirmSectionRef} className="mt-10 pt-8 border-t border-pastel-border">
                <p className="font-display text-2xl font-semibold text-pastel-ink mb-1">Are you sure?</p>
                <p className="text-sm font-medium text-pastel-mid mb-7">Your ballot cannot be changed after submission.</p>
                <div className="flex gap-5">
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-xs tracking-[0.35em] uppercase font-semibold text-pastel-mid hover:text-pastel-ink transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="text-xs tracking-[0.35em] uppercase text-pastel-gold hover:text-pastel-ink transition-colors disabled:opacity-40 font-bold"
                  >
                    {submitting ? "Submitting…" : "Confirm"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between">
              <Link to="/polls" className="text-xs tracking-[0.35em] uppercase font-semibold text-pastel-mid hover:text-pastel-ink transition-colors">
                ← Back
              </Link>
              {!submitted && !confirming && (
                <button
                  onClick={() => setConfirming(true)}
                  className="py-3 px-8 bg-pastel-ink text-pastel-card text-xs font-bold tracking-[0.35em] uppercase hover:bg-pastel-gold hover:text-pastel-ink transition-colors"
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
