import { NextResponse } from "next/server";
import { setFamilleSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password !== process.env.FAMILLE_PASSWORD) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  await setFamilleSession();
  return NextResponse.json({ ok: true });
}
