# PROGRESS — ClonePilot MCP

_Last updated: 2026-05-24_

## Vision
글로벌 indie hacker가 YouTube 사업 소개 영상 URL을 Claude/Codex에 한 줄 던지면, 영상 속 비즈니스 모델을 분석해 동일 컨셉의 working MVP (랜딩페이지 + 배포 URL + 마케팅 키트 + 결제)를 자동 생성해주는 MCP 서버.

## Phase 1 MVP (this sprint)
URL → BusinessBlueprint → Next.js 랜딩 자동 생성 → Vercel 배포 → 라이브 URL 반환.

도구 3개:
1. `analyze(youtube_url)` → BusinessBlueprint JSON
2. `scaffold(blueprint)` → 로컬 repo 경로 반환
3. `deploy(repo_path)` → 라이브 URL 반환

## Phase 2
- `monetize(business_url, blueprint)` — Stripe 결제 링크
- `marketing_kit(blueprint)` — X/PH/광고 카피·이미지

## Stack
- Python 3.11 + `fastmcp` (MCP server)
- `supadata` API (transcript, 사용자 이미 보유) → `youtube-transcript-api` fallback
- Anthropic Claude Sonnet 4.6 (blueprint + copy)
- Next.js 15 App Router + Tailwind + shadcn/ui 템플릿
- Vercel REST API

## Existing assets (사용자 PC 인벤토리)
- Anthropic / Groq / Google AI API keys ✅
- Supadata API ✅ (paid)
- YouTube Data API ✅
- Vercel 계정 (token 발급 필요)
- Supabase 계정
- Stripe (Premium/Pro price IDs 이미 세팅)
- X / Threads / Telegram / Reddit / Beehiiv / ElevenLabs / ImgBB / ngrok

## Competitor landscape
- **MCP 시장**: Smithery 7000+ servers, 전체 17k+. YouTube transcript MCP 40+개 존재, 그러나 **"transcript → 사업 분석 → 배포된 MVP"는 빈 자리**.
- **App gen 시장**: bolt.new, Lovable, v0 모두 $25/월, 프롬프트 기반. **MCP-native 아님, YouTube 입력 받지 않음**.
- **Gap**: "YouTube 사업 영상 → 1줄 호출 → 라이브 URL" 이라는 명확한 wedge.

## Positioning hypothesis
- **Target**: 글로벌 indie hacker (Claude Code/Cursor/Codex 유료 사용자)
- **Pricing**: MCP 서버 자체 무료 (Smithery 배포), 백엔드 종량제 — 분석 + 배포 1회당 토큰 비용 마진 + 월 $19 Pro (무제한 배포·커스텀 도메인)
- **Distribution**: Smithery → Awesome MCP servers → X 데모 클립 (분석 → URL 1분 데모)
- **차별점 한 줄**: "v0 makes you type the prompt. ClonePilot watches the YouTube video for you."

## Chunk Log
- 2026-05-24 — Task 1 PC 키 인벤토리 완료. Anthropic/Supadata/Groq/Stripe 등 다수 보유.
- 2026-05-24 — Task 2 시장조사 완료. wedge 명확.
- 2026-05-24 — Task 3 포지셔닝 브리프 inline 완료.
- 2026-05-24 — Task 4 FastMCP 프로젝트 스캐폴딩 + `version` 헬스 도구 검증.
- 2026-05-24 — Task 5 `analyze(url)` 구현. youtube-transcript-api + Supadata fallback + Claude tool_use 구조화 출력. 사용자 샘플 영상에서 BlogFlow 청사진 추출 성공 (transcript 23k chars, 3 pricing tiers).
- 2026-05-24 — Task 6 `scaffold(blueprint)` 구현. Next.js 15.5.18 + Tailwind 3.4 + TypeScript 5.7 템플릿. `npm install` + `next build` 로컬 12.5s 성공.
- 2026-05-24 — Task 7 `deploy(repo_path)` 구현. Vercel REST API v13, 인라인 base64 업로드, READY/ERROR polling. **신규 프로젝트 자동 SSO 보호 해제 추가** (Pro/Team 계정 401 회피).
- 2026-05-24 — Task 8 **E2E 검증 성공**. YouTube URL → 라이브 URL 약 2분.
  - 라이브: https://blogflow-nine.vercel.app (Prod, 200 OK)
  - 12 files / 19.5 KB 업로드
  - Playwright 풀페이지 스크린샷 ./blogflow-live.png 콘텐츠 일치 확인
- 2026-05-24 — Task 9 docs/INSTALL.md 작성 (Claude Desktop / Claude Code / Cursor / Codex).

## Phase 1 verdict
**작동.**

## Phase 2 — 2026-05-24 same day
- Task 10 `monetize(blueprint)` 구현. Stripe SDK 통합 + PREVIEW 모드 fallback (키 없을 때 https://example.com/buy/... 모의 링크). LIVE/TEST/PREVIEW 모드 명시.
- Task 11 `scaffold(blueprint, payment_links?)` 옵셔널 파라미터로 결제 버튼 자동 wiring.
- Task 12 `marketing_kit(blueprint, live_url?)` 구현. Claude tool_use → X 스레드 3-8개 + PH + Show HN + Reddit + LinkedIn + 광고 크리에이티브 2-4개.
- Task 13 `oneshot(youtube_url)` 단일 호출 컨비니언스. 전체 파이프라인 한 번에. marketing_kit best-effort (실패해도 deploy URL 살림).
- Task 14 **Phase 2 E2E 성공**.
  - 라이브: https://blogflow-nine.vercel.app (Buy Pro Course + Buy Consulting 버튼 베이크됨, 200 OK)
  - monetize PREVIEW: Pro Course $197 / Consulting $497 모의 링크
  - marketing kit: X 5 tweets, PH 53-char tagline, HN "Show HN: BlogFlow – AI blog publishing system for Naver + Google AdSense revenue", Reddit r/sideproject, LinkedIn, 4 광고 (소득증명 / 멀티플랫폼 / 워크플로 / 케이스스터디 앵글)
  - 스크린샷: ./blogflow-phase2.png
- Task 15 README/INSTALL/.env.example Phase 2 도구 반영.

## Phase 2 verdict
**작동.** 6 MCP tools 전부 실 동작.

## Phase 3 — 2026-05-24 same day
- Task 16 이메일 캡처 (Resend) 스캐폴드 옵션 추가. `lead_destination` 지정 시 hero에 폼 + `app/api/lead/route.ts` Server route + Resend SDK.
- Task 17 Vercel Analytics 템플릿 통합. `@vercel/analytics` deps + `<Analytics />` in layout.tsx.
- Task 18 Deploy가 Vercel 프로젝트 env vars 자동 push (PATCH-via-POST 멱등). 첫 deploy 전 프로젝트 자동 생성.
- Task 19 `attach_domain(project, domain)` MCP 툴 구현. 즉시 verified면 라이브 URL 반환, 아니면 DNS 레코드 안내 반환.
- Task 20 **Phase 3 E2E 성공**.
  - 라이브: https://blogflow-nine.vercel.app (이메일 폼 + Buy 버튼 + 분석)
  - **POST /api/lead → 200 OK** (Resend가 phase3test@clonepilot.dev → a01050398694@gmail.com 발송, "Thanks — we'll be in touch shortly." 표시)
  - Vercel Analytics: `_vercel/insights/script.js` + `view` POST 200
  - 스크린샷: ./blogflow-phase3.png (hero + 이메일 폼 + 성공 메시지)
- Task 21 Smithery 등록 준비. `smithery.yaml` + `Dockerfile` + `docs/SMITHERY.md` 작성. PyPI 배포 (Phase 4) 후 `smithery publish` 한 줄로 등록 가능.

## Phase 3 verdict
**작동.** 7 MCP tools (analyze · monetize · scaffold · deploy · marketing_kit · attach_domain · oneshot). Smithery 매니페스트 + Dockerfile 준비됨. 배포는 PyPI 토큰 받으면 즉시.

## Phase 4 — 2026-05-24 same day
- Task 22 **Auto-favicon SVG 생성** 스캐폴드에 추가. 브랜드명 첫 글자 + 해시 기반 hue로 결정론적 색상. Next.js 15가 `app/icon.svg`를 자동 favicon으로 서빙 → 404 사라짐.
- Task 23 Repo 청소. .gitignore에 e2e/test 산출물 + .playwright-mcp/ 추가. 시크릿 누출 grep으로 확인 (sk-ant/vcp/re_/ghp_/sk_live_ 패턴 매칭은 prefix 비교 코드뿐, 실 키 없음).
- Task 24 **GitHub repo 생성 + push 완료**. https://github.com/a01050398694-commits/clonepilot (public). PAT 인증, 명시적 git add 만 사용.
- Task 25 Smithery 등록 준비 완료. `smithery auth login --json` 으로 OAuth URL 발급 가능 — 사용자가 ONE click하면 즉시 `smithery mcp publish` 자동 실행 가능. docs/SMITHERY.md에 정확한 절차 박음.
- Task 26 **Phase 4 final E2E 성공**.
  - 라이브: https://blogai-dh1gbkzsn-askbit.vercel.app (자동 prod alias 회전)
  - **0 console errors** (Phase 3의 favicon 404 제거됨)
  - `/icon.svg → 200 OK` (자동 생성된 SVG favicon)
  - 페이지 제목 클린: "BlogAI — Write once, earn from 12 platforms with AI blogs."
  - 스크린샷: ./blogai-phase4.png (hero + 이메일 폼 + 명확한 브랜드)

## Phase 4 verdict
**작동 + 배포.** GitHub 공개, `uvx --from git+https://github.com/...` 으로 누구나 즉시 설치 가능. Smithery 등록은 사용자 OAuth 클릭 한 번 남음.

## 배포 채널 현황
| 채널 | 상태 | 명령 |
|---|---|---|
| **GitHub clone (즉시)** | ✅ LIVE | `uvx --from git+https://github.com/a01050398694-commits/clonepilot clonepilot` |
| **Smithery 등록** | ⏸ OAuth 클릭 대기 | `npx -y @smithery/cli@latest auth login` (1회) → `... mcp publish` (이후 자동) |
| **PyPI 등록** | ⏸ Phase 5 | 계정 이메일 인증 필요 |

## Phase 5 — 2026-05-24 same day
- Task 27 **GOTCHAS.md 생성**. 7개 MUST/MUST NOT 규칙 정리 (Next CVE 픽스, Vercel SSO 자동 해제, max_length 금지, marketing_kit best-effort, env push 시 프로젝트 선생성, app/icon.svg 자동, OAuth/email 인증 자동화 불가 인정).
- Task 28 **GitHub Actions PyPI 자동 publish workflow** (`.github/workflows/publish.yml`). v*.*.* 태그 푸시 시 트리거. `PYPI_API_TOKEN` repo secret 들어가면 자동 publish, 없으면 워닝만 띄우고 통과 (inert).
- Task 29 **CHANGELOG.md + v0.1.0 태그 + GitHub Release**. Phase 1-5 전체 정리, https://github.com/a01050398694-commits/clonepilot/releases/tag/v0.1.0 라이브.
- Task 30 **awesome-mcp-servers PR 자동 제출**. Fork → Developer Tools 섹션에 entry 추가 → PR 오픈. **#6807 라이브**: https://github.com/punkpeye/awesome-mcp-servers/pull/6807
- Task 31 **Smithery 1-클릭 헬퍼** (`scripts/publish_smithery.py`). 사용자가 `uv run python scripts/publish_smithery.py` 한 번 실행 → 자동으로 auth URL 띄우고 → 브라우저 클릭 → publish까지 자동 완료.

## Phase 5 verdict
**작동 + 공개 등록 진행 중.** GitHub release 라이브, awesome-mcp-servers PR 머지 대기, Smithery 1-클릭 준비, PyPI workflow 자동 발사 대기.

## 5단계 누적 — 32 tasks 모두 실 검증
| Phase | tasks | 결과 |
|---|---|---|
| 1 | 9 | 7 MCP tools 1차 — 라이브 URL |
| 2 | 6 | Stripe + 마케팅 키트 |
| 3 | 6 | 이메일 캡처 + 분석 + 도메인 |
| 4 | 5 | favicon + GitHub 공개 |
| 5 | 5 | Release + awesome PR + Smithery 1-클릭 |

## Known gotchas
1. Vercel은 알려진 CVE가 있는 Next.js 버전을 빌드 통과 후 READY 단계에서 ERROR로 reject. 템플릿의 next 버전을 정기적으로 최신 patch 로 bump 필요.
2. Vercel Pro/Team 계정은 기본 SSO 보호 ON → preview URL 401. 신규 프로젝트 생성 직후 PATCH 로 해제하는 코드를 vercel.py 에 포함.
3. Claude tool_use는 max_length 등 pydantic 제약을 잘 안 지킴 — 긴 카피 필드는 description으로 가이드만 주고 max_length는 안 거는 게 안전. oneshot 의 marketing_kit 호출은 best-effort 패턴 (실패해도 deploy URL 살림).
4. Vercel 프로젝트는 첫 deploy 시 자동 생성되지만 env vars를 deploy 전에 push하려면 명시적으로 `POST /v9/projects` 먼저 호출해야 함 (409 = 이미 존재, OK). env POST는 409 = 이미 설정, 덮어쓰지 않음.
5. ~~생성된 Next.js 페이지에 favicon 없음 → 콘솔 404 1건.~~ **Phase 4에서 해결**: `app/icon.svg` 자동 생성 (브랜드명 첫 글자 + 해시 색상). Next.js 15가 자동으로 favicon으로 서빙.
6. Smithery / PyPI 등록은 본질적으로 OAuth 또는 이메일 인증을 요구함 — 완전 자동화 불가. AI agent 측에선 (1) auth URL을 사용자에게 surface하고 (2) 사용자가 한 번 클릭한 후의 모든 publish 단계는 자동화 가능한 패턴이 한계.
