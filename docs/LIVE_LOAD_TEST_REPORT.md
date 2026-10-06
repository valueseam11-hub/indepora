# Live Load-Test Report — 2026-10-06

## Outcome

The first attempt used the original 100/300/500 plan and hit the 60-second request deadline during the sequential phase, before reaching concurrency 5 or 10. After the owner explicitly approved one additional pass, the revised 25/75/150 suite completed all three concurrency tiers in **50.8 seconds**. All 250 analysis responses were HTTP 200 with valid report shapes; no 5xx, 429, or other error was observed.

This is a bounded synthetic load check, not a capacity certification, SLA, or security audit.

## Target and safety boundary

- Target: `https://indepora-production.up.railway.app`
- Endpoint under test: anonymous synthetic `POST /v1/stemcheck`
- Data: fictional fixed fixture only
- Persistence: transient route; no login, saved-record, delete, or database-write operation was exercised
- Requested limit: maximum 60 seconds and 1,000 API requests per approved pass
- Combined traffic across both attempts: 322 Stemcheck POSTs and 2 health GETs (**324 HTTP requests total**)
- Combined runtime: approximately **110.8 seconds** across the initial run and the explicitly approved follow-up (within the approved additional 60-second allowance)

## Initial attempt — stopped at the time limit

| Concurrency | Planned | Started | Completed | Statuses | p50 | p95 | Max |
|---:|---:|---:|---:|---|---:|---:|---:|
| 1 | 100 | 72 | 71 | 71 × HTTP 200 | 732.64 ms | 935.63 ms | 1,360.97 ms |
| 5 | 300 | 0 | 0 | Not run | — | — | — |
| 10 | 500 | 0 | 0 | Not run | — | — | — |

The health check returned HTTP 200. The 71 completed analyses had zero errors. One started request did not return before the deadline and was cancelled during shutdown. The first script's full process elapsed time measured 60.004 seconds because of cancellation/reporting cleanup; the request deadline was 60 seconds and no new requests were issued beyond it. Its result was therefore correctly recorded as incomplete.

## Owner-approved revised follow-up — complete

| Concurrency | Planned | Started | Completed | Statuses | p50 | p95 | Max |
|---:|---:|---:|---:|---|---:|---:|---:|
| 1 | 25 | 25 | 25 | 25 × HTTP 200 | 913.30 ms | 921.80 ms | 946.65 ms |
| 5 | 75 | 75 | 75 | 75 × HTTP 200 | 713.03 ms | 1,466.00 ms | 4,553.01 ms |
| 10 | 150 | 150 | 150 | 150 × HTTP 200 | 755.23 ms | 1,624.37 ms | 3,672.79 ms |

The revised pass returned HTTP 200 from the health check and all 250 analysis requests in **50.8 seconds**. The runner reported `within_owner_limits: true`, no stop reason, and zero request errors.

## Interpretation and limits

The live service handled the specified small synthetic fixture at concurrency 1, 5, and 10 within the revised time/request caps. These observations do not establish maximum throughput, behavior with large evidence payloads, performance under sustained production traffic, an SLA, or deployment capacity. Latency varied by phase; the concurrency-5 phase had the highest observed individual response time (4.553 seconds) while its p95 was 1.466 seconds.

The public analysis route does not persist inputs. Unauthenticated `GET /v1/records` returned 401 during live verification. First-owner setup was still pending at the time of the check; no password was collected or entered by the agent.
