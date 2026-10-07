import Link from "next/link";
import Image from "next/image";
import { Eyebrow, SiteShell } from "./components/site-shell";
import { StemcheckWidget } from "./components/stemcheck-widget";

const stages = [
  { no: "01", title: "Input", copy: "Submit a claim or answer with citations and evidence items.", state: "COMPUTED · REQUEST-SCOPED" },
  { no: "02", title: "Stemma", copy: "Show supplied and exact-match relationships; keep possible links separate.", state: "LIVE · LIMITED" },
  { no: "03", title: "Kin", copy: "Assess only observable or caller-attested relationships; do not infer independence.", state: "LIVE · INPUT-BOUND" },
  { no: "04", title: "Candidate Fount References", copy: "Return origin references, not a verified independence finding.", state: "COMPUTED · CANDIDATE REFS" },
  { no: "05", title: "Standing", copy: "Preserve the evidence state, engine version, Charter, and decision outcome.", state: "COMPUTED · SNAPSHOT" },
  { no: "06", title: "Charter", copy: "Let caller policy determine how unresolved lineage and conflicts affect a workflow.", state: "LIVE · CALLER POLICY" },
  { no: "07", title: "Decision", copy: "Return a policy label; downstream production actuation is not connected.", state: "LIVE LABEL · ACTUATION ROADMAP" },
];

const trialTypes = ["Exact duplicate", "Syndication", "Republication", "Paraphrase", "AI echo", "Shared retrieval", "Multi-agent convergence", "Genuine independence", "Conflict", "Unknown lineage"];

function StemmaWheel() {
  return (
    <div className="site-wheel-card">
      <div className="wheel-card-head"><span>STEMMA <small>ILLUSTRATIVE · SCHEMATIC ONLY</small></span><span className="wheel-led"><i /> RELATIONSHIP STATES</span></div>
      <div className="site-wheel-scene">
        <svg className="site-wheel-lines" viewBox="0 0 560 420" role="img" aria-label="Illustrative evidence relationship states around a central analysis node">
          <defs>
            <radialGradient id="wheel-glow"><stop offset="0" stopColor="#56e2ce" stopOpacity=".18"/><stop offset="1" stopColor="#56e2ce" stopOpacity="0"/></radialGradient>
          </defs>
          <circle cx="280" cy="210" r="188" fill="url(#wheel-glow)" />
          <g className="wheel-rings"><circle cx="280" cy="210" r="160"/><circle cx="280" cy="210" r="116"/><circle cx="280" cy="210" r="67"/></g>
          <g className="wheel-links">
            <path d="M59 85 177 130 234 180"/><path d="M94 301 183 272 234 238"/><path d="M177 40 216 116 254 166"/>
            <path d="M501 88 383 132 326 180"/><path d="M472 320 380 276 326 239"/><path d="M389 38 347 115 306 166"/>
            <path className="link-amber" d="M50 207 149 207 216 207"/><path className="link-unknown" d="M512 207 410 207 344 207"/>
          </g>
          <g className="wheel-nodes">
            <circle cx="59" cy="85" r="7"/><circle cx="94" cy="301" r="6"/><circle cx="177" cy="40" r="5"/>
            <circle cx="501" cy="88" r="7"/><circle cx="472" cy="320" r="6"/><circle cx="389" cy="38" r="5"/>
            <circle cx="50" cy="207" r="5"/><circle cx="512" cy="207" r="6" className="node-veil"/>
            <circle cx="177" cy="130" r="4"/><circle cx="183" cy="272" r="4"/><circle cx="383" cy="132" r="4"/><circle cx="380" cy="276" r="4"/>
          </g>
          <circle className="wheel-core" cx="280" cy="210" r="39" />
          <circle className="wheel-pulse" cx="280" cy="210" r="52" />
        </svg>
        <div className="wheel-core-label"><span>INDEPORA</span><small>EVIDENCE ASSURANCE</small></div>
        <div className="wheel-side-label wheel-side-left"><b>INPUT</b><span>claim · sources · links</span></div>
        <div className="wheel-side-label wheel-side-right"><b>OUTPUT</b><span>observed · possible · unknown</span></div>
      </div>
      <div className="wheel-card-foot"><span><i className="legend-dot dot-cyan"/> observed / attested</span><span><i className="legend-dot dot-amber"/> possible</span><span><i className="legend-dot dot-veil"/> unknown</span></div>
    </div>
  );
}

export default function Home() {
  return (
    <SiteShell active="Live Demo">
      <main id="top">
        <section className="site-hero">
          <div className="site-hero-shade" />
          <div className="site-hero-inner">
            <div className="site-hero-copy">
              <div className="hero-brand-lockup">
                <Image src="/brand/indepora-mark-animated.svg" width={56} height={56} unoptimized alt="" aria-hidden="true" />
                <span><b>INDEPORA</b><small>EVIDENCE ASSURANCE INFRASTRUCTURE FOR AI</small></span>
              </div>
              <Eyebrow>THE EVIDENCE LAYER BEFORE RELIANCE</Eyebrow>
              <h1>Agent count is not <em>evidence count.</em></h1>
              <p className="hero-positioning">The evidence layer between AI output and consequential reliance.</p>
              <p>Indepora traces evidence relationships, preserves uncertainty, measures evidentiary dependence as the engine matures, and applies a policy boundary before AI evidence is relied upon.</p>
              <div className="site-hero-actions">
                <Link className="site-button site-button-primary" href="#stemcheck">RUN STEMCHECK <span aria-hidden="true">↘</span></Link>
                <Link className="site-button site-button-quiet" href="/product/">EXPLORE THE PRODUCT <span aria-hidden="true">↗</span></Link>
              </div>
              <div className="hero-proofline"><span><i/> NO AUTO-SAVE</span><span><i/> NO TRUTH SCORE</span><span><i/> UNKNOWN STAYS UNKNOWN</span></div>
              <div className="hero-scenario" aria-label="Illustrative scenario inputs, not live analytics">
                <div className="scenario-label"><span>ILLUSTRATIVE SCENARIO</span><small>NOT LIVE PRODUCT ANALYTICS</small></div>
                <div className="scenario-counts"><span><b>10</b><small>items</small></span><span><b>7</b><small>agents</small></span><span><b>4</b><small>models</small></span><span><b>10</b><small>citations</small></span></div>
                <p>Agent/model counts are scenario context only; the current API computes from submitted evidence items, not agent or model telemetry.</p>
              </div>
            </div>
            <StemmaWheel />
          </div>
          <div className="site-hero-status"><span>INDEPORA / EVIDENCE ASSURANCE INFRASTRUCTURE</span><span>OBSERVED &nbsp;·&nbsp; ATTESTED &nbsp;·&nbsp; POSSIBLE &nbsp;·&nbsp; UNKNOWN</span><span>PROTOTYPE</span></div>
        </section>

        <div className="site-flow-ribbon" aria-label="Product flow"><span>APPARENT EVIDENCE</span><i>→</i><span>STEMMA</span><i>→</i><span>KIN</span><i>→</i><span>CANDIDATE FOUNT REFERENCES</span><i>→</i><span>STANDING</span><i>→</i><span>CHARTER</span><i>→</i><span>DECISION</span></div>

        <section className="site-section site-question" id="product-intro">
          <div className="site-section-heading">
            <Eyebrow>THE QUESTION UNDER THE CITATIONS</Eyebrow>
            <h2>How many reasons are actually behind this answer?</h2>
            <p>More citations can mean more copies, not more independent support. Indepora makes submitted lineage inspectable before a workflow relies on it; missing lineage stays unresolved.</p>
          </div>
          <div className="question-visual">
            <div className="qv-source-stack" aria-label="Illustrative evidence items">
              {[["REPORT", "source-a"], ["REPOST", "source-b"], ["SUMMARY", "source-c"], ["AGENT OUTPUT", "source-d"], ["CITATION", "source-e"], ["ANSWER", "source-f"]].map(([label, id], index) => <div className={`qv-card qv-card-${index + 1}`} key={id}><span className="qv-card-icon">{String(index + 1).padStart(2, "0")}</span><span><small>{label}</small><b>{id}</b></span><i aria-hidden="true">···</i></div>)}
            </div>
            <div className="qv-connectors" aria-hidden="true"><span/><span/><span/></div>
            <div className="qv-stemma">
              <span className="site-kicker">ILLUSTRATIVE RELATIONSHIP STATES</span>
              <div className="qv-cluster"><i className="legend-dot dot-cyan"/><span><b>Observed / attested</b><small>supported by exact evidence or a caller declaration</small></span><strong>→</strong></div>
              <div className="qv-cluster"><i className="legend-dot dot-amber"/><span><b>Possible</b><small>a potential relationship, not proven</small></span><strong>~</strong></div>
              <div className="qv-cluster"><i className="legend-dot dot-veil"/><span><b>Unknown / Veiled</b><small>not enough information to establish lineage</small></span><strong>?</strong></div>
              <div className="qv-notice">Different URLs and separate graph groups are not proof of independent sources.</div>
            </div>
          </div>
        </section>

        <section className="site-section site-demo-section" id="stemcheck">
          <div className="site-section-heading split-heading">
            <div><Eyebrow>STEMCHECK · PUBLIC TRANSIENT PREVIEW</Eyebrow><h2>Make the guess. Then inspect the evidence.</h2></div>
            <p>Run a synthetic challenge or paste a small evidence set through the real deterministic API. The request is not saved. Only the authenticated owner can explicitly save a complete Reliance Record in the private workspace.</p>
          </div>
          <StemcheckWidget />
        </section>

        <section className="site-section site-stack-preview">
          <div className="site-section-heading split-heading">
            <div><Eyebrow>THE INDEPORA STACK</Eyebrow><h2>From submitted evidence to a policy-relevant Standing.</h2></div>
            <p>Each layer is marked by maturity. Candidate Fount references are not proof of independence, and policy outcomes are not truth scores.</p>
          </div>
          <div className="stage-grid">
            {stages.map((stage) => <article className="stage-card" key={stage.no}>
              <div className="stage-top"><span>{stage.no}</span><small className={stage.state.includes("ROADMAP") ? "maturity-roadmap" : stage.state.includes("LIMITED") ? "maturity-limited" : stage.state.startsWith("COMPUTED") ? "maturity-computed" : "maturity-live"}>{stage.state}</small></div>
              <h3>{stage.title}</h3><p>{stage.copy}</p>
              <div className="stage-track"><i/></div>
            </article>)}
          </div>
          <Link className="site-inline-link" href="/product/">See implemented layers and roadmap <span aria-hidden="true">↗</span></Link>
        </section>

        <section className="site-section site-standing-preview">
          <div className="standing-copy">
            <Eyebrow>STANDING IS A SNAPSHOT, NOT A SCORE</Eyebrow>
            <h2>Know what the evidence state can—and cannot—support.</h2>
            <p>A Standing captures an engine version, submitted evidence, relationships, Charter, and policy outcome at one point in time. It does not establish truth, authority, or calibrated independence.</p>
            <Link className="site-inline-link" href="/product/#charter">See what the current Charter can configure <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="standing-object">
            <div className="standing-object-head"><span>ILLUSTRATIVE SCHEMA · NOT A LIVE RESULT</span><span className="standing-version">VERSIONED SNAPSHOT</span></div>
            <div className="standing-row"><span>CLAIM</span><b>Submitted by caller</b><small>NOT VERIFIED</small></div>
            <div className="standing-row"><span>STEMMA</span><b>Observed + attested edges</b><small>INPUT-BOUND</small></div>
            <div className="standing-row"><span>FOUNTS</span><b>Candidate Fount References</b><small>NOT INDEPENDENCE</small></div>
            <div className="standing-row"><span>VEILED</span><b>Unknown remains unknown</b><small>CHARTER-DEFINED</small></div>
            <div className="standing-state"><span>STANDING</span><strong>POLICY OUTCOME</strong><small>No Charter → NOT_CONFIGURED</small></div>
            <div className="standing-object-note">The live demo computes its result from the request. This schema illustration contains no customer data.</div>
          </div>
        </section>

        <section className="site-limitation-line" aria-label="Current product limitations">
          <span>LIMITATION</span><p>Current lineage is input-bound and deterministic: no semantic/entity lineage, validated independence score, source-authority verification, or production actuation.</p><Link href="/trust/">Read the limits and privacy boundary ↗</Link>
        </section>

        <section className="site-section site-trials-preview">
          <div className="site-section-heading split-heading">
            <div><Eyebrow>INTERNAL EVALUATION · ECHO TRIALS</Eyebrow><h2>Measure the limits, not just the wins.</h2></div>
            <p>A small team-authored evaluation is now reported with its baseline comparisons and failure modes. It is not an independent benchmark or a validated independence score.</p>
          </div>
          <div className="trial-chips">{trialTypes.map((type, index) => <span key={type}><small>{String(index + 1).padStart(2, "0")}</small>{type}</span>)}</div>
          <div className="observatory-bar"><span><i className="observatory-pulse"/> EVIDENCE OBSERVATORY</span><b>ILLUSTRATIVE FIXTURES</b><small>Illustrative synthetic cases only — no fabricated product-usage statistics.</small></div>
          <div className="site-route-cards">
            <Link href="/research/#internal-evaluation" className="route-card"><span>01 / LAB</span><b>Review the internal evaluation.</b><small>See the reported comparisons, disclosure, and known failure cases.</small><i>↗</i></Link>
            <Link href="/developers/" className="route-card"><span>02 / BUILD</span><b>Run the API.</b><small>Inspect the real transient endpoint and the private owner boundary.</small><i>↗</i></Link>
            <Link href="/design-partners/" className="route-card"><span>03 / PILOT</span><b>Start with redacted cases.</b><small>Review the safe pilot boundaries; partner intake is not yet available.</small><i>↗</i></Link>
          </div>
        </section>

        <section className="site-final-cta">
          <div><Eyebrow>SEE → RUN → INSPECT → DECIDE</Eyebrow><h2>Start with one claim.<br/><em>Keep every uncertainty visible.</em></h2></div>
          <Link className="site-button site-button-primary" href="#stemcheck">RUN STEMCHECK <span aria-hidden="true">↗</span></Link>
        </section>
      </main>
    </SiteShell>
  );
}
