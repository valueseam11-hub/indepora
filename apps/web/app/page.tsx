import Link from "next/link";
import { Eyebrow, SiteShell } from "./components/site-shell";
import { StemcheckWidget } from "./components/stemcheck-widget";

const stages = [
  { no: "01", title: "Capture", copy: "Submit a claim or answer with the evidence you want to inspect.", state: "INPUT CONTRACT" },
  { no: "02", title: "Trace", copy: "Keep supplied derivations and exact observed matches visible as separate bases.", state: "MVP · LIMITED" },
  { no: "03", title: "Connect", copy: "Represent observed, attested, possible, and unknown relationships without guessing ancestry.", state: "MVP · DETERMINISTIC" },
  { no: "04", title: "Count", copy: "Show candidate groups, candidate Fount references, and excess appearances in linked groups.", state: "MVP · NOT CALIBRATED" },
  { no: "05", title: "Decide", copy: "Apply the submitted Charter to unresolved lineage, document count, conflicts, and freshness.", state: "MVP · CALLER POLICY" },
  { no: "06", title: "Act", copy: "Return a workflow outcome. External agents and production actions are not wired yet.", state: "ROADMAP" },
];

const trialTypes = ["Exact duplicate", "Syndication", "Republication", "Paraphrase", "AI echo", "Shared retrieval", "Multi-agent convergence", "Genuine independence", "Conflict", "Unknown lineage"];

function StemmaWheel() {
  return (
    <div className="site-wheel-card">
      <div className="wheel-card-head"><span>STEMMA WHEEL <small>SCHEMATIC · NOT A LIVE CLAIM</small></span><span className="wheel-led"><i /> SYSTEM READY</span></div>
      <div className="site-wheel-scene">
        <svg className="site-wheel-lines" viewBox="0 0 560 420" role="img" aria-label="Schematic evidence relationships converge into a central analysis node">
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
        <div className="wheel-core-label"><span>INDEPORA</span><small>RELIANCE FABRIC</small></div>
        <div className="wheel-side-label wheel-side-left"><b>INPUT</b><span>claim · sources · links</span></div>
        <div className="wheel-side-label wheel-side-right"><b>OUTPUT</b><span>observed · attested · unknown</span></div>
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
          <div className="site-hero-photo" role="img" aria-label="Analyst examining an evidence network in a dark research room" />
          <div className="site-hero-shade" />
          <div className="site-hero-inner">
            <div className="site-hero-copy">
              <Eyebrow>THE EVIDENCE ASSURANCE LAYER</Eyebrow>
              <h1>Agent count is not <em>evidence count.</em></h1>
              <p>Indepora traces the relationships behind AI evidence, keeps unknown lineage visible, and applies a caller-defined Charter before a workflow relies on it.</p>
              <div className="site-hero-actions">
                <Link className="site-button site-button-primary" href="#stemcheck">ANALYZE EVIDENCE LIVE <span aria-hidden="true">↘</span></Link>
                <Link className="site-button site-button-quiet" href="/product/">EXPLORE THE FABRIC <span aria-hidden="true">↗</span></Link>
              </div>
              <div className="hero-proofline"><span><i/> NO AUTO-SAVE</span><span><i/> NO TRUTH SCORE</span><span><i/> UNKNOWN STAYS UNKNOWN</span></div>
            </div>
            <StemmaWheel />
          </div>
          <div className="site-hero-status"><span>RELIANCE FLOW / 001</span><span>OBSERVED &nbsp;·&nbsp; ATTESTED &nbsp;·&nbsp; POSSIBLE &nbsp;·&nbsp; UNKNOWN</span><span>PROTOTYPE</span></div>
        </section>

        <div className="site-flow-ribbon" aria-label="Evidence flow">
          <span>CLAIM</span><i>→</i><span>EVIDENCE</span><i>→</i><span>STEMMA</span><i>→</i><span>FOUNT REFERENCES</span><i>→</i><span>STANDING</span><i>→</i><span>CHARTER</span>
        </div>

        <section className="site-section site-question" id="product-intro">
          <div className="site-section-heading">
            <Eyebrow>THE QUESTION UNDER THE CITATIONS</Eyebrow>
            <h2>How many reasons are actually behind this answer?</h2>
            <p>More citations can mean more copies, not more independent support. Indepora makes the submitted lineage inspectable before any team treats repetition as corroboration.</p>
          </div>
          <div className="question-visual">
            <div className="qv-source-stack" aria-label="Schematic citations">
              {[
                ["REPORT", "source-a"], ["REPOST", "source-b"], ["SUMMARY", "source-c"], ["AGENT", "source-d"], ["CITATION", "source-e"], ["ANSWER", "source-f"],
              ].map(([label, id], index) => <div className={`qv-card qv-card-${index + 1}`} key={id}><span className="qv-card-icon">{String(index + 1).padStart(2, "0")}</span><span><small>{label}</small><b>{id}</b></span><i aria-hidden="true">···</i></div>)}
            </div>
            <div className="qv-connectors" aria-hidden="true"><span/><span/><span/></div>
            <div className="qv-stemma">
              <span className="site-kicker">SYNTHETIC RELATIONSHIP SKETCH</span>
              <div className="qv-cluster"><i className="legend-dot dot-cyan"/><span><b>Observed / attested cluster</b><small>only supplied or exact-match edges join it</small></span><strong>→</strong></div>
              <div className="qv-cluster"><i className="legend-dot dot-veil"/><span><b>Veiled relationship</b><small>unknown does not mean dependent</small></span><strong>?</strong></div>
              <div className="qv-notice">Different URLs and separate graph groups are not proof of independent sources.</div>
            </div>
          </div>
        </section>

        <section className="site-section site-demo-section" id="stemcheck">
          <div className="site-section-heading split-heading">
            <div><Eyebrow>STEMCHECK · PUBLIC TRANSIENT PREVIEW</Eyebrow><h2>Give the evidence a chance to disagree.</h2></div>
            <p>Run the current deterministic engine on a synthetic fixture or paste a small evidence set. The API returns a request-scoped report; it does not save it. A private owner can explicitly save a complete record in the workspace.</p>
          </div>
          <StemcheckWidget />
        </section>

        <section className="site-section site-stack-preview">
          <div className="site-section-heading split-heading">
            <div><Eyebrow>THE INDEPORA STACK</Eyebrow><h2>From submitted evidence to an auditable workflow outcome.</h2></div>
            <p>Some layers are live in the prototype; others are the roadmap. We mark the boundary instead of implying that integrations already exist.</p>
          </div>
          <div className="stage-grid">
            {stages.map((stage) => <article className="stage-card" key={stage.no}>
              <div className="stage-top"><span>{stage.no}</span><small>{stage.state}</small></div>
              <h3>{stage.title}</h3><p>{stage.copy}</p>
              <div className="stage-track"><i/></div>
            </article>)}
          </div>
          <Link className="site-inline-link" href="/product/">See the implemented layers and roadmap <span aria-hidden="true">↗</span></Link>
        </section>

        <section className="site-section site-standing-preview">
          <div className="standing-copy">
            <Eyebrow>STANDING IS A SNAPSHOT, NOT A SCORE</Eyebrow>
            <h2>Before a workflow acts, know what the evidence state can—and cannot—support.</h2>
            <p>A Standing captures an engine version, submitted evidence, relationships, Charter, and policy outcome at one point in time. It does not establish truth, authority, or calibrated confidence.</p>
            <Link className="site-inline-link" href="/product/#charter">See what the current Charter can configure <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="standing-object">
            <div className="standing-object-head"><span>RELIANCE OBJECT / EXAMPLE</span><span className="standing-version">VERSIONED SNAPSHOT</span></div>
            <div className="standing-row"><span>CLAIM</span><b>Submitted by caller</b><small>NOT VERIFIED</small></div>
            <div className="standing-row"><span>STEMMA</span><b>Observed + attested edges</b><small>INPUT-BOUND</small></div>
            <div className="standing-row"><span>FOUNTS</span><b>Candidate references</b><small>NOT INDEPENDENCE</small></div>
            <div className="standing-row"><span>VEILED</span><b>Unknown remains unknown</b><small>CHARTER-DEFINED</small></div>
            <div className="standing-state"><span>STANDING</span><strong>POLICY OUTCOME</strong><small>No Charter → NOT_CONFIGURED</small></div>
            <div className="standing-object-note">The live demo computes its result from the request. This card is an explanatory schema, not customer data.</div>
          </div>
        </section>

        <section className="site-section site-trials-preview">
          <div className="site-section-heading split-heading">
            <div><Eyebrow>ECHO TRIALS · FIXTURE SET</Eyebrow><h2>Can a system tell an echo from an unknown?</h2></div>
            <p>No public leaderboard or performance claim yet. The benchmark needs reviewed labels and measured results before comparisons are published.</p>
          </div>
          <div className="trial-chips">{trialTypes.map((type, index) => <span key={type}><small>{String(index + 1).padStart(2, "0")}</small>{type}</span>)}</div>
          <div className="observatory-bar"><span><i className="observatory-pulse"/> EVIDENCE OBSERVATORY</span><b>LIVE DEMO DATASET</b><small>Illustrative synthetic cases only · no fabricated product-usage statistics</small></div>
          <div className="site-route-cards">
            <Link href="/research/" className="route-card"><span>01 / LAB</span><b>Methods before leaderboards.</b><small>See the research questions, fixture categories, and validation gaps.</small><i>↗</i></Link>
            <Link href="/developers/" className="route-card"><span>02 / BUILD</span><b>Start with the API.</b><small>Inspect the public transient endpoint and the private owner boundary.</small><i>↗</i></Link>
            <Link href="/design-partners/" className="route-card"><span>03 / PILOT</span><b>Test with redacted cases.</b><small>Partner workflow and safe pilot boundaries for an early prototype.</small><i>↗</i></Link>
          </div>
        </section>

        <section className="site-final-cta">
          <div><Eyebrow>SEE → UNDERSTAND → TRY</Eyebrow><h2>Start with one claim.<br/><em>Keep every uncertainty visible.</em></h2></div>
          <Link className="site-button site-button-primary" href="#stemcheck">RUN STEMCHECK <span aria-hidden="true">↗</span></Link>
        </section>
      </main>
    </SiteShell>
  );
}
