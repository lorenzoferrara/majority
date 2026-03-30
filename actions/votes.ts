// actions/votes.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runIRV, type IRVResult } from "@/lib/irv";

// ─── Submit a Ballot ─────────────────────────────────────────────────────────

const SubmitBallotSchema = z.object({
  pollId: z.string().cuid(),
  /** optionIds ordered from most preferred (index 0) to least preferred */
  rankedOptionIds: z.array(z.string().cuid()).min(1),
});

type SubmitBallotInput = z.infer<typeof SubmitBallotSchema>;

export async function submitBallot(input: SubmitBallotInput) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthenticated");

  const { pollId, rankedOptionIds } = SubmitBallotSchema.parse(input);

  // ── Validate poll is open ──────────────────────────────────────────────────
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { status: true, options: { select: { id: true } } },
  });

  if (!poll) throw new Error("Poll not found");
  if (poll.status !== "OPEN") throw new Error("Poll is not open for voting");

  // ── Validate all submitted optionIds belong to this poll ──────────────────
  const validIds = new Set(poll.options.map((o) => o.id));
  const invalid = rankedOptionIds.filter((id) => !validIds.has(id));
  if (invalid.length > 0) {
    throw new Error(`Invalid option IDs: ${invalid.join(", ")}`);
  }

  // ── Upsert ballot + replace rankings atomically ───────────────────────────
  // Using a transaction ensures we never end up with a half-written ballot.
  await prisma.$transaction(async (tx) => {
    // Delete any prior ballot for this user+poll (allows re-voting while OPEN)
    await tx.ballot.deleteMany({ where: { pollId, userId } });

    await tx.ballot.create({
      data: {
        pollId,
        userId,
        choices: {
          create: rankedOptionIds.map((optionId, index) => ({
            optionId,
            rank: index + 1, // 1-based
          })),
        },
      },
    });
  });

  revalidatePath(`/polls/${pollId}`);
  return { success: true };
}

// ─── Fetch Ballots for a Poll & Run IRV ─────────────────────────────────────

export async function calculateResults(pollId: string): Promise<IRVResult> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      status: true,
      options: { select: { id: true }, orderBy: { order: "asc" } },
      ballots: {
        select: {
          choices: {
            select: { optionId: true, rank: true },
            orderBy: { rank: "asc" },
          },
        },
      },
    },
  });

  if (!poll) throw new Error("Poll not found");

  const optionIds = poll.options.map((o) => o.id);

  // Reshape DB rows → RawBallot[] expected by the IRV algorithm
  const rawBallots = poll.ballots.map((b) => ({
    preferences: b.choices.map((c) => c.optionId),
  }));

  return runIRV(rawBallots, optionIds);
}

// ─── Admin: Close a Poll ─────────────────────────────────────────────────────

export async function closePoll(pollId: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthenticated");

  // In production: check userId against an admin list or Clerk org role.
  await prisma.poll.update({
    where: { id: pollId },
    data: { status: "CLOSED" },
  });

  revalidatePath(`/admin/polls`);
  revalidatePath(`/results/${pollId}`);
}
