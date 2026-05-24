import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";

const STORE = "/tmp/clonepilot_upgrade_waitlist.json";

type Signup = {
  email: string;
  tier: "pro" | "lifetime" | "either";
  source: string;
  ts: string;
};

const ALLOWED_TIERS = new Set(["pro", "lifetime", "either"]);

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
  const tier = (body?.tier ?? "pro").toString();
  const source = (body?.source ?? "").slice(0, 200);

  if (!email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }
  if (!ALLOWED_TIERS.has(tier)) {
    return NextResponse.json({ error: "invalid tier" }, { status: 400 });
  }

  const list = load();
  if (!list.find((s) => s.email === email && s.tier === tier)) {
    list.push({
      email,
      tier: tier as Signup["tier"],
      source,
      ts: new Date().toISOString(),
    });
    save(list);
  }
  const tierList = list.filter((s) => s.tier === tier);
  const position = tierList.findIndex((s) => s.email === email) + 1;

  const apiKey = process.env.RESEND_API_KEY;
  // Permanent default for waitlist mode — Resend's pre-verified sandbox sender.
  // No DNS / domain verification needed. If a ClonePilot-specific domain is
  // purchased later, follow docs/RESEND_DOMAIN_VERIFICATION.md then switch to:
  //   process.env.LEAD_FROM_EMAIL || "onboarding@resend.dev"
  // See GOTCHAS.md #9 for the original incident.
  const from = "onboarding@resend.dev";
  const lead = process.env.LEAD_DESTINATION;

  if (apiKey) {
    const resend = new Resend(apiKey);
    const tierLabel =
      tier === "pro"
        ? "Pro ($19/mo · early-bird $9)"
        : tier === "lifetime"
          ? "Lifetime ($299 · early-bird $199)"
          : "Pro OR Lifetime";

    await resend.emails
      .send({
        from: `ClonePilot <${from}>`,
        to: email,
        subject: `You're #${position} on the ${tier} early-bird list`,
        html: `<p>Thanks for joining the <strong>${tierLabel}</strong> waitlist.</p>
<p>You're <strong>#${position}</strong>. We're sorting payment processor approvals in Korea — once checkout opens, early-bird pricing is locked in for you.</p>
<p>While you wait, the MCP is fully open-source today:<br/>
<a href="https://github.com/a01050398694-commits/clonepilot">github.com/a01050398694-commits/clonepilot</a></p>
<p>Replies to this email reach us directly.</p>`,
      })
      .catch(() => null);

    if (lead) {
      await resend.emails
        .send({
          from: `ClonePilot Upgrade <${from}>`,
          to: lead,
          subject: `🟢 Upgrade signup #${position} (${tier}): ${email}`,
          text: `Tier: ${tier}\nEmail: ${email}\nPosition: ${position}\nSource: ${source}\nTime: ${new Date().toISOString()}\n\nTotal signups across all tiers: ${list.length}\n  pro:      ${list.filter((s) => s.tier === "pro").length}\n  lifetime: ${list.filter((s) => s.tier === "lifetime").length}\n  either:   ${list.filter((s) => s.tier === "either").length}`,
        })
        .catch(() => null);
    }
  }

  return NextResponse.json({ ok: true, position, tier });
}

export async function GET() {
  const list = load();
  return NextResponse.json({
    total: list.length,
    pro: list.filter((s) => s.tier === "pro").length,
    lifetime: list.filter((s) => s.tier === "lifetime").length,
    either: list.filter((s) => s.tier === "either").length,
  });
}
