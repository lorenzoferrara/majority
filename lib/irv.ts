// lib/irv.ts
// Instant-Runoff Voting (Preferential Voting) — production-grade implementation
// ─────────────────────────────────────────────────────────────────────────────

export interface RawBallot {
  /** Ordered list of optionIds, index 0 = first preference */
  preferences: string[];
}

export interface IRVRound {
  round: number;
  /** Vote counts for each still-active candidate */
  counts: Record<string, number>;
  totalActive: number;
  /** Candidate(s) eliminated this round. Array because ties are possible. */
  eliminated: string[];
  /** Set if a winner is found this round */
  winner?: string;
}

export interface IRVResult {
  winner: string | null;    // null only if all ballots are exhausted (rare edge case)
  rounds: IRVRound[];
  isTie: boolean;           // true if final round ends in an exact tie
}

/**
 * Runs Instant-Runoff Voting on a set of raw ballots.
 *
 * @param ballots  - Array of voter preference lists (optionIds, ranked 1st…last)
 * @param options  - All candidate optionIds in the poll
 * @returns        - Full round-by-round trace + final winner
 */
export function runIRV(ballots: RawBallot[], options: string[]): IRVResult {
  if (options.length === 0) {
    return { winner: null, rounds: [], isTie: false };
  }

  // Working copy — we mutate this set each round
  const active = new Set<string>(options);
  const rounds: IRVRound[] = [];

  // Each "live ballot" is a mutable pointer to the next unexhausted preference
  // We represent ballots as arrays; we scan from position 0 each round but skip
  // eliminated candidates inline. This avoids mutating ballot data.
  const liveBallots: string[][] = ballots.map((b) =>
    // Strip any optionIds that aren't in the declared options list (defensive)
    b.preferences.filter((id) => options.includes(id))
  );

  let roundNumber = 0;

  while (active.size > 0) {
    roundNumber++;

    // ── 1. Count first-choice votes among active candidates ──────────────────
    const counts: Record<string, number> = {};
    for (const id of active) counts[id] = 0;

    let totalActive = 0;

    for (const prefs of liveBallots) {
      // Find this ballot's current top choice (first pref that's still active)
      const top = prefs.find((id) => active.has(id));
      if (top !== undefined) {
        counts[top]++;
        totalActive++;
      }
      // Exhausted ballots (all prefs eliminated) are silently skipped
    }

    // ── 2. Check for majority winner (>50% of active ballots) ────────────────
    const majority = totalActive / 2;
    const winner = Object.entries(counts).find(([, v]) => v > majority)?.[0];

    if (winner) {
      rounds.push({
        round: roundNumber,
        counts,
        totalActive,
        eliminated: [],
        winner,
      });
      return { winner, rounds, isTie: false };
    }

    // ── 3. No majority — find candidate(s) with fewest votes ─────────────────
    const minVotes = Math.min(...Object.values(counts));
    const toEliminate = Object.entries(counts)
      .filter(([, v]) => v === minVotes)
      .map(([id]) => id);

    // ── 4. Edge case: all remaining candidates are tied ───────────────────────
    // This happens when every candidate has the same count. Declare a tie
    // rather than entering an infinite loop.
    if (toEliminate.length === active.size) {
      rounds.push({
        round: roundNumber,
        counts,
        totalActive,
        eliminated: toEliminate,
        // In a full tie, convention picks the last survivor alphabetically
        // OR returns null and lets the UI handle it. We return null + isTie.
        winner: undefined,
      });
      return { winner: null, rounds, isTie: true };
    }

    // ── 5. Eliminate & record round ──────────────────────────────────────────
    // Tie-breaking during elimination (multiple candidates share the minimum):
    // Real IRV elections use secondary rules (total votes across all rounds,
    // random draw, etc.). Here we eliminate ALL tied-minimum candidates
    // simultaneously, which is the most common automated approach.
    for (const id of toEliminate) active.delete(id);

    rounds.push({
      round: roundNumber,
      counts,
      totalActive,
      eliminated: toEliminate,
    });

    // If only one candidate remains after elimination, they win automatically.
    if (active.size === 1) {
      const lastStanding = [...active][0];
      rounds[rounds.length - 1].winner = lastStanding;
      return { winner: lastStanding, rounds, isTie: false };
    }
  }

  // Fallback: all candidates eliminated (only possible if options = [])
  return { winner: null, rounds, isTie: false };
}
