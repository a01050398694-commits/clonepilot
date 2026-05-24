import { NextResponse } from "next/server";

// MVP license registry. Stored as env var CLONEPILOT_LICENSE_KEYS for the
// gallery deployment — JSON object mapping {key: {tier, email, expires_at}}.
// Format example:
//   {"cpl_test_pro": {"tier": "pro", "email": "test@example.com"},
//    "cpl_test_life": {"tier": "lifetime", "email": "buyer@example.com"}}
//
// When checkout opens (Phase B), licenses are issued by a Stripe webhook into
// a real database (Supabase). For now this hand-curated dict is the truth.

type LicenseRecord = {
  tier: "pro" | "lifetime";
  email?: string;
  expires_at?: string;
};

function loadRegistry(): Record<string, LicenseRecord> {
  const raw = process.env.CLONEPILOT_LICENSE_KEYS;
  if (!raw) {
    // Default test keys — useful for self-hosting + manual gifting.
    return {
      cpl_demo_pro: { tier: "pro", email: "demo@clonepilot.dev" },
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const key = (body?.key ?? "").trim();
  if (!key) {
    return NextResponse.json({ valid: false, error: "missing key" }, { status: 400 });
  }

  const registry = loadRegistry();
  const rec = registry[key];
  if (!rec) {
    return NextResponse.json({ valid: false });
  }

  if (rec.expires_at) {
    const expires = new Date(rec.expires_at).getTime();
    if (Number.isFinite(expires) && Date.now() > expires) {
      return NextResponse.json({ valid: false, expired: true });
    }
  }

  return NextResponse.json({
    valid: true,
    tier: rec.tier,
    email: rec.email ?? null,
    expires_at: rec.expires_at ?? null,
  });
}
