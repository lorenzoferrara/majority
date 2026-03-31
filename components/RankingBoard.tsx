// components/RankingBoard.tsx
"use client";

/**
 * Drag-and-drop ranking interface built on @dnd-kit.
 *
 * Install:
 *   pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
 *
 * Renders two zones:
 *   - "Candidates" pool  (nominees not yet ranked)
 *   - "Your Ranking"     (ordered list of ranked nominees)
 *
 * Users drag items from the pool into the ranking list and reorder freely.
 * The ordered list is submitted as rankedOptionIds[].
 */

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useTransition } from "react";
import { submitBallot } from "@/actions/votes";

// ── Types ────────────────────────────────────────────────────────────────────

interface OptionItem {
  id: string;
  label: string;
  description?: string | null;
  imageUrl?: string | null;
}

interface Props {
  pollId: string;
  options: OptionItem[];
  existingRanking?: string[]; // pre-populated if user already voted
}

// ── SortableCard ─────────────────────────────────────────────────────────────

function SortableCard({
  item,
  rank,
  isDragging = false,
}: {
  item: OptionItem;
  rank?: number;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-3 bg-cream-50 border px-4 py-3
        cursor-grab active:cursor-grabbing select-none
        transition-colors hover:border-gold-400
        ${isDragging ? "shadow-lg border-gold-500" : "border-cream-300"}
      `}
    >
      {rank !== undefined && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-ink-900 text-xs font-bold text-cream-100 font-display">
          {rank}
        </span>
      )}
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          className="h-10 w-10 object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink-900">{item.label}</p>
        {item.description && (
          <p className="truncate text-sm text-ink-300">{item.description}</p>
        )}
      </div>
      {/* Drag handle */}
      <svg className="h-4 w-4 shrink-0 text-ink-100" fill="currentColor" viewBox="0 0 20 20">
        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
      </svg>
    </div>
  );
}

// ── RankingBoard ──────────────────────────────────────────────────────────────

export default function RankingBoard({ pollId, options, existingRanking }: Props) {
  const byId = Object.fromEntries(options.map((o) => [o.id, o]));

  const [ranked, setRanked] = useState<string[]>(existingRanking ?? []);
  const [unranked, setUnranked] = useState<string[]>(
    options.map((o) => o.id).filter((id) => !existingRanking?.includes(id))
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const inRanked = (id: string) => ranked.includes(id);
    const inUnranked = (id: string) => unranked.includes(id);

    if (inUnranked(activeId) && overId === "ranked-drop-zone") {
      setUnranked((u) => u.filter((id) => id !== activeId));
      setRanked((r) => [...r, activeId]);
      return;
    }

    if (inRanked(activeId) && overId === "unranked-drop-zone") {
      setRanked((r) => r.filter((id) => id !== activeId));
      setUnranked((u) => [...u, activeId]);
      return;
    }

    if (inRanked(activeId) && inRanked(overId)) {
      setRanked((r) => arrayMove(r, r.indexOf(activeId), r.indexOf(overId)));
      return;
    }

    if (inUnranked(activeId) && inRanked(overId)) {
      setUnranked((u) => u.filter((id) => id !== activeId));
      setRanked((r) => {
        const idx = r.indexOf(overId);
        const copy = [...r];
        copy.splice(idx, 0, activeId);
        return copy;
      });
      return;
    }

    if (inUnranked(activeId) && inUnranked(overId)) {
      setUnranked((u) => arrayMove(u, u.indexOf(activeId), u.indexOf(overId)));
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (ranked.length === 0) {
      setError("Please rank at least one option.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await submitBallot({ pollId, rankedOptionIds: ranked });
        setSubmitted(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Submission failed.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="border border-cream-300 bg-cream-50 p-10 text-center">
        <div className="text-4xl mb-4">🏆</div>
          <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">Vote Submitted</h2>
        <p className="text-ink-500 text-sm">Your preferences have been recorded.</p>
      </div>
    );
  }

  const activeItem = activeId ? byId[activeId] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-8 md:grid-cols-2">

        {/* ── Candidates Pool ───────────────────────────────────────── */}
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-ink-300">
            Candidates
          </h3>
          <SortableContext items={unranked} strategy={verticalListSortingStrategy}>
            <div
              id="unranked-drop-zone"
              className="min-h-[80px] space-y-2 border border-dashed border-cream-300 p-3 bg-cream-50"
            >
              {unranked.length === 0 && (
                <p className="py-6 text-center text-sm text-ink-200">
                  All books ranked ✓
                </p>
              )}
              {unranked.map((id) => (
                <SortableCard key={id} item={byId[id]} />
              ))}
            </div>
          </SortableContext>
        </div>

        {/* ── Your Ranking ──────────────────────────────────────────── */}
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-ink-300">
            Your Ranking
          </h3>
          <SortableContext items={ranked} strategy={verticalListSortingStrategy}>
            <div
              id="ranked-drop-zone"
              className="min-h-[80px] space-y-2 border border-dashed border-gold-400 bg-gold-300/10 p-3"
            >
              {ranked.length === 0 && (
                <p className="py-6 text-center text-sm text-gold-600">
                  Drag books here to rank them
                </p>
              )}
              {ranked.map((id, index) => (
                <SortableCard key={id} item={byId[id]} rank={index + 1} />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem && <SortableCard item={activeItem} isDragging />}
      </DragOverlay>

      {/* Submit */}
      <div className="mt-8 flex flex-col items-end gap-2">
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={isPending || ranked.length === 0}
          className="px-8 py-3.5 bg-ink-900 text-cream-100 text-sm font-medium tracking-wide hover:bg-ink-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Submitting…" : "Submit Vote"}
        </button>
      </div>
    </DndContext>
  );
}

