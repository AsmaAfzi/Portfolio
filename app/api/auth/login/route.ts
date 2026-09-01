import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionToken,
  passwordsMatch,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  if (!passwordsMatch(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  try {
    const token = createSessionToken();
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Admin auth is not configured." },
      { status: 500 },
    );
  }
}
