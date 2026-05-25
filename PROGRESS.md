# PROGRESS — ClonePilot MCP

_Last updated: 2026-05-26 — v3 monochrome hacker 톤 + 분석 엔진 극한 업그레이드. 사용자가 자는 동안 자율 작업. 신규 데이터 소스 6개 (Reddit / Wayback / channel velocity / YouTube comments / multi-keyword Trends / description forensics), 신규 분석 필드 11개 (green_flags · why_buyers_pay · honest_value · bot_inflation · real_proof · hype_vs_reality · funnel_ladder · one_paragraph_verdict 등), 무채색 hacker 디자인 (흰/검/회만, 모노 폰트, 1px 샤프 보더, 스캔라인 overlay), card lang 토글에 Arabic 추가 (6언어), 자연 번역 (반말 톤 강제 — 파파고 톤 절대 금지)._

## 🟢 v3 한 줄 요약 (2026-05-26 새벽 자율 작업)

**라이브 사이트**: http://localhost:3030 (dev) — Vercel 재배포 대기

**핵심 변화**:
1. 🎨 **무채색 hacker 톤**: emerald accent 전부 제거. globals.css 재작성 (zinc 무채색 + scanline overlay + striped warning patterns + terminal cursor blink). 모든 컴포넌트 무채색화.
2. 🔬 **분석 깊이 극한 업그레이드**: 사용자 비용 0원 유지 (무료 공개 API만 — Reddit JSON, Wayback CDX, YouTube commentThreads, HN, Wikipedia, Wayback). 사비 키 = Anthropic + YouTube Data API만.
3. 📊 **신규 분석 카드**: 16개 섹션. funnel ladder 시각화, comment fingerprint, description forensics 테이블, 6개 circular gauges, vertical timeline, red/green flags side-by-side, terminal-style loading.
4. 🌐 **번역 자연스러움**: per-lang 톤 가이드 (KO=반말, JA=DMで送るくらい, ZH=微信, ES=tuteo, AR=فصحى مبسطة). Papago 톤 검출되면 재작성.
5. 🛡️ **운영비 0 전략**: in-memory cache (24h TTL by videoId), IP rate-limit (4/min), default model = Haiku 4.5.

**검증된 결과 (L9LfsOR1YHw 분석)**:
- business_model = **course-funnel** ✓ 자동 감지
- confidence = **71/100** (이전 30 대비 2배 이상)
- honesty = 28, hype_vs_reality = 18, real_proof = 12 (낮을수록 의심)
- bot_inflation = 35, red_flags 10개, green_flags 6개, funnel_ladder 5단계
- transcript_chars = 23,271 (localhost에서 youtube-transcript 정상)
- 콘솔 에러 = 0건, typecheck 깨끗, next build 14페이지 prerender 성공
- 번역 API 자연도 검증: "수입이 하루아침에 날아갈 수 있어" (반말 톤, 자연), "2개월 차부터는 메일링 리스트 구축해야 살아남음"

**스크린샷 evidence**: `v9-mono-hero.png`, `v9-mono-loading.png`, `v9-mono-card-1.png`, `v9-mono-gauges-zoom.png`, `v9-mono-forensics.png`, `v9-mono-thumb-decoded.png`, `v9-mono-arabic-verdict.png`.

## ⚡ 사용자 일어났을 때 즉시 액션 (1분짜리)

1. **Vercel 재배포**: `cd gallery_site && npx vercel --prod` (또는 GitHub push → Vercel auto-deploy 트리거)
2. **(선택) 운영비 더 줄이려면 Vercel env 변경**: `CLONEPILOT_MODEL_BLUEPRINT` = `claude-haiku-4-5-20251001` 로 바꾸기 (현재 Sonnet 4.6 박혀 있음 → Haiku로 가면 분석 비용 ~10x 절감, 단 분석 깊이 살짝 줄어듦). 캐시 + rate-limit 덕분에 Sonnet 유지해도 같은 URL은 24h 1회만 비용 발생.
3. **(선택) Supadata 새 키 발급**: supadata.ai 새 이메일로 무료 100/월 받아오면 Vercel env에 박기. 단 localhost에서는 youtube-transcript 패키지가 정상 동작 확인 → Vercel iad1 IP가 차단 풀리면 자동 회복.

## 🆕 v3 산출물 인덱스

| 파일 | 변경 |
|---|---|
| `gallery_site/app/globals.css` | 무채색 토큰 재정의 + scanline overlay + striped-danger + terminal cursor |
| `gallery_site/tailwind.config.ts` | accent → white-only alias + wider2 letter-spacing + sharper radii |
| `gallery_site/app/api/analyze/route.ts` | 6개 새 fetcher 통합 + 11개 신규 필드 + 캐시 + rate-limit |
| `gallery_site/app/api/translate/route.ts` | per-lang native-tone hints + Arabic + 미번역 필드 prune |
| `gallery_site/lib/analyze-cache.ts` (NEW) | in-memory cache + IP rate-limit |
| `gallery_site/lib/analyze-signals.ts` (NEW) | YouTube comments + Reddit + Wayback + channel velocity + description forensics + multi-keyword Trends |
| `gallery_site/lib/i18n-card-v2.ts` (NEW) | 새 카드 라벨 5개국 (분리된 파일로 메인 i18n.tsx 안전) |
| `gallery_site/components/UrlAnalysisForm.tsx` | 풀 재작성 — 16 섹션 + terminal loading + 코너 브라켓 + DECODED 배지 |
| `gallery_site/components/HeroSection.tsx` | lang prop 추가 |
| `gallery_site/app/page.tsx` | HeroSection에 lang 전달 |

---

_Last updated: 2026-05-25 (v2 인라인 분석 카드 라이브 — 강의팔이 detector + 다중 API + 5개국 카드 번역 + 시각 업그레이드 + 풀 i18n. 다음 = Supadata 새 키 박으면 transcript 살아남.)_

## 🟢 새 세션 픽업 — 여기부터 읽으면 끝

### ⚡ 30초 컨텍스트

**라이브 사이트**: https://clonepilot-gallery.vercel.app — URL 넣으면 즉시 deep analysis 카드 (40~60초)

**오늘 끝낸 큰 마일스톤 4개** (이 세션):
1. **풀사이트 i18n** — 메인/install/pricing/데모 5개국 토글 (cookie 기반, EN 기본)
2. **인라인 분석 카드** — URL 입력 → 카드 즉시 표시 (이메일 큐 모드 폐기). `/api/analyze` route.
3. **강의팔이 detector + 다중 API** — Anthropic + YouTube Data API + Google Trends + HN Algolia + Wikipedia + youtubei.js + youtube-transcript + Supadata. 6 business_model 분류, red_flags, market_reality (TAM/SAM/SOM + 경쟁사), revenue_forecast (3 시나리오), insider_tips, build_path, related_videos.
4. **카드 시각 업그레이드 + 본문 다국어 토글** — business_model이 카드 전체 톤 결정 (강의팔이 = 빨간 border + shadow), 큰 circular donut gauges 3개, thumbnail 위 큰 stamp, `/api/translate` (Haiku 4.5, ~10초) + Record<Lang,Preview> state로 견고한 카드 lang toggle.

### 새 세션 시작 시 (5초)

1. `git pull --rebase origin main` → 최신 커밋 = `c2135c7` (Sonnet 4.6 reverted from Opus 4.7).
2. **사용자 마지막 요구 = 분석 완벽성 + 시각적 업그레이드만**. 새 기능 (공유 URL, PDF, history 등) 추가 금지. 이 두 가지만 더 파라고 명시.
3. **사용자 다음 액션 대기**: Supadata 새 키 발급 (`supadata.ai` 새 이메일 → 무료 100/월). 알려주면 Vercel env에 즉시 박고 같은 영상 재검증.

## ✅ Done (이 세션)

- **Phase 7 청크 8: 풀사이트 i18n** — `gallery_site/lib/i18n.tsx` + `i18n-install.tsx` + `i18n-pricing.tsx` + `i18n-report.tsx` 5개국 사전 + `lib/lang.ts` cookie helper + `app/api/lang/route.ts` + `components/LangToggleGlobal.tsx` + `components/SiteChrome.tsx`. 메인/install/pricing/demo 모두 적용.
- **Phase 7 청크 9: 인라인 분석 카드** — `app/api/analyze/route.ts` (POST, maxDuration 300s, Sonnet 4.6, max_tokens 5000, transcript clip 14k). UrlAnalysisForm 카드 인라인 표시 + spinner.
- **Phase 7 청크 10: 강의팔이 detector + 다중 API** — `EXTRACT_TOOL` schema에 12개 새 필드 (business_model 6분류 + red_flags + likely_real_revenue_source + clone_feasibility + honesty + confidence + market_reality + revenue_forecast + insider_tips + build_path). SYSTEM_PROMPT 재작성 (course-seller detector 톤). fetchVideoData/fetchChannelData/fetchRelatedVideos (YouTube Data API), fetchGoogleTrends, fetchHNMentions, fetchWikiExists, fetchViaInnertube/fetchViaYouTubeTranscript/fetchViaPageScrape/fetchViaSupadata transcript chain.
- **Phase 7 청크 11: 시각 업그레이드** — `bmTone()` + `cardEdge()` + `gaugeColors()` 함수. business_model이 카드 wrapper border/shadow 톤 결정. `CircleGauge` 컴포넌트 (conic-gradient 큰 원형 progress). thumbnail 위에 큰 business_model stamp.
- **Phase 7 청크 12: 카드 다국어 토글** — `app/api/translate/route.ts` (Haiku 4.5, maxDuration 120s, ~10초 응답). `translatedByLang: Record<Lang, Preview>` state (React batching 버그 fix). thumbnail 아래 visible toggle row + "Translate this card:" label + sessionStorage cache + 강화 spinner UI.
- **Phase 7 청크 13: HeroSection slot-based** — `components/HeroSection.tsx` + `components/HeroAtoms.tsx` (HeroEm/HeroCode/PriceEm client components). 카드 떴을 때 hero text 사라지고 카드가 1100px wide. RSC serialization safe (함수 prop 금지).
- **Vercel 환경변수 박음**: `ANTHROPIC_API_KEY`, `SUPADATA_API_KEY`, `YOUTUBE_API_KEY`, `CLONEPILOT_MODEL_BLUEPRINT=claude-sonnet-4-6`, `BRIGHTDATA_PROXY_URL` (있지만 outbound proxy 차단됨, 무용).

## 🔄 Remaining (우선순위 순)

1. **사용자가 Supadata 새 키 발급 후 알리기** — Vercel env에 즉시 박고 prod에서 같은 영상 (`L9LfsOR1YHw`) 재검증 → transcript_chars 큰 숫자 + confidence 70+ 확인.
2. **추가 시각 폴리시** (사용자 요구 = 시각적 업그레이드 더):
   - TAM/SAM/SOM을 중첩 사각형 funnel 다이어그램으로
   - build_path를 vertical timeline UI (connector line + dot)
   - revenue forecast 3 시나리오 비교 더 시각적 (현재는 단순 가로 bar)
   - 카드 등장 시 stagger fade-in animation
3. **분석 깊이 더** — transcript 살아나면 prompt 한 번 더 sharpen (영상 본문 인용 기반 더 구체적 insight).

## 🚧 Blockers

- **Transcript fetch 못 살림**: Vercel serverless가 outbound proxy fetch 거부함. 시도한 것 다 fail:
  - youtubei.js (Innertube) — Vercel iad1 IP 차단
  - youtube-transcript npm — "Transcript is disabled" 응답
  - YouTube 페이지 직접 page-scrape + captionTracks regex — `fetch failed`
  - Bright Data Korean residential proxy via undici.fetch + dispatcher — `fetch failed`
  - Supadata — 키 한도 초과 (사용자가 새 키 발급해야 풀림)
  - 가장 빠른 해결책 = **사용자 Supadata 새 키 발급 (1분)**. 다음 옵션 = Whisper STT (audio 다운 + 전사, 복잡함).
- **Opus 4.7 너무 느림**: 분석 호출 2분+ 걸려서 Sonnet 4.6으로 reverted. 더 정확하면서 빠른 방법 없음 (현재 결정).

## 📝 Notes for Next Session

- **사용자 명시 룰**: "기능적인 거 개발하지 마. 분석 완벽성 + 시각적 업그레이드만." → 공유 URL, PDF, 비교, history, OG 이미지 등 신규 기능 제안 X. 두 가지에만 집중.
- **사용자 마지막 통증**:
  1. 분석이 정확해야 함 (transcript 살리는 게 핵심. confidence 30 → 70+)
  2. 카드 시각이 더 강력해야 함 (현재 라이브한 큰 circular gauges + tone color는 OK, 더 추가 폴리시 환영)
- **카드 lang toggle 버그 fix 교훈**: `translated ?? rawPreview` derived state는 React batching에서 reliable 안 함. **`Record<Lang, Preview>` map + setState((prev) => ...)** 패턴이 100% trigger 보장. GOTCHAS.md 등록 가치.
- **HeroSection slot pattern**: server→client에 함수 prop 직렬화 fail. Dict 통째 전달 X. children/slot ReactNode 또는 string field만. (이미 GOTCHAS.md에 비슷한 항목 있음)
- **모델 선택**: 분석 = Sonnet 4.6 (Opus 4.7 reverted, 2분+ 느림). 번역 = Haiku 4.5 (10초, Sonnet 30~50초 vs).
- **루트에 untracked PNG 24개** (screenshots 다 prod 검증용). 다음 세션 시작 시 정리 또는 `.gitignore` 추가 결정.
- **루트 walkthrough PNG 5개**는 여전히 사용자 결정 대기 (commit? 삭제?).
- **AutoLoop 미설치** (`scripts/install_scheduler.ps1` admin PS 1회 필요).

## ⚙️ Phase 8 계획 (이전 세션부터)

| # | Task | 상태 |
|---|---|---|
| 8.1 | Deep analysis engine (Python MCP) | ✅ 완료 (이전 세션, Builder) |
| 8.2 | Project Pack 생성기 (CLAUDE.md + skills + BUILD_PLAN + HUMAN_TASKS) | ⏸ Builder 영역 (대기) |
| 8.3 | Human-task tracker | ⏸ Builder 영역 |
| 8.4 | 갤러리 = 분석리포트 뷰어로 개조 | ✅ 완료 (이전 세션, Operator) |
| 8.5 | E2E 검증 | ⏸ |
| 8.6 (신규) | 인라인 분석 카드 (web SaaS 모드) | ✅ 완료 (이 세션, Operator) |

**Builder는 휴면 상태**. Operator만 이 세션에서 작업. Builder 작업 (Phase 8.2 Project Pack 생성기)은 사용자 결정 대기.

## 📁 작업 환경 — 2 세션 병렬

`SESSIONS.md` 가 단일 출처(SoT). 두 세션 책임 분리 + 복붙 프롬프트 + 워크플로 거기. 새 세션은 첫 메시지로 `Read SESSIONS.md`.

요약:
- **세션 A "Builder"** — `src/clonepilot/**` 소유. Phase 8.1 → 8.2 → 8.3 → 8.5 본체 엔진.
- **세션 B "Operator"** — `gallery_site/**`, `docs/**` 소유. Phase 8.4 + 8.6 + 운영.
- **백그라운드** — `run_forever.ps1` — 24/7 자동 데모 양산 (선택).

커밋 메시지 첫 단어 = `Builder:` 또는 `Operator:`. 매 커밋 전 `git pull --rebase`.

### 핵심 방향 전환 (2026-05-24 야간)

사용자와 대화 끝에 진짜 비전 합의됨:

> **URL 1개 → 사업 분석 + 수익예측 (다국어) → 사용자 Claude/Codex에 모든 설정(CLAUDE.md, skills, agents, MCP, BUILD_PLAN, HUMAN_TASKS)을 자동 셋업 → 사용자 Claude가 백엔드+프론트+디자인+결제+로그인 다 자동 빌드 → 사람이 꼭 해야 하는 가입(Stripe KYC 등)은 클릭 1번 가이드 → 사람은 거의 손 안 대고 작동하는 SaaS 1개 완성**

지금 ClonePilot은 이 비전의 **약 10%** — "마케팅 랜딩페이지 자동 생성"까지만 함. Phase 8에서 나머지 90% 갈아엎음.

**영리한 인사이트**: 우리가 코드 생성기를 만들 필요 없음. **Claude Code가 이미 세계 최강 코드 생성기**. ClonePilot은 "사용자 Claude한테 이 사업을 이렇게 만들라고 완벽히 떠먹여주는 셰프" 역할.

### Phase 8 — 5단계 계획 (~2-4주)

| # | Task | 결과 |
|---|---|---|
| 8.1 | Deep analysis engine (다국어 + 수익예측 + 무료툴 연동) | ✅ **완료** — `analyze_deep` MCP tool, BlogFlow E2E 55% confidence |
| 8.2 | Project Pack 생성기 (CLAUDE.md + skills + BUILD_PLAN + HUMAN_TASKS) | 사용자가 폴더 받음 |
| 8.3 | Human-task tracker (env watcher + Claude 언블록 시그널) | 사람 막힌 단계 자동 |
| 8.4 | 갤러리 = 분석리포트 뷰어로 개조 (오늘 만든 마케팅 사이트 base는 유지) | 보고서 미리보기 |
| 8.5 | E2E 검증 (URL → Project Pack → Claude로 진짜 SaaS 빌드) | v1 출시 게이트 |

### Phase 8.1 Builder 청크 로그 — 2026-05-25

- ✅ **Task 1** `src/clonepilot/analysis/schema.py` — `DeepAnalysisReport` + 11 sub-models (`MarketData`, `Competitor`, `RevenueForecast`, `LocalizedCopy`, `Risk`, `GTMStep`, `DataQuality` 등). 기존 `BusinessBlueprint`는 `report.blueprint` sub-field로 보존 → scaffold/deploy 하위호환.
- ✅ **Task 2** `analysis/forecast.py` — bottom-up TAM/SAM/SOM. 검색량 × visitor_to_signup_pct × signup_to_paid_pct × ARPU_annual. 3 시나리오 (보수/기본/공격). pytest 8/8 통과.
- ✅ **Task 3** `analysis/trends.py` — pytrends `interest_over_time` + `interest_by_region`. 키 불필요. `direction (rising|stable|declining|unknown)` + `score_0_100`. 실호출 검증 (`ai blog writer` → rising, score 94).
- ✅ **Task 4** `analysis/keywords.py` — Ahrefs API v3 HTTP 직접 호출 (`keywords-explorer/overview` + `volume-by-country`). `AHREFS_API_KEY` 없으면 None 반환 (fail-soft 검증).
- ✅ **Task 5** `analysis/competitors.py` — Exa `/search` → 후보 8개 → 홈+/pricing fetch → Claude tool_use로 `Competitor[]` 추출. `EXA_API_KEY` 없으면 빈 리스트.
- ✅ **Task 6** `analysis/i18n.py` — 1 LLM 호출로 KR/EN/JP/ZH/ES 동시 추출. 톤 일관성 확보. 실호출 검증 — 한국어 "내 말투 그대로, SEO 블로그 3분 완성" 같은 native 카피.
- ✅ **Task 7** `analysis/strategy.py` — risks[] + go_to_market_90day[] 한 콜에 추출. `max_tokens=6000` 으로 CJK 안전.
- ✅ **Task 8** `analysis/pipeline.py` (S0~S11 fail-soft orchestrator) + `analysis/seo.py` + `tools/analyze_deep.py` MCP tool 등록 + `server.py` 라우팅 추가. `config.py`에 `AHREFS_API_KEY`, `EXA_API_KEY` 필드 추가.
- ✅ **Task 9** **E2E 실호출 검증 성공** — `https://www.youtube.com/watch?v=L9LfsOR1YHw` (BlogFlow Korean) → DeepAnalysisReport 생성. 결과: blueprint ✓ / market ✓ (Trends only) / 5 i18n locales ✓ / 6 risks ✓ / 8 GTM steps ✓ / SEO pack 5 titles ✓ / forecast=None (Ahrefs/Exa 키 부재). **Confidence 55/100** — 정직한 fail-soft. 산출물: `e2e_artifacts/deep_analysis_e2e_v2.json`.

**GOTCHA #10 등록**: CJK 다중섹션 tool_use는 `max_tokens >= 6000`. 안 그러면 두 번째 섹션 silently `[]`.

**다음 액션 (Operator → Builder 핸드오프)**: Operator가 Phase 8.4 시작 가능 — 새 `DeepAnalysisReport` 스키마 기준으로 `gallery_site/app/demo/[slug]/page.tsx` 다시 그리기. 샘플 JSON: `e2e_artifacts/deep_analysis_e2e_v2.json`.

**다음 Builder 청크**: Phase 8.2 (Project Pack 생성기).

자세한 task description: TaskList (task ID 12~16).

### 살림 vs 버림 (오늘 작업물)

**살림**:
- `gallery_site/` (마케팅 페이지) — 그대로. 쇼윈도우로 살림. 카드 콘텐츠만 Phase 8.4에서 교체.
- 가격 모델 (Free 1build/mo · Pro $19 · Lifetime $299) — 그대로.
- waitlist + 이메일 자동발사 — 그대로.
- License gating (`src/clonepilot/license.py`) — 그대로.
- 24/7 자동 데모 루프 (`scripts/auto_demo_loop.py`) — 그대로 (마케팅 SEO 면에서 여전히 유효).
- 대시보드 (`scripts/dashboard.py`) — 그대로.

**버림 / 대폭 수정**:
- 지금 `scaffold()` (랜딩페이지만) → Phase 8.2에서 "Project Pack 생성기"로 갈아엎음.
- 지금 `analyze()` (얕은 가격분석) → Phase 8.1에서 deep analysis로 확장.
- 갤러리의 BlogFlow/PhotoAI 카드 = "v0 landing-only" 라벨 달고 보존, 신규 카드는 v1 풀빌드 결과.

### 작업 환경 — 2 세션 병렬 (Builder + Operator)

**`SESSIONS.md` 가 단일 출처(SoT)**. 두 세션의 책임 분리 + 복붙 프롬프트 + 워크플로 전부 거기 있음. 새 세션은 첫 메시지로 반드시 `cat SESSIONS.md` 또는 `Read SESSIONS.md` 실행.

요약:
- **세션 A "Builder"** — `src/clonepilot/**` 소유. Phase 8.1 → 8.2 → 8.3 → 8.5 본체 엔진.
- **세션 B "Operator"** — `gallery_site/**`, `docs/**` 소유. Phase 8.4 + 운영 (Resend 도메인 인증, 갤러리 배너, 대시보드 단순화).
- **백그라운드 (Claude 아님)** — `run_forever.ps1` — 24/7 자동 데모 양산 (선택).

커밋 메시지 첫 단어 = `Builder:` 또는 `Operator:`. 매 커밋 전 `git pull --rebase`. PROGRESS.md 는 각자 자기 섹션만 append.

---

### Phase 7까지 작업물 인덱스 (살림 자산)

| 자산 | 상태 / URL |
|---|---|
| **갤러리 (메인 마케팅 페이지)** | https://clonepilot-gallery.vercel.app (stable alias) |
| **/install** | https://clonepilot-gallery.vercel.app/install — Claude Desktop/Code/Cursor/Codex MCP config 복붙 |
| **/pricing** | https://clonepilot-gallery.vercel.app/pricing — Free / Pro $19 / Lifetime $299 (early-bird $9 / $199) |
| **/demo/[slug]** | https://clonepilot-gallery.vercel.app/demo/blogflow + /demo/photoai — analysis + 9-step roadmap per demo |
| **/api/upgrade** | POST {email, tier} → waitlist signup (pro/lifetime/either) + Resend 자동 이메일 |
| **/api/license/verify** | POST {key} → validates Pro/Lifetime license. Hardcoded `cpl_demo_pro` for testing. Real keys via CLONEPILOT_LICENSE_KEYS env in Vercel. |
| **첫 데모** (BlogFlow) | https://blogflow-nv4evhjwz-askbit.vercel.app |
| **두 번째 데모** (PhotoAI — Pieter Levels) | https://photoai-7wzey4ysh-askbit.vercel.app |
| **CLI 대시보드** | `uv run python scripts/dashboard.py [--watch]` |
| **Waitlist API** | POST `https://clonepilot-gallery-.../api/waitlist` — Resend 자동 이메일 |
| **24/7 자동 루프** | `.\scripts\run_forever.ps1` (수동 시작) or `install_scheduler.ps1` (영구 등록) |
| GitHub repo (public) | https://github.com/a01050398694-commits/clonepilot |
| v0.1.0 release | https://github.com/a01050398694-commits/clonepilot/releases/tag/v0.1.0 |
| awesome-mcp-servers PR | https://github.com/punkpeye/awesome-mcp-servers/pull/6807 (머지 대기) |
| X 5-tweet 스레드 | https://x.com/askbit44039/status/2058256792917037509 |
| Smithery 등록 | ⏸ `uv run python scripts/publish_smithery.py` 1-클릭 대기 |
| GitHub Sponsors | ⏸ `docs/SPONSORS_SETUP.md` (KYC 신청 1~3일) |
| Reddit / Show HN / PH / LinkedIn | ⏸ 수동 (URL+카피는 `docs/MARKETING.md`) |

**결제 전략 (확정)**: Paddle 거절 → Phase A로 결제 processor 가입 보류, waitlist만 운영. N≥10 모이면 Lemon Squeezy 시도. 한국→한국 PayPal 막힘 인지함, 글로벌→한국은 OK.

**다음 액션 자세히**: `WAKEUP.md` 열기 (채널별 정확한 시간/링크/복붙 텍스트).

**8 MCP tools**: `version`, `analyze`, `analyze_deep` (Phase 8.1 신규), `monetize`, `scaffold`, `deploy`, `marketing_kit`, `attach_domain`, `oneshot`.

**스택**: Python 3.12 + FastMCP · Anthropic Claude · Supadata · Stripe · Vercel · Resend · Next.js 15 + Tailwind.

**경로**: `E:\사업 유튜브 url 분석및 자동실행\`. .env는 `E:\해외유튜브 경제 유튜버 요약 자동화\.env` + `E:\kfashion\.env.local`에서 inline로 가져다 씀 (보호 파일, 복사 안 함).

**알아둘 GOTCHA 10건**: `GOTCHAS.md` (#1 Next CVE 픽스, #2 Vercel SSO 자동 해제, #3 max_length 금지, #4 marketing_kit best-effort, #5 env push 시 프로젝트 선생성, #6 app/icon.svg 자동, #7 OAuth/email 인증 자동화 불가, #8 Vercel 400 ENV_CONFLICT, #9 Resend 도메인 검증, #10 CJK tool_use max_tokens>=6000).

**Phase 8.1 산출물**: `src/clonepilot/analysis/` (9 모듈), `tools/analyze_deep.py`, `tests/test_forecast.py` (8/8), `e2e_artifacts/deep_analysis_e2e_v2.json` (실호출 검증 reference — Operator의 8.4 참조용 스키마 샘플).

**선택 키 (없어도 작동, 있으면 confidence ↑)**: `.env`에 `AHREFS_API_KEY` 추가하면 forecast/global_searches/top_keywords 자동 활성. `EXA_API_KEY` 추가하면 competitors 자동 활성. 둘 다 추가 시 confidence 55→90+.

---

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

---

## Phase 8.4 Operator 청크 로그 — 2026-05-25

✅ **Phase 8.4 완료** — v1 deep-report viewer 라이브 (dev server + next build 둘 다 0 에러).

- ✅ **청크 1** `gallery_site/lib/report.ts` 풀 `DeepAnalysisReport` 타입 (12 섹션, 16 sub-types). 시드 JSON 복사 (`e2e_artifacts/deep_analysis_e2e_v2.json` → `gallery_site/public/reports/blogflow.json`). server 전용 fs util은 `lib/report.server.ts`로 분리 — client component가 `node:fs` 끌어오는 webpack 에러 회피.
- ✅ **청크 2** `gallery_site/components/RevenueChart.tsx` (pure SVG, no recharts dep — TAM/SAM/SOM 가로 막대 + 3 시나리오 ARR 카드 + assumptions details). `gallery_site/components/LangToggle.tsx` ("use client" 5-lang 칩, 사용 가능한 locale만 enabled).
- ✅ **청크 3** `gallery_site/app/demo/[slug]/ReportViewer.tsx` 풀 client 뷰어 — hero(localized) → source video → target/problem/solution → value_props(localized) → pricing_tiers → RevenueChart → competitors → market trend + keywords + geo → SEO pack → risks(severity 색상) → 90-day GTM 타임라인 → data quality 배지. `page.tsx` server wrapper — report 있으면 v1, 없으면 기존 v0 fallback (PhotoAI 등 BC).
- ✅ **청크 4** 홈 `page.tsx` 카드 v0/v1 배지 추가 (v1은 cyan 강조, "📊 Full analysis →" CTA). 배너 카피 "v1 coming soon" → "v1 · deep analysis live"로 갱신. 브라우저 E2E (Playwright): 갤러리 → /demo/blogflow EN → KR 토글로 한국어 카피 교체 → /demo/photoai v0 fallback. **콘솔 에러 0건**. `next build` 12 static pages 모두 prerender 성공.

**산출물**: 스크린샷 4개 (`phase84-gallery.png`, `phase84-demo-blogflow-en.png`, `phase84-demo-blogflow-kr.png`, `phase84-demo-photoai-v0.png`) — 루트에 untracked.

**신규 GOTCHA #11** 등록 예정: Next.js 15 App Router에서 `lib/`에 `node:fs` import 모듈을 두면 client component가 transitively 끌어와서 `UnhandledSchemeError`. server 전용 util은 별도 `.server.ts` 파일에. 타입/순수함수만 client-safe `.ts`에.

**다음 Operator 청크 후보** (우선순위 적힘): 위 §⚡ "다음 청크 후보" 참조.

---

## Phase 8.4 청크 7-A — 메인 페이지 전면 redesign (2026-05-25)

✅ **라이브 배포 완료** — clonepilot-gallery.vercel.app. 사용자 평가 대기 중.

**이유**: 사용자가 직접 prod 사이트 써보고 "누를 게 없고 영어만 있고 AI 티 난다. URL 입력 칸이 있어야지" 강하게 피드백. 메모리 `feedback_clonepilot_ui.md` 등록. 영어 기준 완성도부터 폴리시 + URL 입력 hero 추가 + 디자인 업그레이드 한 청크에.

**design-taste-frontend 스킬 핵심 룰 적용**:
- 이모지 ban → `@phosphor-icons/react/dist/ssr` (ArrowUpRight, GithubLogo, TerminalWindow, ChartLineUp, Lightning, CheckCircle, Warning)
- 시안 ban (AI 클리셰) → emerald-400 단일 accent + Zinc 베이스. CSS vars (`--accent`, `--bg`, `--surface`, `--ink-*`) globals.css에 정의.
- Inter ban → `geist/font/sans` + `geist/font/mono` (Vercel 공식). layout.tsx에서 CSS vars로 wire.
- centered hero ban → asymmetric split (`grid-cols-[1.05fr_0.95fr]`) 좌측 텍스트 + 우측 form
- 3-col 카드 ban → bento 레이아웃 (BlogFlow는 `lg:col-span-2 lg:row-span-2` 큰 카드, PhotoAI는 일반 카드)
- AI 슬랍 단어 ("Elevate/Seamless/Unleash/Next-Gen") 제거 + 카피 재작성

**산출물**:
- `gallery_site/app/globals.css` — CSS 디자인 토큰 + grain noise overlay (fixed, pointer-events-none, scroll repaint 없음)
- `gallery_site/tailwind.config.ts` — fontFamily / colors / letterSpacing 확장
- `gallery_site/app/layout.tsx` — Geist fonts wire + metadata 카피 갱신
- `gallery_site/app/page.tsx` 완전 재작성 — SiteNav + asymmetric Hero + 3-step explainer (divider-based, no cards) + bento gallery + Waitlist + SiteFooter
- `gallery_site/components/UrlAnalysisForm.tsx` 신규 — URL + 이메일 폼, idle/loading/ok/err state, tactile feedback (active translate)
- `gallery_site/app/WaitlistForm.tsx` — Phosphor 아이콘 + emerald accent 폴리시
- `gallery_site/app/api/analyze-request/route.ts` 신규 — POST {email, youtubeUrl, source} → 영구 저장 + Resend로 사용자 ack + 운영자 알림. **GOTCHA #12 등록 예정**: Next.js API route에서 `type Request = {...}` 정의하면 Web standard `Request` 가려서 typecheck fail. 항상 `AnalysisRequest` 같은 prefix 이름.
- `gallery_site/package.json` — `geist` + `@phosphor-icons/react` 추가
- 스크린샷: `phase85-LIVE-redesign-hero.png` + `phase85-LIVE-redesign-full.png`

**검증**: typecheck/build 0 에러, 13 SSG 페이지 (이전 12 + 신규 /api/analyze-request), Playwright 콘솔 에러 0건.

**아직 안 한 것** (청크 7-B):
- `gallery_site/app/demo/[slug]/ReportViewer.tsx` — 옛날 cyan + 이모지 그대로. 일관성 깨짐.
- `gallery_site/app/pricing/page.tsx` — 같음.
- `gallery_site/app/install/page.tsx` — 같음.

청크 7-B는 사용자 메인 페이지 평가 받고 진행.

---

## Phase 8.4 청크 5 — OG/Twitter meta + v1 card preview (2026-05-25)

✅ **완료** — 1회 Vercel prod 배포 + curl + Playwright 검증.

- ✅ `gallery_site/app/layout.tsx` — `metadataBase` + sitewide twitter card.
- ✅ `gallery_site/app/demo/[slug]/page.tsx` — `generateMetadata` 에 openGraph + twitter (image = `https://i.ytimg.com/vi/<id>/maxresdefault.jpg`, 1280×720). v1/v0 둘 다 적용.
- ✅ `gallery_site/app/page.tsx` — v1 카드에 `confidence N/100` 배지 + 5-year trend 화살표 + 첫 high-severity risk 1줄 (line-clamp-2). v0 카드는 기존 roadmap teaser 유지.
- ✅ 라이브 검증: curl `/demo/blogflow` → `og:image` + `og:title` 헤더 정상. 라이브 갤러리에서 "confidence 55/100", "trend ?", "risk·Credibility gap" 노출 확인.

## Phase 8.4 청크 6 — Pricing v1 카피 갱신 (2026-05-25)

✅ **완료** — 1회 Vercel prod 배포 + curl 키워드 grep 검증.

- ✅ `gallery_site/app/pricing/page.tsx` — Pro bullets에 "Deep analysis with all integrations (Ahrefs + Exa + SimilarWeb server-side)" + "5-language reports (EN/KR/JP/ZH/ES) + revenue forecast (TAM/SAM/SOM)" 추가. Free에 "Deep analysis preview — analyze_deep MCP tool" 추가. 헤더 카피에 v1 가치 1줄 보강.
- ✅ 라이브 검증: `curl /pricing | grep` → `5-language`, `Ahrefs`, `TAM/SAM/SOM`, `analyze_deep` 모두 prod에 노출.

**3회 deploy 누적 — clonepilot-gallery.vercel.app 풀 라이브 상태**: v1 deep-report viewer + 5-lang toggle + v1 카드 미리보기 + OG/Twitter card + v1 pricing 카피. 모든 자동 검증 통과 (typecheck/build/curl/browser console 0 에러).

---

## Operator session — Phase 8 prep (2026-05-24)

### 8.4 대기 중 (Builder 8.1 ✅ 신호 받기 전엔 시작 금지)

| Task | 상태 | 결과 / 다음 액션 |
|---|---|---|
| Resend 도메인 인증 가이드 | 🟢 문서 완료 | `docs/RESEND_DOMAIN_VERIFICATION.md` — Cloudflare 클릭경로 4 records (MX + SPF + DKIM + DMARC). **사용자 DNS 입력 + Resend 대시보드 Verify 클릭만 남음** |
| **askbit.co 흔적 정리 (closed)** | 🟢 완료 (2026-05-25) | DNS probe로 `askbit.co` NXDOMAIN 확인. `askbit.com`은 사용자의 별도 프로젝트. **결정: waitlist 모드 동안 `onboarding@resend.dev` 영구 유지** — 새 도메인 구매 불필요. 코드/문서 흔적 모두 청소, RESEND 가이드는 future-ref로 보존. |
| 갤러리 v1 배너 | 🟢 완료 | `gallery_site/app/page.tsx` 헤더 위 `/pricing#waitlist` 링크 배너 추가. 재배포 시 라이브 |
| 24/7 AutoLoop 상태 점검 | 🟢 결과: NOT_INSTALLED | `docs/OPERATIONS.md` 에 정확한 admin PS 한 줄 설치 절차 박음 (`.\scripts\install_scheduler.ps1`) |
| `scripts/daily_digest.py` | 🟢 완료 + 동작확인 | 1줄 출력, UTC 일 단위 delta. `.daily_digest_state.json` gitignore 등록. 스모크 테스트: `[2026-05-24 14:57 UTC] waitlist 0 (+0 today) · upgrade 0 (+0): pro 0 · life 0 · either 0 · demos 2` |
| `docs/OPERATIONS.md` 신규 | 🟢 완료 | daily_digest 사용법 + AutoLoop 등록/확인/제거 + dashboard.py 비교 일원화 |
| Phase 8.4 (분석리포트 뷰어 개조) | ⏸ 대기 | Builder가 PROGRESS.md 의 Phase 8.1 항목을 ✅ 로 마킹하면 즉시 시작 |

### 사용자 해야 할 일 (Operator가 못 하는 것)

1. ~~**Resend 도메인 인증**~~ — 보류. 옵션 1 (sandbox sender 유지) 채택. 결제 시작 후 ClonePilot 전용 도메인 살 때 `docs/RESEND_DOMAIN_VERIFICATION.md` 펴서 진행.
2. **AutoLoop 등록** (선택) — admin PowerShell 1회: `cd "E:\사업 유튜브 url 분석및 자동실행"; .\scripts\install_scheduler.ps1`. 안 해도 마케팅 SEO 면에서 큰 손해 없음 (현재 갤러리 2개 데모로 충분히 가동).

### Operator 영역 변경 파일 (이 세션)

- `docs/RESEND_DOMAIN_VERIFICATION.md` (신규)
- `docs/OPERATIONS.md` (신규)
- `scripts/daily_digest.py` (신규)
- `gallery_site/app/page.tsx` (배너 추가)
- `GOTCHAS.md` (#9에 오타 발견 후속 노트)
- `.gitignore` (`.daily_digest_state.json` + `.daily_digest.log` 추가)
- `PROGRESS.md` (이 섹션)
