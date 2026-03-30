// actions/polls.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ── helpers ──────────────────────────────────────────────────────────────────

function requireAdmin() {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthenticated");
  // Replace with your real admin check, e.g. Clerk publicMetadata.role === "admin"
  const adminIds = (process.env.ADMIN_USER_IDS ?? "").split(",");
  if (!adminIds.includes(userId)) throw new Error("Forbidden");
  return userId;
}

// ── Create Poll ───────────────────────────────────────────────────────────────

const CreatePollSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(200),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .min(2),
});

export async function createPoll(input: z.infer<typeof CreatePollSchema>) {
  requireAdmin();
  const data = CreatePollSchema.parse(input);

  const poll = await prisma.poll.create({
    data: {
      title: data.title,
      description: data.description,
      month: data.month,
      status: "DRAFT",
      options: {
        create: data.options.map((opt, i) => ({ ...opt, order: i })),
      },
    },
    include: { options: true },
  });

  revalidatePath("/admin/polls");
  return poll;
}

// ── Open / Close Poll ────────────────────────────────────────────────────────

export async function setPollStatus(
  pollId: string,
  status: "OPEN" | "CLOSED" | "DRAFT"
) {
  requireAdmin();
  const poll = await prisma.poll.update({
    where: { id: pollId },
    data: { status },
  });
  revalidatePath("/admin/polls");
  revalidatePath(`/polls/${pollId}`);
  return poll;
}

// ── Fetch all polls (admin list) ─────────────────────────────────────────────

export async function listPolls() {
  requireAdmin();
  return prisma.poll.findMany({
    orderBy: { month: "desc" },
    include: {
      _count: { select: { ballots: true, options: true } },
    },
  });
}
