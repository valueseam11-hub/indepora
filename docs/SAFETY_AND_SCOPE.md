# v0.1 Safety and Scope

- Prototype only; no authentication or tenant isolation is implemented.
- Do not submit confidential, personal, regulated, or customer data.
- Inputs are processed in memory and are not intentionally stored by the application.
- No external language model or search/crawling service is called.
- Exact normalized-text hashes and source identifiers may still be linkable; they are not anonymous.
- An absent dependency signal means unknown, not independent.
- Candidate groups reflect only observed exact-text matches and user-attested derivations; they are not counts of independent evidence.
- Conflict detection uses only labels supplied by the user.
- Freshness is only assessed when a policy and source timestamps are supplied.
- Authority is not assessed.
- A policy result is a workflow rule outcome, not a truth, safety, or regulatory compliance determination.
- The unsigned SHA-256 digest detects changes to a serialized report only; it does not prove the report's correctness or source authenticity.
