// app/polls/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PollsPage() {
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (polls.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-orange-200">
        <p className="text-xl">No polls available yet.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black p-8">
      <h1 className="text-4xl font-bold text-orange-400 mb-8 text-center">
        🏆 Current Polls
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polls.map((poll) => (
          <Link
            key={poll.id}
            href={`/polls/${poll.id}`}
            className="block bg-gradient-to-br from-orange-500/20 to-orange-300/10 border border-orange-400 rounded-xl p-6 hover:scale-105 transition-transform duration-200"
          >
            <h2 className="text-2xl font-semibold text-orange-200 mb-2">
              {poll.title}
            </h2>
            {poll.description && (
              <p className="text-orange-100/80 mb-3">{poll.description}</p>
            )}
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                poll.status === "OPEN"
                  ? "bg-green-600 text-black"
                  : poll.status === "CLOSED"
                  ? "bg-red-600 text-black"
                  : "bg-gray-500 text-black"
              }`}
            >
              {poll.status}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}