import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { title, month, description, status } = await req.json();

    if (!title || !month || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const poll = await prisma.poll.create({
      data: { title, month, description, status },
    });

    return NextResponse.json(poll);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}