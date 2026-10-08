import type { ReactNode } from "react";
import Link from "next/link";
import { Eyebrow, SiteShell } from "./site-shell";

type InfoPageProps = {
  active: string;
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
};

type StatusKind = "computed" | "internal" | "illustrative" | "planned" | "roadmap" | "experimental";

export function InfoPage({ active, kicker, title, description, children }: InfoPageProps) {
  return (
    <SiteShell active={active}>
      <main>
        <section className="info-hero">
          <Eyebrow>{kicker}</Eyebrow>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="info-meta"><span>V0.2 OWNER-ONLY MVP</span><span>TRANSIENT STEMCHECK</span><span>NO TRUTH SCORE</span></div>
        </section>
        <div className="info-content">{children}</div>
      </main>
    </SiteShell>
  );
}

function Block({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return <section id={id} className="info-block"><h2>{title}</h2>{children}</section>;
}

function Status({ planned = false, kind, children }: { planned?: boolean; kind?: StatusKind; children: ReactNode }) {
  const label = typeof children === "string" ? children.toUpperCase() : "";
  const category = kind ?? (planned ? (label.includes("ROADMAP") ? "roadmap" : "planned") : (label.includes("HYPOTHESIS") ? "illustrative" : "computed"));
  return <span className={`status-tag status-${category}`}>{children}</span>;
}

export function ProductContent() {
  return <>
    <Block title="The Reliance Fabric">
      <p>Indepora is a small, inspectable layer between submitted AI evidence and a downstream workflow. It records relationships supported by the input, marks what remains unknown, and applies a caller-supplied Charter. It does not establish whether a claim is true or whether separate sources are independent.</p>
      <div className="info-grid">
        <article className="info-card"><Status>LIVE · API</Status><h3>Evidence input</h3><p>Accepts a claim or answer and up to 100 evidence items. Public Stemcheck is request-scoped; owner-only analysis is separate.</p></article>
        <article className="info-card"><Status>LIVE · LIMITED</Status><h3>Stemma</h3><p>Represents exact normalized-text matches and caller-attested derivations. A same-locator match without matching content is only possible.</p></article>
        <article className="info-card"><Status>LIVE · LIMITED</Status><h3>Kin</h3><p>Current relationships are input-bound and deterministic. Semantic/entity-level lineage and calibrated independence assessment are not implemented.</p></article>
        <article className="info-card"><Status>LIVE · CANDIDATE REFERENCES</Status><h3>Candidate Fount References</h3><p>Groups submitted origin IDs or normalized host locators. These are locator/origin references, not proof of independent or authoritative sources.</p></article>
        <article className="info-card"><Status>LIVE · EXPLICIT SAVE</Status><h3>Standing Ledger</h3><p>The authenticated owner can explicitly save a versioned Reliance Record to the existing private Postgres service. Historical snapshots are not recalculated on read.</p></article>
        <article className="info-card"><Status>LIVE · CALLER POLICY</Status><h3>Charter and decision</h3><p>Minimum document count, unknown-lineage action, conflict review, and freshness can determine an operational label—not a calibrated confidence score.</p></article>
        <article className="info-card"><Status kind="roadmap">ROADMAP</Status><h3>External actuation</h3><p>Automatic capture from agents, retrieval systems, and production workflow enforcement are not connected.</p></article>
      </div>
    </Block>

    <Block title="From input to decision">
      <div className="info-grid product-flow-grid">
        <article className="info-card"><Status>01 · COMPUTED</Status><h3>Input</h3><p>Claim or answer, evidence items, citations, excerpts, stance labels, and optional lineage.</p></article>
        <article className="info-card"><Status>02 · LIVE · LIMITED</Status><h3>Stemma</h3><p>Shows observed, caller-attested, possible, and unknown relationships as separate states.</p></article>
        <article className="info-card"><Status>03 · LIVE · LIMITED</Status><h3>Kin</h3><p>Connects only relationships supported by exact evidence or declared lineage; no semantic dependence score.</p></article>
        <article className="info-card"><Status>04 · COMPUTED</Status><h3>Candidate Fount References</h3><p>Returns locator/origin references and explains why they were grouped; not validated independence units.</p></article>
        <article className="info-card"><Status>05 · COMPUTED · VERSIONED</Status><h3>Standing</h3><p>Stores the engine, configuration, evidence, relationships, policy result, and timestamp in an immutable saved snapshot.</p></article>
        <article className="info-card"><Status>06 · CALLER CONFIGURATION</Status><h3>Charter</h3><p>Configuration determines how unresolved lineage, document count, conflicts, and freshness affect the workflow.</p></article>
        <article className="info-card"><Status>07 · POLICY LABEL</Status><h3>Decision</h3><p>Allow, qualify, escalate, or block are workflow outcomes only; they do not establish truth.</p></article>
      </div>
    </Block>

    <Block title="Current Charter controls" id="charter">
      <p>The Charter is explicit configuration, not a hidden threshold. Veiled evidence remains unknown in the engine; policy may permit, qualify, or block around that uncertainty.</p>
      <div className="charter-table" role="table" aria-label="Current Charter configuration">
        <div role="columnheader">CONTROL</div><div role="columnheader">CURRENT INPUT</div><div role="columnheader">EFFECT</div>
        <div role="cell">Minimum documents</div><div role="cell">Integer from 0 to 100</div><div role="cell">Can block when distinct normalized document keys fall below the caller&apos;s threshold.</div>
        <div role="cell">Unknown lineage</div><div role="cell">Allow / qualify / block</div><div role="cell">Changes workflow outcome without converting unknown relationships into dependent edges.</div>
        <div role="cell">Conflict review</div><div role="cell">Required / not required</div><div role="cell">User-labeled support and contradiction conflicts can trigger escalation.</div>
        <div role="cell">Freshness window</div><div role="cell">Optional maximum age in days</div><div role="cell">Evaluates supplied publication timestamps only; missing timestamps are not inferred.</div>
      </div>
      <div className="info-callout"><strong>Not implemented:</strong> policy based on a validated independent-Fount threshold, Echo Mass percentage, authoritative-source verification, or external decision enforcement.</div>
    </Block>

    <Block title="Plugin and integration status" id="integrations">
      <p>The product is designed around a narrow HTTP contract, not a connector marketplace. The Python Shadow Gate is an experimental, source-only preview; the documented API remains the production contract and other adapters are visibly marked by maturity.</p>
      <div className="info-grid">
        <article className="info-card"><Status>AVAILABLE</Status><h3>REST API + OpenAPI</h3><p>Public transient Stemcheck for experiments; separate authenticated endpoints for the single owner&apos;s private workspace.</p></article>
        <article className="info-card"><Status kind="experimental">EXPERIMENTAL · SOURCE ONLY</Status><h3>Python Shadow Gate</h3><p>Repository preview with a FastAPI example. It observes without changing or blocking the answer; no PyPI package is published.</p><a className="site-inline-link" href="https://github.com/valueseam11-hub/indepora/tree/main/sdks/python" target="_blank" rel="noreferrer">VIEW PILOT SOURCE ↗</a></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>TypeScript SDK</h3><p>No maintained installable SDK has been published.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>OpenTelemetry / OpenInference</h3><p>Instrumentation ingestion is not connected. A future adapter must preserve provenance and uncertainty.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>MCP + agent frameworks</h3><p>No MCP server or LangChain, LlamaIndex, CrewAI, or AutoGen plugin is included.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>RAG systems</h3><p>Vector-store and retrieval integrations are not built.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>GRC / audit systems</h3><p>Export to governance, risk, audit, or SIEM tools is not available.</p></article>
      </div>
      <div className="info-callout"><strong>Safe integration rule:</strong> do not treat a Standing label as truth, proof of independent sources, or automatic authorization to take external action.</div>
    </Block>

    <Block title="Why a larger team might care — hypotheses to validate">
      <p>When an AI answer carries many citations, a review team may still have to discover whether those links trace back to one upstream source. Indepora&apos;s value hypothesis is to make ancestry and unresolved parts inspectable before an answer enters a consequential workflow.</p>
      <div className="info-grid">
        <article className="info-card"><Status kind="illustrative">VALUE HYPOTHESIS</Status><h3>Less manual source tracing</h3><p>A compact Stemma and versioned Reliance Record could make review faster than checking every citation one by one. This has not been measured with customers.</p></article>
        <article className="info-card"><Status kind="illustrative">VALUE HYPOTHESIS</Status><h3>Expose evidence concentration</h3><p>Show when evidence appearances connect to observed or attested lineage, while keeping unknown relationships visible.</p></article>
        <article className="info-card"><Status kind="illustrative">VALUE HYPOTHESIS</Status><h3>Fit an existing decision flow</h3><p>A narrow API and explicit Charter may support a pre-reliance check. Production hooks and policy actuation are not built.</p></article>
      </div>
      <div className="info-callout"><strong>Enterprise adoption gates remain open:</strong> validated accuracy and false-positive rates, buyer willingness, integration effort, SSO/RBAC, multi-user history, privacy review, retention, and operational support. No enterprise customer, savings, certification, or performance claim is made.</div>
    </Block>

    <Block title="Pricing and availability" id="pricing">
      <p>The public transient Stemcheck is available without an account. The private saved-record workspace has one owner and no public sign-up.</p>
      <div className="plan-grid">
        <article className="plan-card"><Status>AVAILABLE · $0</Status><h3>Stemcheck preview</h3><p>Request-scoped analysis of a small evidence set. No automatic database save and no file upload.</p><Link className="site-inline-link" href="/#stemcheck">Run the preview ↗</Link></article>
        <article className="plan-card"><Status planned>NOT PUBLISHED</Status><h3>Builder / Team</h3><p>An experimental Python source preview exists; no maintained or published package, multi-user access, team history, hosted integrations, or pricing is available.</p></article>
        <article className="plan-card"><Status planned>NOT PUBLISHED</Status><h3>Enterprise</h3><p>SSO, RBAC, private deployment options, automated retention, and policy actuation remain future scope. No price or delivery commitment is published.</p></article>
      </div>
    </Block>
  </>;
}

export function DevelopersContent() {
  return <>
    <Block title="Run the real transient endpoint">
      <p>The current API exposes anonymous Stemcheck for request-scoped analysis. It does not persist submitted claim or evidence. The route is rate-limited per runtime instance and accepts up to 100 evidence items within the API body limit.</p>
      <pre className="code-panel">{`curl "$INDEPORA_URL/v1/stemcheck" \\
  -H 'Content-Type: application/json' \\
  --data '{
    "claim": "A fictional event occurred.",
    "evidence": [
      {
        "id": "primary",
        "title": "Synthetic source",
        "url": "https://source.example/report",
        "text": "Synthetic fixture text.",
        "stance": "supports"
      }
    ],
    "policy": {
      "minimum_documents": 0,
      "unknown_lineage_action": "qualify",
      "require_conflict_review": true
    }
  }'`}</pre>
      <p>Set <code>$INDEPORA_URL</code> to the deployed base URL. Use fictional or non-sensitive examples while evaluating the prototype.</p>
      <div className="site-hero-actions"><a className="site-button site-button-primary" href="/docs">RUN THE API · OPEN DOCS <span aria-hidden="true">↗</span></a><a className="site-button site-button-quiet" href="https://github.com/valueseam11-hub/indepora" target="_blank" rel="noreferrer">SOURCE REPOSITORY <span aria-hidden="true">↗</span></a></div>
    </Block>

    <Block title="Shadow decision flow" id="shadow-decision-flow">
      <p>Shadow mode observes an already-produced AI answer. It reports a computed Standing and the configured Charter result without applying either to the caller&apos;s answer.</p>
      <ol className="shadow-decision-flow" aria-label="Indepora Shadow Gate decision flow">
        <li><small>01 · INPUT</small><strong>AI DECISION</strong><span>An answer already produced by the caller.</span></li>
        <li><small>02 · OBSERVER</small><strong>SHADOW GATE</strong><span>Transient Stemcheck inspection; no answer change, block, or save.</span></li>
        <li><small>03 · COMPUTED</small><strong>Standing</strong><span>A workflow label for the submitted inputs, not a truth or confidence score.</span></li>
        <li><small>04 · COUNTERFACTUAL</small><strong>Would Charter have allowed reliance?</strong><span>The configured policy outcome is reported as a counterfactual; no reliance is authorized or executed.</span></li>
        <li><small>05 · HUMAN DECISION</small><strong>Human/team decision</strong><span>A human or authorized owner/operator makes the actual reliance choice; this does not imply team accounts.</span></li>
        <li><small>06 · FUTURE</small><strong>Eventually: actual outcome</strong><span>Downstream outcome tracking is not connected in this prototype.</span><Status kind="roadmap">NOT CONNECTED · ROADMAP</Status></li>
      </ol>
      <div className="info-callout"><strong>Interpretation:</strong> “Would Charter have allowed reliance?” is a hypothetical result under the supplied Charter. Veiled lineage remains unknown, and actual outcomes are not currently captured.</div>
      <a className="site-inline-link" href="https://github.com/valueseam11-hub/indepora/blob/main/docs/SHADOW_GATE_PILOT.md" target="_blank" rel="noreferrer">READ THE TESTER PILOT GUIDE ↗</a>
    </Block>

    <Block title="A narrow, explicit contract">
      <ul className="info-list">
        <li><span><strong>Input:</strong> claim or answer, evidence IDs, title, URL, optional excerpt, stance labels, optional caller-attested <code>derived_from</code>, and optional Charter configuration.</span></li>
        <li><span><strong>Observed:</strong> exact normalized-text duplicates are observable. Supplied derivation IDs are preserved as caller-attested links.</span></li>
        <li><span><strong>Possible:</strong> a same normalized locator without matching supplied content is only a possible link.</span></li>
        <li><span><strong>Unknown:</strong> different URLs or distinct components do not prove independence; missing lineage remains unknown.</span></li>
        <li><span><strong>Persistence:</strong> saved-record routes require the single owner session and CSRF checks on mutations. No public save endpoint exists.</span></li>
      </ul>
    </Block>

    <Block title="What is—and is not—available">
      <div className="info-grid">
        <article className="info-card"><Status>AVAILABLE</Status><h3>HTTP API + OpenAPI</h3><p>The endpoint is documented at <code>/docs</code>. Public Stemcheck is transient; authentication, inspect, and record APIs have separate access rules.</p></article>
        <article className="info-card"><Status kind="experimental">EXPERIMENTAL · SOURCE ONLY</Status><h3>Python Shadow Gate</h3><p>Source and a local FastAPI example are in the repository; no PyPI release, production gate, or actual-outcome tracker exists.</p><a className="site-inline-link" href="https://github.com/valueseam11-hub/indepora/tree/main/sdks/python" target="_blank" rel="noreferrer">OPEN SDK SOURCE ↗</a></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>TypeScript SDK</h3><p>No package has been released.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>OpenTelemetry / MCP</h3><p>Adapters are not wired; validate a versioned schema before advertising ingestion.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>Agent, RAG, GRC connectors</h3><p>No agent, observability, identity, or governance integrations are currently installed.</p></article>
      </div>
    </Block>

    <div className="info-callout"><strong>Safe integration rule:</strong> do not treat a Standing label as truth, proof of independent sources, or automatic authorization to take an external action.</div>
  </>;
}

export function ResearchContent() {
  const categories = [
    ["01", "Exact normalized duplicate", "Fixture behavior exists"],
    ["02", "Syndication", "Needs reviewed lineage labels"],
    ["03", "Republication", "Needs reviewed lineage labels"],
    ["04", "Paraphrase / summary", "Not inferred semantically"],
    ["05", "AI echo / shared retrieval", "Research target"],
    ["06", "Multi-agent convergence", "Research target"],
    ["07", "Model resemblance", "No public score"],
    ["08", "Genuine independence", "Requires adjudicated ground truth"],
    ["09", "Conflict", "Caller labels only; no semantic validation"],
    ["10", "Unknown lineage", "Unknown remains unknown"],
  ];
  return <>
    <Block title="Indepora Lab">
      <p>Evidence independence is not solved by counting citations, agents, or URLs. A meaningful evaluation distinguishes source genealogy from similarity, preserves uncertainty, and compares outputs against reviewed labels.</p>
      <div className="info-grid">
        <article className="info-card"><Status kind="planned">RESEARCH QUESTION</Status><h3>Evidence independence</h3><p>Which observable facts justify connecting evidence items, and which relationships must remain unresolved?</p></article>
        <article className="info-card"><Status kind="planned">RESEARCH QUESTION</Status><h3>Output genealogy</h3><p>How should a system represent evidence copied, summarized, retrieved, or transformed by an agent?</p></article>
        <article className="info-card"><Status kind="planned">RESEARCH QUESTION</Status><h3>Correlated evidence</h3><p>How do shared publishers, retrieval corpora, and common model behavior affect repeated support?</p></article>
        <article className="info-card"><Status kind="planned">RESEARCH QUESTION</Status><h3>Decision reliance</h3><p>How should uncertainty and consequence-specific policy be presented without collapsing them into a truth score?</p></article>
      </div>
    </Block>

    <Block title="Internal evaluation" id="internal-evaluation">
      <div className="evaluation-intro"><Status kind="internal">INTERNAL EVALUATION · TEAM-AUTHORED</Status><p>These are small internal case-set results, not an independent benchmark, calibrated score, or claim of general performance. Values are shown as reported counts; no percentage or statistical-significance claim is inferred.</p></div>
      <div className="evaluation-score-grid">
        <article className="evaluation-score"><span>DEVELOPMENT</span><small>Indepora · reported result</small><strong>9 <i>/</i> 12</strong></article>
        <article className="evaluation-score"><span>HELD-OUT</span><small>Indepora · reported result</small><strong>9 <i>/</i> 11</strong></article>
        <article className="evaluation-score"><span>CLEAN HELD-OUT</span><small>Indepora · reported result</small><strong>8 <i>/</i> 10</strong></article>
      </div>
      <h3 className="evaluation-subhead">Baseline comparison · held-out case set</h3>
      <div className="evaluation-table" role="table" aria-label="Internal evaluation baseline comparison">
        <div role="columnheader">SYSTEM</div><div role="columnheader">REPORTED RESULT</div><div role="columnheader">STATUS</div>
        <div role="cell">Indepora</div><div role="cell">9 / 11</div><div role="cell">Internal evaluation</div>
        <div role="cell">Text similarity</div><div role="cell">5 / 11</div><div role="cell">Baseline</div>
        <div role="cell">URL deduplication</div><div role="cell">2 / 11</div><div role="cell">Baseline</div>
      </div>
      <div className="info-callout evaluation-disclosure"><strong>Disclosure:</strong> “These cases were authored by the Indepora team. The held-out set was written and evaluated before the engine was changed. One cited-URL case was added after observing the failure and is excluded from the clean held-out result.”</div>
      <p><strong>Embedding and LLM-judge baselines are not yet complete.</strong> The case-level dataset and annotation protocol are not published with this prototype, so the summary is not independently reproducible from this repository.</p>
    </Block>

    <Block title="Known failure modes">
      <p>Where the engine still struggles:</p>
      <ul className="failure-list"><li>shared boilerplate</li><li>translation</li><li>undeclared news → filing lineage</li><li>semantic/entity-level relationships</li><li>unknown provenance</li></ul>
      <div className="info-callout"><strong>These cases define the next evaluation cycle.</strong> No public leaderboard or general-purpose independence claim is made.</div>
    </Block>

    <Block title="Echo Trials: evaluation matrix">
      <p>These are categories for continued testing, not additional benchmark results. Only the internal counts above are currently reported.</p>
      <div className="info-grid">
        {categories.map(([number, name, state]) => <article className="info-card" key={number}><span className="site-kicker">TRIAL {number}</span><h3>{name}</h3><p>{state}</p></article>)}
      </div>
    </Block>

    <Block title="Evidence Observatory">
      <p>Usage counters are intentionally absent. Indepora is not collecting analytics for claims analyzed, citations, user behavior, or average Echo Mass. Synthetic demo results are computed from fictional fixtures—not production telemetry.</p>
      <p>Research drops, weekly trials, and model-pair monitoring will only be published when there is a reviewed dataset and privacy-safe methodology. No customer evidence is used to create public examples.</p>
      <div className="info-card"><Status kind="planned">NOT YET PUBLISHED</Status><h3>External datasets and technical papers</h3><p>External validation, public datasets, and research publications do not yet exist for this prototype.</p></div>
    </Block>
  </>;
}

export function DesignPartnersContent() {
  return <>
    <Block title="A careful pilot, not a data grab">
      <p>Indepora is seeking feedback on workflows where evidence ancestry changes how a team reviews AI output. The current deployment is a prototype with a single owner, no team access, and no dedicated private partner intake.</p>
      <div className="partner-steps">
        <article className="partner-step"><span>01 / SCOPE</span><h3>Choose one decision path</h3><p>Define the claim type, source types, downstream consequence, and acceptable review outcome.</p></article>
        <article className="partner-step"><span>02 / TEST</span><h3>Start with redacted fixtures</h3><p>Use synthetic or irreversibly redacted examples first. The public preview is not a secure upload portal for proprietary traces.</p></article>
        <article className="partner-step"><span>03 / REVIEW</span><h3>Document failure cases</h3><p>Separate observed links, caller attestations, possible links, and unknowns. Agree on human review before interpreting policy output.</p></article>
      </div>
    </Block>

    <Block title="What a design conversation can cover">
      <div className="info-grid">
        <article className="info-card"><Status kind="illustrative">INPUT FROM PARTNERS</Status><h3>Workflow and failure modes</h3><p>Representative, redacted examples; known lineage; source-update behavior; and a clear decision consequence.</p></article>
        <article className="info-card"><Status>PROTOTYPE CAN SHOW</Status><h3>Transient Stemcheck + Standing</h3><p>Current request-scoped analysis, explicit-save owner workspace, and lineage-certainty limitations.</p></article>
        <article className="info-card"><Status kind="planned">NOT AVAILABLE</Status><h3>Private team workspace</h3><p>No partner accounts, invitation workflow, tenant isolation controls, SLA, or partner-specific deployment exists.</p></article>
        <article className="info-card"><Status kind="roadmap">NOT A COMMITMENT</Status><h3>Future integration access</h3><p>SDKs, plugins, automated enforcement, and enterprise features are roadmap topics—not delivered benefits or a delivery promise.</p></article>
      </div>
      <div className="info-callout"><strong>Design Partner intake coming soon.</strong> There is no private intake form. Never post evidence, personal data, credentials, or confidential traces to a public GitHub issue.</div>
      <div className="site-hero-actions"><a className="site-button site-button-primary" href="https://github.com/valueseam11-hub/indepora/issues/new" target="_blank" rel="noreferrer">ASK A NON-SENSITIVE PRODUCT QUESTION <span aria-hidden="true">↗</span></a><a className="site-button site-button-quiet" href="https://github.com/valueseam11-hub/indepora" target="_blank" rel="noreferrer">REVIEW THE REPOSITORY <span aria-hidden="true">↗</span></a></div>
    </Block>
  </>;
}

export function TrustContent() {
  return <>
    <Block title="Analyze → don't retain. Save → store.">
      <p>The public Stemcheck endpoint runs deterministic analysis for the current request and does not write a Reliance Record. Application logs omit raw claim and evidence text. The full record is persisted only after the single authenticated owner explicitly chooses Save in the private workspace.</p>
      <div className="info-grid">
        <article className="info-card"><Status kind="computed">PUBLIC · TRANSIENT</Status><h3>Stemcheck</h3><p>Request body is processed by this app and the report returned to the requesting browser. No saved-record ID or public evidence URL is created.</p></article>
        <article className="info-card"><Status kind="computed">OWNER ONLY</Status><h3>Explicit persistence</h3><p>Saved records require a server-side owner session and are retrieved only through owner-authenticated, owner-filtered API routes.</p></article>
        <article className="info-card"><Status kind="computed">APPLICATION LOGS</Status><h3>No raw inputs</h3><p>Application logs contain request IDs, method, route template, status, timing, and non-sensitive error types—not request bodies, claim text, or citations.</p></article>
        <article className="info-card"><Status kind="computed">TRANSPORT</Status><h3>HTTPS on deployment</h3><p>The public Railway endpoint uses HTTPS. Database connectivity uses the existing private Railway service reference; Postgres is not exposed by this application.</p></article>
      </div>
    </Block>

    <Block title="Owner authentication and saved records">
      <ul className="info-list">
        <li><span>One owner account, no public sign-up, no teams, and no invitation flow.</span></li>
        <li><span>Argon2id password hashing, opaque server-side sessions stored as token digests, HttpOnly/Secure/SameSite production cookies, CSRF and Origin checks for mutations.</span></li>
        <li><span>Saved snapshots keep engine, configuration, model-version map, Charter, Standing, and analysis timestamp; retrieval does not silently recompute historical outcomes.</span></li>
        <li><span>Veiled evidence stays unknown in the engine. A caller-supplied Charter may qualify or block an outcome but does not rewrite unknown relationships as dependencies.</span></li>
        <li><span>The seal is an unsigned SHA-256 integrity digest; it is not a signature, source-authenticity proof, or external timestamp.</span></li>
      </ul>
    </Block>

    <Block title="Important limits">
      <p>This is a prototype, not a compliance certification or a security-reviewed environment. Do not submit regulated or highly sensitive information until hosting-provider access, logs, backups, retention, deletion, and incident controls have been independently reviewed.</p>
      <div className="info-callout"><strong>Hosting-provider boundary:</strong> application code avoids logging request content, but provider infrastructure may have operational logs and backups outside these application controls. No encryption-at-rest, backup-retention, SOC 2, ISO, or regulatory certification claim is made here.</div>
      <p>There is no automatic retention job, metadata-only retention mode, self-service export, public password reset, multi-tenant access, independent penetration test, or external analytics service in this MVP.</p>
    </Block>
  </>;
}
