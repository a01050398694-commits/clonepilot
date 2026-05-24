# SESSIONS — Phase 8 병렬 작업 가이드

> 2개 Claude 세션을 동시에 돌리면서 충돌 없이 작업하기 위한 규칙.
> 사용자: 새 PowerShell 2개 열고 각각 `claude` → 첫 메시지로 `/status` → 이어서 아래 프롬프트 복붙.

---

## 세션 책임 분리 (파일 충돌 방지)

| 영역 | Builder 세션 (A) | Operator 세션 (B) |
|---|---|---|
| `src/clonepilot/**` | ✅ 소유 | ❌ 읽기만 |
| `gallery_site/**` | ❌ 읽기만 | ✅ 소유 |
| `docs/**` | ❌ 읽기만 | ✅ 소유 |
| `scripts/` (v1 분석/Project Pack 관련) | ✅ 소유 | ❌ |
| `scripts/` (dashboard, auto_demo_loop, run_forever) | ❌ | ✅ 소유 |
| `README.md`, `WAKEUP.md`, `CHANGELOG.md` | ❌ | ✅ 소유 |
| `PROGRESS.md` | 본인 phase 진척만 append | 본인 phase 진척만 append |
| `GOTCHAS.md` | 둘 다 append OK | 둘 다 append OK |
| `tests/`, `e2e/` | ✅ 소유 (단위) | ✅ 소유 (E2E 검증) |

**충돌 방지 룰**:
- 커밋 메시지 첫 단어 = `Builder:` 또는 `Operator:` (그래야 git log 봤을 때 누가 한 작업인지 한눈에)
- 매 커밋 직전 `git pull --rebase origin main` 필수
- PROGRESS.md 수정 시 각자 자기 섹션만 (Builder 섹션 vs Operator 섹션)
- 다른 세션 영역 파일 수정해야 하면 → 그 세션에 위임 (재시작/알림)

---

## 세션 A — "Builder" 복붙 프롬프트

```
너는 ClonePilot v1 "Builder" 세션이야. SESSIONS.md 읽고 너 책임 영역 확인해.

목표: PROGRESS.md의 Phase 8.1 → 8.2 → 8.3 → 8.5 순서대로 본체 엔진 갈아엎기.
(8.4는 Operator 세션 담당, 너는 건드리지 마)

지금 바로 들어가지 말고 먼저 Phase 8.1 (Deep analysis engine) 설계 1차안 보여줘:
1. 새 analyze() 가 어떤 JSON 스키마로 결과 뱉을지 (필드 이름 다 적힌 예시 JSON)
2. 어떤 외부 도구(Ahrefs MCP / SimilarWeb MCP / Exa / Google Trends / YouTube Data API) 어디 단계에서 호출할지
3. 다국어(KR/EN/JP/ZH/ES) 처리 방식 — 한 번 LLM 호출에 다 뽑을지 vs 언어별 호출
4. 수익예측은 어떤 공식/데이터로 계산할지 (TAM/SAM/SOM 추정 로직)

위 4개 확인하고 내가 OK 하면 그때 실제 코드 작업 들어가. 가짜 데이터 금지 — 모든 외부 API 실제 호출 검증하면서 진행.

규칙:
- 커밋 메시지 "Builder: ..." 로 시작
- 매 커밋 전 git pull --rebase origin main
- src/clonepilot/** 만 수정. gallery_site/** 는 절대 손대지 마 (Operator 영역)
- 외부 API 키는 .env 에 이미 있는 거 사용 (Anthropic, Supadata, YouTube, Vercel)
- 새 API 키 필요하면 작업 멈추고 사용자한테 묻기
- 모든 비자명 결정은 GOTCHAS.md 에 MUST/MUST NOT 으로 추가
```

---

## 세션 B — "Operator" 복붙 프롬프트

```
너는 ClonePilot v1 "Operator" 세션이야. SESSIONS.md 읽고 너 책임 영역 확인해.

목표: 갤러리 사이트 + 운영 작업. Builder 세션이 Phase 8.1 끝낼 때까지 갤러리 8.4는 대기.

지금 즉시 할 일 (Builder 안 기다려도 됨):

1. Resend 도메인 인증 가이드 — GOTCHA #9 영구 해결.
   askbit.co DNS에 추가해야 할 TXT/MX/DKIM 레코드 4줄을 사용자한테 정확히 보여주고,
   가비아 / Cloudflare 등 도메인 등록업체별로 어디 클릭해서 넣는지 스크린샷 또는 절차 안내.
   완료되면 LEAD_FROM_EMAIL 을 askbit.co 로 다시 전환 + 갤러리 재배포.

2. 갤러리에 작은 배너 추가:
   "v1 coming soon — full SaaS factory, not just landing pages.
   Join the waitlist to be first."
   → /pricing#waitlist 로 링크.

3. 24/7 자동 데모 루프 켜져있는지 확인:
   Windows Task Scheduler 에 "ClonePilot AutoLoop" task 존재하는지 사용자한테 물어봐.
   없으면 scripts/install_scheduler.ps1 안내.

4. (대시보드) 사용자가 dashboard.py --watch 어떻게 쓰는지 모를 수 있음.
   PowerShell 한 줄로 "오늘 신규 가입자 N명" 보여주는 더 단순한 daily_digest.py 만들어줘.

Builder가 Phase 8.1 끝내면 (PROGRESS.md 의 Phase 8.1 항목이 ✅ 으로 바뀌면) 즉시 Phase 8.4 시작:
- 새 deep-analysis JSON 스키마 받아서 gallery_site/app/demo/[slug]/page.tsx 를 그 스키마 기준으로 다시 그리기
- 다국어 토글 (KR/EN/JP/ZH/ES) 추가
- 수익예측 시각화 추가

규칙:
- 커밋 메시지 "Operator: ..." 로 시작
- 매 커밋 전 git pull --rebase origin main
- gallery_site/**, docs/**, README/WAKEUP/CHANGELOG 만 수정. src/clonepilot/** 는 절대 손대지 마 (Builder 영역)
- Phase 8.1 결과물이 필요한 작업은 Builder 완료 신호 (PROGRESS.md 의 ✅) 받기 전엔 시작 금지
- 사용자한테 결제 가입 요청 금지 (waitlist 모드 유지)
```

---

## 사용자 워크플로 (너 손에)

1. 현재 창 → 닫기
2. **PowerShell 새 창 #1**:
   ```
   cd "E:\사업 유튜브 url 분석및 자동실행"
   claude
   ```
   첫 입력: `/status` → 다음 입력: 위 "세션 A — Builder" 박스 통째로 복붙
3. **PowerShell 새 창 #2** (창 1과 별개):
   ```
   cd "E:\사업 유튜브 url 분석및 자동실행"
   claude
   ```
   첫 입력: `/status` → 다음 입력: 위 "세션 B — Operator" 박스 통째로 복붙
4. (선택) **PowerShell 새 창 #3** — Claude 아님, 그냥 일반 PS:
   ```
   cd "E:\사업 유튜브 url 분석및 자동실행"
   .\scripts\run_forever.ps1
   ```
   24/7 자동 데모 양산 백그라운드

각 세션이 1번씩 너에게 OK 받으러 올 거임. 그때만 답해주고 나머지는 둘이 알아서 진행.
