// lib/irv.test.ts
// Run with: pnpm vitest

import { describe, it, expect } from "vitest";
import { runIRV } from "./irv";

const A = "optA";
const B = "optB";
const C = "optC";
const D = "optD";

describe("runIRV", () => {
  it("returns immediate winner when first choice > 50%", () => {
    const ballots = [
      { preferences: [A, B] },
      { preferences: [A, C] },
      { preferences: [A, B] },
      { preferences: [B, A] },
    ];
    const result = runIRV(ballots, [A, B, C]);
    expect(result.winner).toBe(A);
    expect(result.rounds).toHaveLength(1);
  });

  it("eliminates last-place and redistributes", () => {
    // A:3, B:2, C:1 → C eliminated → B voters go to A → A wins
    const ballots = [
      { preferences: [A, B] },
      { preferences: [A, B] },
      { preferences: [A, B] },
      { preferences: [B, A] },
      { preferences: [B, A] },
      { preferences: [C, B] }, // C eliminated → goes to B
    ];
    const result = runIRV(ballots, [A, B, C]);
    expect(result.winner).toBe(A);
    expect(result.rounds.length).toBeGreaterThanOrEqual(2);
    expect(result.rounds[0].eliminated).toContain(C);
  });

  it("handles exhausted ballots gracefully", () => {
    // Voter only ranked C; when C is eliminated, ballot is exhausted
    const ballots = [
      { preferences: [A] },
      { preferences: [A] },
      { preferences: [B] },
      { preferences: [C] }, // will be exhausted after C is out
    ];
    const result = runIRV(ballots, [A, B, C]);
    expect(result.winner).toBe(A);
  });

  it("detects a full tie", () => {
    const ballots = [
      { preferences: [A, B] },
      { preferences: [B, A] },
    ];
    const result = runIRV(ballots, [A, B]);
    // 1 vote each, no majority, both would be eliminated — tie
    expect(result.isTie).toBe(true);
    expect(result.winner).toBeNull();
  });

  it("eliminates multiple candidates when tied for last", () => {
    // B:1, C:1, D:1, A:3  → B/C/D all tied for last
    const ballots = [
      { preferences: [A] },
      { preferences: [A] },
      { preferences: [A] },
      { preferences: [B] },
      { preferences: [C] },
      { preferences: [D] },
    ];
    const result = runIRV(ballots, [A, B, C, D]);
    expect(result.winner).toBe(A);
    // B, C, D should all be eliminated in the same round
    const firstElimRound = result.rounds.find((r) => r.eliminated.length > 0);
    expect(firstElimRound?.eliminated.sort()).toEqual([B, C, D].sort());
  });

  it("handles empty ballots", () => {
    const result = runIRV([], [A, B, C]);
    // No ballots → winner is first to pass majority of 0 → A gets 0 > 0? No.
    // This edge case: totalActive = 0, majority = 0, count[A]=0 which is NOT > 0.
    // All tied, all eliminated. Returns isTie.
    expect(result.isTie).toBe(true);
  });

  it("handles single candidate", () => {
    const ballots = [{ preferences: [A] }, { preferences: [A] }];
    const result = runIRV(ballots, [A]);
    expect(result.winner).toBe(A);
    expect(result.rounds).toHaveLength(1);
  });
});
