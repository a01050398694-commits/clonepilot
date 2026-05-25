import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";

const STORE = "/tmp/clonepilot_analysis_requests.json";

type AnalysisRequest = {
  email: string;
  youtubeUrl: string;
  source: string;
  ts: string;
};

const YT_RE =
  /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;

function load(): AnalysisRequest[] {
  try {
    return JSON.parse(fs.readFileSync(STORE, "utf8"));
  } catch {
    return [];
  }
}

function save(list: AnalysisRequest[]) {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(list, null, 2));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();
  const youtubeUrl = (body?.youtubeUrl ?? "").trim();
  const source = (body?.source ?? "").slice(0, 200);

  if (!email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }
  const m = youtubeUrl.match(YT_RE);
  if (!m) {
    return NextResponse.json(
      { error: "not a valid YouTube URL" },
      { status: 400 },
    );
  }
  const videoId = m[1];

  const list = load();
  list.push({ email, youtubeUrl, source, ts: new Date().toISOString() });
  save(list);
  const position = list.length;

  const apiKey = process.env.RESEND_API_KEY;
  const from = "onboarding@resend.dev";
  const lead = process.env.LEAD_DESTINATION;

  if (apiKey) {
    const resend = new Resend(apiKey);

    await resend.emails
      .send({
        from: `ClonePilot <${from}>`,
        to: email,
        subject: "Your ClonePilot analysis is queued",
        html: `<p>Thanks — we got your request.</p>
<p>Video: <a href="${youtubeUrl}">${youtubeUrl}</a><br/>
Queue position: <strong>#${position}</strong></p>
<p>We run the deep analysis pass (Anthropic + Google Trends + Ahrefs + Exa) and email the report back to you. Usually under 24 hours during the manual-batch phase. When the live API ships, this will drop to under five minutes.</p>
<p>Want to skip the queue and run it yourself right now? ClonePilot is open-source — install once, paste the URL in Claude Code, get the same report:<br/>
<a href="https://clonepilot-gallery.vercel.app/install">clonepilot-gallery.vercel.app/install</a></p>`,
      })
      .catch(() => null);

    if (lead) {
      await resend.emails
        .send({
          from: `ClonePilot Request <${from}>`,
          to: lead,
          subject: `New analysis request #${position}: ${videoId}`,
          text: `New analysis request\n\nemail: ${email}\nyoutubeUrl: ${youtubeUrl}\nvideoId: ${videoId}\nposition: ${position}\nsource: ${source}\nts: ${new Date().toISOString()}\n\nRun locally:\n  uv run python scripts/seed_gallery.py --deep ${youtubeUrl}`,
        })
        .catch(() => null);
    }
  }

  return NextResponse.json({ ok: true, position, videoId });
}

export async function GET() {
  return NextResponse.json({ count: load().length });
}
