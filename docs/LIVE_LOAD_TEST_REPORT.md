# Live Load-Test Report — 2026-10-06

## Outcome

**Partial run; not a completed 1/5/10-concurrency test and not a capacity certification.** The hard 60-second limit stopped the first sequential phase before it reached its planned 100 requests. The runner did not proceed to concurrency 5 or 10.

## Target and safety boundary

- Target: `https://indepora-production.up.railway.app`
- Endpoint under test: anonymous synthetic `POST /v1/stemcheck`
- Persistence: transient route only; no login, saved-record, delete, or database-write operation was exercised
- Maximum allowed: 60 seconds and 1,000 API requests, as directed by the owner
- Actual requests: 72 Stemcheck POSTs plus one health GET (73 HTTP requests total)
- Stop: global 60-second deadline; no additional requests were sent after the deadline

## Observed phase

| Concurrency | Planned | Started | Completed | Statuses | p50 | p95 | Max |
|---:|---:|---:|---:|---|---:|---:|---:|
| 1 | 100 | 72 | 71 | 71 × HTTP 200 | 732.64 ms | 935.63 ms | 1,360.97 ms |
| 5 | 300 | 0 | 0 | Not run | — | — | — |
| 10 | 500 | 0 | 0 | Not run | — | — | — |

The health check returned HTTP 200. The 71 completed analysis calls had zero non-200 responses and valid report shapes. One additional started request did not return before the deadline and was cancelled during shutdown. No 5xx or 429 was observed among completed requests.

## Interpretation

The public service was healthy before the run, every tested route was reachable, and unauthenticated `GET /v1/records` returned 401. The sequential sample indicates relatively high per-request latency for this small fixture, so the original 100/300/500 phase distribution could not reach its concurrency tiers inside 60 seconds. No claim about concurrency-5/10 behavior, maximum capacity, SLA, or performance under production traffic can be made from this partial run.

The checked-in runner has since been reduced to 25/75/150 synthetic analysis requests (250 total plus one health check), still with a hard 60-second deadline and immediate stop conditions. A further live pass would exceed the original 60-second aggregate time allowance; it has not been run pending the owner's explicit approval.
