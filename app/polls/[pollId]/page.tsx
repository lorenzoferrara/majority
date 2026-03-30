import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";
import RankingBoard from "../../../components/RankingBoard";

export default async function VotingPage({
  params,
}: {
  params: { pollId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");

  const userId = session.user?.name!;

  const poll = await prisma.poll.findUnique({
    where: { id: params.pollId },
    include: {
      options: { orderBy: { order: "asc" } },
      ballots: {
        where: { userId },
        include: { choices: { orderBy: { rank: "asc" } } },
      },
    },
  });

  if (!poll) return <div>Poll not found.</div>;
  if (poll.status === "DRAFT") return <div>Poll not open yet.</div>;

  const existing = poll.ballots[0]?.choices.map((c) => c.optionId);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{poll.title}</h1>
      {poll.status === "CLOSED" ? (
        <div className="mt-8 text-center">
          Voting is closed.{" "}
          <a href={`/results/${poll.id}`} className="text-indigo-600 underline">
            See results →
          </a>
        </div>
      ) : (
        <div className="mt-8">
          <RankingBoard
            pollId={poll.id}
            options={poll.options}
            existingRanking={existing}
          />
        </div>
      )}
    </main>
  );
}