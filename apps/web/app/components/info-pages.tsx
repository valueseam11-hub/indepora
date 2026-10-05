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

function Status({ planned = false, children }: { planned?: boolean; children: ReactNode }) {
  return <span className={`status-tag${planned ? " roadmap" : ""}`}>{children}</span>;
}

export function ProductContent() {
  return <>
    <Block title="The Reliance Fabric">
      <p>Indepora is a small, inspectable layer between submitted evidence and a downstream workflow. It records what relationships are supported by the input, marks what remains unknown, and applies a caller-supplied Charter. It does not establish whether a claim is true or whether separate sources are independent.</p>
      <div className="site-image-inset">EVIDENCE IN MOTION · ORIGINAL GENERATED CONCEPT IMAGE</div>
      <div className="info-grid">
        <article className="info-card"><Status>LIVE · API</Status><h3>Reliance Ingress</h3><p>Accepts a claim or answer and up to 100 evidence items. The public Stemcheck call is request-scoped; owner-only analysis is also available in the private workspace.</p></article>
        <article className="info-card"><Status>LIVE · LIMITED</Status><h3>Stemma + Kin</h3><p>Builds relationships from caller-attested derivations and exact normalized-text matches. Same-URL matches can be possible links; absent evidence stays unknown.</p></article>
        <article className="info-card"><Status>LIVE · CANDIDATE REFS</Status><h3>Origin Mesh</h3><p>Normalizes submitted URLs, removes common tracking and sensitive query parameters, and groups caller-provided origin IDs or host locators. These references are not proof of independence or authority.</p></article>
        <article className="info-card"><Status>LIVE · EXPLICIT SAVE</Status><h3>Standing Ledger</h3><p>An authenticated owner can explicitly save a versioned Reliance Record to the existing private Postgres service. Historical snapshots are served without recalculation.</p></article>
        <article className="info-card"><Status>LIVE · CALLER POLICY</Status><h3>Charter</h3><p>The current policy supports minimum document count, unknown-lineage action, conflict review, and an optional freshness window. It returns a workflow label, not a calibrated confidence score.</p></article>
        <article className="info-card"><Status planned>ROADMAP</Status><h3>Sprig + downstream actuation</h3><p>Automatic capture from agents, retrieval systems, and enforcement into production tools are not connected in this MVP.</p></article>
      </div>
    </Block>

    <Block title="Current Charter controls" id="charter">
      <p>The Charter is explicit configuration, not a hidden threshold. Veiled evidence remains unknown in the engine; the policy can permit, qualify, or block that uncertainty.</p>
      <div className="charter-table" role="table" aria-label="Current Charter configuration">
        <div role="columnheader">CONTROL</div><div role="columnheader">CURRENT INPUT</div><div role="columnheader">EFFECT</div>
        <div role="cell">Minimum documents</div><div role="cell">Integer from 0 to 100</div><div role="cell">Can block when distinct normalized document keys fall below the caller&apos;s threshold.</div>
        <div role="cell">Unknown lineage</div><div role="cell">Allow / qualify / block</div><div role="cell">Changes the workflow outcome without converting unknown relationships into dependent edges.</div>
        <div role="cell">Conflict review</div><div role="cell">Required / not required</div><div role="cell">User-labeled support and contradiction conflicts can trigger escalation.</div>
        <div role="cell">Freshness window</div><div role="cell">Optional maximum age in days</div><div role="cell">Evaluates supplied publication timestamps only; missing timestamps are not inferred.</div>
      </div>
      <div className="info-callout"><strong>Not implemented:</strong> policies based on a validated independent-Fount threshold, Echo Mass percentage, authoritative-source verification, or external decision enforcement.</div>
    </Block>

    <Block title="From evidence to action">
      <div className="info-grid">
        <article className="info-card"><Status>01 · INPUT</Status><h3>Evidence</h3><p>Caller-submitted claim, citations, excerpts, timestamps, and optional lineage links.</p></article>
        <article className="info-card"><Status>02 · GRAPH</Status><h3>Stemma</h3><p>Observed and attested relationships are connected; possible and unknown relationships stay distinct.</p></article>
        <article className="info-card"><Status>03 · REFERENCE</Status><h3>Candidate Founts</h3><p>Locator/origin references are grouped and explained, but not represented as certified independent sources.</p></article>
        <article className="info-card"><Status>04 · SNAPSHOT</Status><h3>Standing</h3><p>The current output is the supplied policy result and its reasons. With no Charter, Standing is NOT_CONFIGURED.</p></article>
        <article className="info-card"><Status>05 · CONFIG</Status><h3>Charter</h3><p>Configuration determines how a workflow handles unresolved lineage, count, conflict, and freshness.</p></article>
        <article className="info-card"><Status planned>06 · ROADMAP</Status><h3>Action</h3><p>The API does not currently trigger, block, or modify an external AI system.</p></article>
      </div>
    </Block>

    <Block title="Plugin and integration marketplace" id="integrations">
      <p>The product is designed to plug in through a narrow HTTP contract, but the current deployment is not a connector marketplace. Only the documented API is available; all adapters below are explicitly marked by maturity.</p>
      <div className="info-grid">
        <article className="info-card"><Status>AVAILABLE</Status><h3>REST API + OpenAPI</h3><p>Public transient Stemcheck for experiments; separate authenticated endpoints for the single owner&apos;s private workspace.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>Python / TypeScript SDKs</h3><p>No maintained installable SDK has been published yet.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>OpenTelemetry / OpenInference</h3><p>Instrumentation ingestion is not connected. Any future adapter must preserve provenance and not overstate independence.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>MCP + agent frameworks</h3><p>No MCP server or LangChain, LlamaIndex, CrewAI, or AutoGen plugin is included in this release.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>RAG / vector stores</h3><p>Weaviate, Pinecone, Qdrant, Elasticsearch, and other retrieval integrations are not built.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>GRC / audit systems</h3><p>Export to governance, risk, audit, or SIEM tools is not available; saved records remain in the owner&apos;s workspace.</p></article>
      </div>
    </Block>

    <Block title="Why a larger team might care — hypotheses to validate">
      <p>When an AI answer carries many citations, a review team may still have to discover whether those links trace back to one upstream source. Indepora&apos;s value hypothesis is to make that ancestry and the unresolved parts inspectable before the answer enters a consequential workflow.</p>
      <div className="info-grid">
        <article className="info-card"><Status>VALUE HYPOTHESIS</Status><h3>Less manual source tracing</h3><p>A compact Stemma and versioned Reliance Record could make review faster than checking every citation one by one. This has not been measured with customers.</p></article>
        <article className="info-card"><Status>VALUE HYPOTHESIS</Status><h3>Expose evidence concentration</h3><p>Show when several evidence appearances connect to the same observed or attested lineage, while keeping unknown relationships visible instead of guessing.</p></article>
        <article className="info-card"><Status>VALUE HYPOTHESIS</Status><h3>Fit an existing decision flow</h3><p>A narrow API and explicit Charter may let platform teams trial a pre-reliance check. Production agent hooks, SDKs, and policy actuation are not built yet.</p></article>
      </div>
      <div className="info-callout"><strong>Enterprise adoption gates remain open:</strong> validated accuracy and false-positive rates, real buyer willingness, integration effort, SSO/RBAC, multi-user history, deployment/privacy review, retention, and operational support. No enterprise customer, savings, certification, or performance claim is being made.</div>
    </Block>

    <Block title="Pricing and availability" id="pricing">
      <p>The public transient Stemcheck is available without an account. The private saved-record workspace has one owner and no public sign-up.</p>
      <div className="plan-grid">
        <article className="plan-card"><Status>AVAILABLE · $0</Status><h3>Stemcheck preview</h3><p>Request-scoped analysis of a small evidence set. No automatic database save and no file upload.</p><Link className="site-inline-link" href="/#stemcheck">Run the preview ↗</Link></article>
        <article className="plan-card"><Status planned>NOT PUBLISHED</Status><h3>Builder / Team</h3><p>SDKs, multi-user access, increased allowances, team history, and hosted integrations are not currently available. Pricing has not been set.</p></article>
        <article className="plan-card"><Status planned>NOT PUBLISHED</Status><h3>Enterprise</h3><p>SSO, RBAC, private deployment options, automated retention, and policy actuation remain future scope. No price or delivery commitment is published.</p></article>
      </div>
    </Block>
  </>;
}

export function DevelopersContent() {
  return <>
    <Block title="Call the public transient endpoint">
      <p>The current API exposes an anonymous Stemcheck endpoint for request-scoped analysis. It does not persist the submitted claim or evidence. The route is rate-limited per runtime instance and accepts up to 100 evidence items within the API body limit.</p>
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
      <div className="site-hero-actions"><a className="site-button site-button-primary" href="/docs">OPEN API REFERENCE <span aria-hidden="true">↗</span></a><a className="site-button site-button-quiet" href="https://github.com/valueseam11-hub/indepora" target="_blank" rel="noreferrer">SOURCE REPOSITORY <span aria-hidden="true">↗</span></a></div>
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
        <article className="info-card"><Status planned>NOT PUBLISHED</Status><h3>Python / TypeScript SDK</h3><p>No package has been released. Do not use an install command or API shape that is not present in this repository.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>OpenTelemetry / MCP</h3><p>Adapters are not wired. The schema should be versioned and validated before an ingestion plugin is advertised.</p></article>
        <article className="info-card"><Status planned>PLANNED</Status><h3>Agent, RAG, GRC connectors</h3><p>No LangChain, observability, identity, or governance integrations are currently installed.</p></article>
      </div>
    </Block>

    <div className="info-callout"><strong>Safe integration rule:</strong> do not treat a Standing label as truth, a proof of independent sources, or an automatic authorization to take an external action.</div>
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
      <p>Evidence independence is not solved by counting citations, agents, or URLs. A meaningful evaluation has to distinguish source genealogy from similarity, preserve uncertainty, and compare system outputs against reviewed labels.</p>
      <div className="info-grid">
        <article className="info-card"><Status>RESEARCH QUESTION</Status><h3>Evidence independence</h3><p>Which observable facts justify connecting evidence items, and which relationships must remain unresolved?</p></article>
        <article className="info-card"><Status>RESEARCH QUESTION</Status><h3>Output genealogy</h3><p>How should a system represent evidence copied, summarized, retrieved, or transformed by an agent?</p></article>
        <article className="info-card"><Status>RESEARCH QUESTION</Status><h3>Correlated evidence</h3><p>How do shared publishers, retrieval corpora, and common model behavior affect the interpretation of repeated support?</p></article>
        <article className="info-card"><Status>RESEARCH QUESTION</Status><h3>Decision reliance</h3><p>How should uncertainty and consequence-specific policy be presented without collapsing them into a truth score?</p></article>
      </div>
    </Block>

    <Block title="Echo Trials: proposed evaluation matrix">
      <p>These are test categories, not benchmark results. Only a small synthetic fixture is currently available; there is no public leaderboard, validated Resemblance Index, or published performance claim.</p>
      <div className="info-grid">
        {categories.map(([number, name, state]) => <article className="info-card" key={number}><span className="site-kicker">TRIAL {number}</span><h3>{name}</h3><p>{state}</p></article>)}
      </div>
      <div className="info-callout"><strong>Publication gate:</strong> report dataset provenance, annotation protocol, agreement, scope limitations, and baseline comparisons before claiming detection quality.</div>
    </Block>

    <Block title="Evidence Observatory">
      <p>Usage counters are intentionally absent. Indepora is not collecting analytics for claims analyzed, citations, user behavior, or average Echo Mass. The on-page “Live Demo Dataset” is a fictional, deterministic fixture—not live traffic.</p>
      <p>Research drops, weekly trials, and model-pair monitoring will only be published when there is a reviewed dataset and privacy-safe methodology. No customer evidence is used to create public examples.</p>
      <div className="info-card"><Status planned>NOT YET PUBLISHED</Status><h3>Technical papers, datasets, and methodology</h3><p>Research publications and externally reviewed benchmark data do not yet exist for this prototype.</p></div>
    </Block>
  </>;
}

export function DesignPartnersContent() {
  return <>
    <Block title="A careful pilot, not a data grab">
      <p>Indepora is seeking feedback on workflows where evidence ancestry changes how a team reviews AI output. The current deployment is a prototype with a single owner, no team access, and no dedicated private partner intake.</p>
      <div className="partner-steps">
        <article className="partner-step"><span>01 / SCOPE</span><h3>Choose one decision path</h3><p>Define the claim type, source types, downstream consequence, and what counts as an acceptable review outcome.</p></article>
        <article className="partner-step"><span>02 / TEST</span><h3>Start with redacted fixtures</h3><p>Use synthetic or irreversibly redacted examples first. The public preview is not a secure upload portal for proprietary traces.</p></article>
        <article className="partner-step"><span>03 / REVIEW</span><h3>Document failure cases</h3><p>Separate observed links, caller attestations, possible links, and unknowns. Agree on human review before interpreting any policy output.</p></article>
      </div>
    </Block>

    <Block title="What a design conversation can cover">
      <div className="info-grid">
        <article className="info-card"><Status>INPUT FROM PARTNERS</Status><h3>Workflow and failure modes</h3><p>Representative, redacted examples; known lineage; source update behavior; and a clear description of the decision consequence.</p></article>
        <article className="info-card"><Status>PROTOTYPE CAN SHOW</Status><h3>Transient Stemcheck + Standing</h3><p>Current request-scoped analysis, the saved-record contract in the owner workspace, and limitations in lineage certainty.</p></article>
        <article className="info-card"><Status>NOT AVAILABLE</Status><h3>Private team workspace</h3><p>No partner accounts, invitation workflow, tenant isolation controls, SLA, or partner-specific deployment currently exists.</p></article>
        <article className="info-card"><Status>NOT A COMMITMENT</Status><h3>Future integration access</h3><p>SDK, plugins, automated enforcement, and enterprise features are roadmap topics—not delivered benefits or a delivery promise.</p></article>
      </div>
      <div className="info-callout"><strong>Never post evidence, personal data, credentials, or confidential traces to a public GitHub issue.</strong> Use the public repository issue form only for non-sensitive product questions; private pilot intake is not yet available.</div>
      <div className="site-hero-actions"><a className="site-button site-button-primary" href="https://github.com/valueseam11-hub/indepora/issues/new" target="_blank" rel="noreferrer">OPEN A NON-SENSITIVE ISSUE <span aria-hidden="true">↗</span></a><a className="site-button site-button-quiet" href="https://github.com/valueseam11-hub/indepora" target="_blank" rel="noreferrer">REVIEW THE REPOSITORY <span aria-hidden="true">↗</span></a></div>
    </Block>
  </>;
}

export function TrustContent() {
  return <>
    <Block title="Analyze → don't retain. Save → store.">
      <p>The public Stemcheck endpoint runs the deterministic analysis for the current request and does not write a Reliance Record. The application does not log raw claim or evidence text. The full record is persisted only after the single authenticated owner explicitly chooses Save in the private workspace.</p>
      <div className="info-grid">
        <article className="info-card"><Status>PUBLIC · TRANSIENT</Status><h3>Stemcheck</h3><p>Request body is processed by this app and the report is returned to the requesting browser. No saved-record ID or public evidence URL is created.</p></article>
        <article className="info-card"><Status>OWNER ONLY</Status><h3>Explicit persistence</h3><p>Saved records require a server-side owner session and are retrieved only through owner-authenticated, owner-filtered API routes.</p></article>
        <article className="info-card"><Status>APPLICATION LOGS</Status><h3>No raw inputs</h3><p>Application logs contain request IDs, method, route template, status, timing, and non-sensitive error types—not request bodies, claim text, or citations.</p></article>
        <article className="info-card"><Status>TRANSPORT</Status><h3>HTTPS on deployment</h3><p>The public Railway endpoint uses HTTPS. Database connectivity uses the existing private Railway service reference; Postgres is not exposed by this application.</p></article>
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
      <div className="info-callout"><strong>Hosting-provider boundary:</strong> application code avoids logging request content, but provider infrastructure may have its own operational logs and backups outside these application controls. No encryption-at-rest, backup-retention, SOC 2, ISO, or regulatory certification claim is made here.</div>
      <p>There is no automatic retention job, metadata-only retention mode, self-service export, public password reset, multi-tenant access, independent penetration test, or external analytics service in this MVP.</p>
    </Block>
  </>;
}
