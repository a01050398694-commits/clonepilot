import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";

// Where we persist waitlist signups. /tmp is writable on Vercel serverless
// (ephemeral per-instance). For real persistence, upgrade later to KV / Supabase.
// Until then, every signup also sends an email to LEAD_DESTINATION which IS
// the durable record.
const STORE = "/tmp/clonepilot_waitlist.json";

type Signup = { email: string; source: string; ts: string };

function load(): Signup[] {
  try {
    return JSON.parse(fs.readFileSync(STORE, "utf8"));
  } catch {
    return [];
  }
}

function save(list: Signup[]) {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(list, null, 2));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();
  const source = (body?.source ?? "").slice(0, 200);

  if (!email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  const list = load();
  if (!list.find((s) => s.email === email)) {
    list.push({ email, source, ts: new Date().toISOString() });
    save(list);
  }
  const position = list.findIndex((s) => s.email === email) + 1;

  const apiKey = process.env.RESEND_API_KEY;
  // Hardcoded for now — Vercel still has the old LEAD_FROM_EMAIL pointing at
  // unverified askbit.co. Once askbit.co DNS is verified on Resend, switch
  // back to: process.env.LEAD_FROM_EMAIL || "onboarding@resend.dev"
  const from = "onboarding@resend.dev";
  const lead = process.env.LEAD_DESTINATION;

  if (apiKey) {
    const resend = new Resend(apiKey);
    // 1. confirmation to the signer
    await resend.emails
      .send({
        from: `ClonePilot <${from}>`,
        to: email,
        subject: "You're on the ClonePilot Pro waitlist",
        html: `<p>Thanks for signing up.</p>
<p>You're <strong>#${position}</strong> on the list. We'll email the day Pro launches — usually within a couple of weeks of hitting waitlist milestones.</p>
<p>While you wait: ClonePilot is fully open-source and free to use today.<br/>
<a href="https://github.com/a01050398694-commits/clonepilot">github.com/a01050398694-commits/clonepilot</a></p>`,
      })
      .catch(() => null);

    // 2. notify the owner (so we see signups even if /tmp is wiped)
    if (lead) {
      await resend.emails
        .send({
          from: `ClonePilot Waitlist <${from}>`,
          to: lead,
          subject: `Waitlist #${position}: ${email}`,
          text: `New signup\n\nemail: ${email}\nposition: ${position}\nsource: ${source}\nts: ${new Date().toISOString()}`,
        })
        .catch(() => null);
    }
  }

  return NextResponse.json({ ok: true, position });
}

export async function GET() {
  return NextResponse.json({ count: load().length });
}
