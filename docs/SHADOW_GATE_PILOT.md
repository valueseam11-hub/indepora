# Indepora Shadow Gate — early tester pilot

**Status:** source-only experiment for feedback. The Python client and FastAPI example are not published to PyPI, are not a production gate, and have not been independently validated. The current HTTP API remains the source of truth.

## Pilot question

Can an AI platform or evaluation team inspect evidence relationships and unresolved lineage beside an existing answer, without changing the answer or interrupting the workflow?

## Shadow decision flow

```text
AI DECISION
      ↓
SHADOW GATE
      ↓
Standing
      ↓
Would Charter have allowed reliance?
      ↓
Human/team decision
      ↓
Eventually: actual outcome
```

Interpretation for this prototype:

1. **AI decision** — an answer already produced by the caller; Indepora does not generate it.
2. **Shadow Gate** — sends the answer, evidence, and optional Charter to the transient Stemcheck API. This is an observer, not an enforcement gate; no answer is changed, blocked, or saved.
3. **Standing** — the computed, versioned operational result for the submitted inputs; it is not a truth or confidence score.
4. **Would Charter have allowed reliance?** — a **counterfactual** result under the caller-supplied Charter, such as `ALLOW`, `QUALIFY`, `ESCALATE`, `BLOCK`, or `NOT_CONFIGURED`. It describes what the configured rule computed; it does not authorize or perform reliance.
5. **Human/team decision** — the actual reliance decision remains with a human or authorized owner/operator. “Team” describes a possible workflow; this MVP has no team accounts.
6. **Eventually: actual outcome** — downstream outcome capture is not connected and is future work. This pilot must not claim to measure whether reliance was correct.

Veiled lineage remains unknown; the SDK does not convert it into dependence. Candidate Fount References are locator/origin references, not verified independent sources.

## First tester cohort

Recruit **5–8 practitioners** through warm introductions and focused communities:

- RAG / AI platform engineers who can bring a small synthetic retrieval example
- AI evaluation or quality leads who review grounded answers
- Trust, safety, privacy, or risk practitioners who can challenge the reliance language

Prefer people who already work with evidence-grounded outputs. Ask for product feedback, not a purchase decision. Do not ask testers to supply confidential company data, customer evidence, secrets, or regulated material.

## What the pilot includes

- Experimental Python package at [`sdks/python`](../sdks/python/README.md)
- Minimal local [FastAPI example](../examples/fastapi-shadow/README.md)
- One public transient Stemcheck call per inspection; no automatic save
- Summary-only example response; the original caller answer is returned unchanged
- Service or transport errors represented as an unavailable shadow result; no answer blocking

This pilot does **not** include a PyPI release, authentication token, framework adapter, telemetry ingestion, customer-data retention, team accounts, production actuation, or actual-outcome tracking.

## 20-minute session

1. **Context (3 min):** Ask the tester where evidence enters their RAG or answer-generation flow and who reviews it.
2. **Install (4 min):** Let them follow the README using a synthetic example. Note friction without coaching unless they are stuck.
3. **Observe (7 min):** Run the local FastAPI example with a fictional origin, an attested copy, and one item with unknown lineage. Ask them to explain `summary`, `standing`, and `veiled_state` in their own words. Then ask what they believe the counterfactual Charter outcome means.
4. **Failure boundary (3 min):** Ask what should happen if Indepora times out. Confirm that the caller's answer remains unchanged and that no gate is applied.
5. **Workflow fit (3 min):** Ask who owns the human reliance decision, where an actual outcome would be observed, what data they would redact, and what would be required before any blocking mode could be considered.

Do not record the screen or collect company evidence by default. If notes are taken, capture role, friction, interpretation, and requested next step—not the tester's submitted claim/evidence text.

## Feedback scorecard

For each session, record whether the tester:

- installed and ran the example without help;
- understood that shadow mode takes no action on the answer;
- understood “Would Charter have allowed reliance?” as counterfactual rather than an authorization;
- distinguished candidate origin references from proven independent sources;
- understood that Veiled lineage stays unknown;
- could name an existing point in their workflow for a side observation;
- identified who would make the human decision and how (or whether) an actual outcome could be captured;
- identified a concrete blocker to a safe pilot.

Treat repeated requests to try the SDK in a redacted workflow as an interest signal, not product-market fit. Do not publish percentages from this small convenience sample as research results.

## Copy-ready invitation

**Subject:** Could I get 20 minutes of feedback on an AI evidence tool?

> Hi [Name] — I’m building Indepora, an early prototype for inspecting relationships among evidence behind AI answers, including cases where lineage is unknown. I’m looking for a few RAG or AI evaluation practitioners to try a short, non-blocking Python example and tell me what is useful or confusing.
>
> It is an experimental source preview, not a fact checker or independence certifier. The example uses a transient analysis route and returns the answer unchanged. We can use synthetic or redacted inputs; please don’t share confidential data. Would you be open to a 20-minute feedback session? [Indepora demo](https://indepora-production.up.railway.app/) · [Pilot code](https://github.com/valueseam11-hub/indepora/tree/main/sdks/python)

**No outreach has been sent.** Select recipients and an outreach channel before contacting anyone.
