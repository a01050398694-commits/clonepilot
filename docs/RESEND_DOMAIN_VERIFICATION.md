# Resend Domain Verification — Step-by-step (Cloudflare)

> Permanent fix for [GOTCHA #9](../GOTCHAS.md). Replace `onboarding@resend.dev`
> with a branded sender (`noreply@askbit.com`) by adding 4 DNS records on
> Cloudflare and clicking "Verify" on the Resend dashboard.
>
> One-time setup. Once verified, every outbound email (waitlist confirmation,
> upgrade-list signup, owner notification) comes from your domain — no more
> "via resend.dev" footer, better deliverability, no silent 403s.

---

## ⚠️ Domain sanity check (read first)

Before doing anything, the right domain has to actually exist. Operator session
ran this check on 2026-05-24 and found:

```
askbit.co  → NXDOMAIN  (does not exist in any DNS)
askbit.com → registered, on Cloudflare (jade.ns.cloudflare.com / owen.ns.cloudflare.com)
```

**Conclusion**: every reference to `askbit.co` in the codebase is a typo. The
real domain is **`askbit.com`**. GOTCHA #9 originally read as "Resend rejected
`askbit.co`" — that wasn't a verification failure, it was a non-existent
domain. Below uses `askbit.com` throughout.

If you actually own `askbit.co` separately and want to use it, register/activate
it first, then re-run the steps with the `.co` apex — the procedure is
identical.

Verify yourself in PowerShell:

```powershell
Resolve-DnsName askbit.com -Type NS -Server 1.1.1.1 |
  Where-Object { $_.Type -eq 'NS' } | Select-Object NameHost
```

You should see two `*.ns.cloudflare.com` entries. If you don't, stop and tell
Claude — the registrar guidance below assumes Cloudflare DNS.

---

## Step 1 — Add the domain on Resend

1. Open **<https://resend.com/domains>** while logged in as the same user that
   owns the `RESEND_API_KEY` already in Vercel.
2. Click **`+ Add Domain`** (top-right).
3. Enter `askbit.com` (apex only — do NOT prefix with `www.` or `mail.`).
4. Pick region **`us-east-1`** (Resend's default; matches existing key).
5. Click **`Add`**.

Resend now shows a table of 3–4 DNS records you must add to Cloudflare. The
exact values are unique per Resend account (DKIM keys are generated for you), so
copy each row from the dashboard — don't guess. The **shape** of each row is:

| # | Type | Name | Value | Priority | Notes |
|---|------|------|-------|----------|-------|
| 1 | **MX** | `send.askbit.com` | `feedback-smtp.us-east-1.amazonses.com` | `10` | Bounce/complaint handling |
| 2 | **TXT** | `send.askbit.com` | `v=spf1 include:amazonses.com ~all` | — | SPF — authorizes Resend to send as you |
| 3 | **TXT** | `resend._domainkey.askbit.com` | `p=MIGfMA0GCSqGSI...` (long key from Resend) | — | DKIM — cryptographic signature |
| 4 | **TXT** *(optional, recommended)* | `_dmarc.askbit.com` | `v=DMARC1; p=none;` | — | DMARC — reporting policy |

Resend shows them as 3 mandatory + 1 optional. Add all 4.

Keep that tab open — you'll click `Verify DNS Records` at the end.

---

## Step 2 — Add the 4 records on Cloudflare

1. Open **<https://dash.cloudflare.com>** → sign in.
2. In the **Websites** list, click **`askbit.com`**. (If you don't see it,
   you're in the wrong Cloudflare account — switch via the account dropdown
   top-left.)
3. Left sidebar → **`DNS`** → **`Records`**.
4. Click **`+ Add record`** for each row from Step 1.

### Row 1 — MX (bounce handling)

| Field | Value |
|---|---|
| Type | `MX` |
| Name | `send` *(Cloudflare auto-suffixes `.askbit.com`)* |
| Mail server | `feedback-smtp.us-east-1.amazonses.com` |
| Priority | `10` |
| TTL | `Auto` |
| Proxy status | **`DNS only`** (grey cloud) — mail records can't be proxied |

Click `Save`.

### Row 2 — TXT (SPF)

| Field | Value |
|---|---|
| Type | `TXT` |
| Name | `send` *(NOT the apex — same `send.askbit.com` host as the MX above)* |
| Content | `v=spf1 include:amazonses.com ~all` |
| TTL | `Auto` |

Click `Save`.

### Row 3 — TXT (DKIM)

| Field | Value |
|---|---|
| Type | `TXT` |
| Name | `resend._domainkey` *(Cloudflare suffixes to `resend._domainkey.askbit.com`)* |
| Content | paste **the long `p=MIGfMA0G...` value from Resend** verbatim, in one line, no extra quotes |
| TTL | `Auto` |

Click `Save`.

**Common mistake**: Cloudflare's UI sometimes truncates long TXT values
visually. The full DKIM key is ~400 chars — paste it in one block, no line
breaks. After saving, click the record to expand and check the full value
matches Resend's source.

### Row 4 — TXT (DMARC, optional but do it)

| Field | Value |
|---|---|
| Type | `TXT` |
| Name | `_dmarc` |
| Content | `v=DMARC1; p=none;` |
| TTL | `Auto` |

Click `Save`.

---

## Step 3 — Verify on Resend

1. Back on **<https://resend.com/domains>** → click your `askbit.com` row.
2. Click **`Verify DNS Records`** at the bottom.

Cloudflare normally propagates within 30 seconds, but Resend caches lookups so
allow up to ~5 minutes. Refresh if needed. Expected outcome:

```
✓ MX     send.askbit.com               verified
✓ SPF    send.askbit.com               verified
✓ DKIM   resend._domainkey.askbit.com  verified
✓ DMARC  _dmarc.askbit.com             verified
Status:  Verified
```

If any row stays red after 10 minutes, double-check on PowerShell:

```powershell
# MX
Resolve-DnsName send.askbit.com -Type MX -Server 1.1.1.1
# SPF
Resolve-DnsName send.askbit.com -Type TXT -Server 1.1.1.1
# DKIM
Resolve-DnsName resend._domainkey.askbit.com -Type TXT -Server 1.1.1.1
```

`Server 1.1.1.1` forces a fresh Cloudflare resolver lookup — avoids any local
ISP caching weirdness.

---

## Step 4 — Switch the gallery over (Operator does this on signal)

Once Step 3 shows green, **tell Claude in this session: "Resend verified, switch over."**
Operator session will then:

1. Push `LEAD_FROM_EMAIL=noreply@askbit.com` to Vercel env vars for the
   `clonepilot-gallery` project.
2. Edit `gallery_site/app/api/upgrade/route.ts` + `gallery_site/app/api/waitlist/route.ts`
   to read from env again (current code is hardcoded to `onboarding@resend.dev`
   per GOTCHA #9).
3. `uv run python scripts/deploy_gallery.py` → redeploy.
4. Smoke test: hit `/api/waitlist` with a fresh email, confirm the inbox shows
   the new `noreply@askbit.com` sender + no "via resend.dev" footer.
5. Update `GOTCHAS.md#9` to mark the resolution path.

---

## Why all 4 records, in plain English

| Record | What it actually does |
|---|---|
| **MX** on `send.askbit.com` | Tells the world "bounces / complaints for mail sent from this subdomain go to Amazon SES infrastructure (which Resend rides on)". Without it, bounce handling silently fails and your sender reputation degrades. |
| **SPF (TXT)** on `send.askbit.com` | "Amazon SES IPs are allowed to send mail claiming to be from this domain." Receiving mailservers (Gmail, Outlook) use this to decide if your mail goes to inbox or spam. |
| **DKIM (TXT)** on `resend._domainkey.askbit.com` | A public key. Resend signs every outgoing message with the matching private key. The receiver verifies the signature → proves the mail wasn't tampered with → big inbox-rate boost. |
| **DMARC (TXT)** on `_dmarc.askbit.com` | Tells receivers "if SPF and DKIM both fail, here's what to do" (`p=none` = report only). Required for full Gmail inbox delivery starting 2024. |

The MX, SPF, and DKIM live under the `send.` subdomain — that's intentional.
Resend isolates your transactional sending to a subdomain so it doesn't
interfere with the apex (which you might use for personal mail later). The
DMARC record sits at `_dmarc` on the apex because DMARC policy is per-org, not
per-subdomain.

---

## Cost / time check

- **Cloudflare DNS**: free.
- **Resend**: 3,000 emails/month free. Current ClonePilot volume is well under
  that.
- **Time to verify**: 5–10 minutes including DNS propagation.
- **Reversibility**: deleting the 4 records reverts everything. Resend just
  shows the domain as un-verified again.
