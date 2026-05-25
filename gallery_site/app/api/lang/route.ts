import { NextResponse } from "next/server";
import { isLang } from "@/lib/i18n";
import { LANG_COOKIE } from "@/lib/lang";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const lang = (body as { lang?: unknown })?.lang;
  if (!isLang(lang)) {
    return NextResponse.json({ ok: false, error: "bad lang" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, lang });
  res.cookies.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
