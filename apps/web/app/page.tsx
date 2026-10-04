"use client";

import { useMemo, useState } from "react";

type Evidence = {
  id: string;
  title: string;
  url?: string;
  text?: string;
  stance: "supports" | "contradicts" | "unknown";
  derived_from?: string[];
};

type Report = {
  reliance_id: string;
  claim: { id: string; text: string; extraction_method: string };
  summary: Record<string, number | string>;
  evidence: Array<Record<string, unknown>>;
  relationships: {
    edges: Array<Record<string, string>>;
    possible_links: Array<Record<string, string>>;
    unknown_relationship_pairs: Array<Record<string, string>>;
    independence_assessment: string;
    disclaimer: string;
  };
  policy_result: { outcome: string; reasons: string[]; interpretation: string };
  witness: Record<string, unknown>;
  freshness: { state: string; stale_evidence_ids?: string[] };
  conflicts: Array<Record<string, unknown>>;
  authority: { state: string; note: string };
};

const exampleClaim = "The regulator issued a $12M fine to Northstar Systems.";
const exampleAnswer = "Northstar Systems received a $12M regulatory fine. The company disputes the finding.";
const exampleSources = [
  "origin-a | Regulator enforcement notice | https://regulator.example/notices/42 | supports | The regulator issued a $12M fine to Northstar Systems. |",
  "copy-b | Syndicated news report | https://daily.example/northstar-fine | supports | The regulator issued a $12M fine to Northstar Systems. | origin-a",
  "filing-c | Court filing | https://court.example/docket/99 | supports | The filing records a $12M penalty imposed on Northstar Systems. |",
  "company-d | Company statement | https://northstar.example/statement | contradicts | Northstar Systems says the penalty remains under appeal. |",
].join("\n");

function parseEvidence(value: string): Evidence[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const [idRaw, titleRaw, urlRaw, stanceRaw, textRaw, parentRaw] = line.split("|").map((part) => part?.trim() ?? "");
    if (!titleRaw || !urlRaw) throw new Error(`Line ${index + 1}: use ID | title | URL | stance | text | derived-from IDs`);
    const stance = stanceRaw.toLowerCase();
    if (!["supports", "contradicts", "unknown", ""].includes(stance)) {
      throw new Error(`Line ${index + 1}: stance must be supports, contradicts, or unknown.`);
    }
    return {
      id: idRaw || `evidence-${index + 1}`,
      title: titleRaw,
      url: urlRaw,
      stance: (stance || "unknown") as Evidence["stance"],
      text: textRaw || undefined,
      derived_from: parentRaw ? parentRaw.split(",").map((item) => item.trim()).filter(Boolean) : [],
    };
  });
}

export default function Home() {
  const [claim, setClaim] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const overview = useMemo(() => report?.summary ?? null, [report]);

  const loadExample = () => {
    setClaim(exampleClaim);
    setAnswer(exampleAnswer);
    setSources(exampleSources);
    setError("");
    setReport(null);
  };

  const analyze = async () => {
    setError("");
    setBusy(true);
    try {
      const evidence = parseEvidence(sources);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");
      const response = await fetch(`${apiBase}/v1/reliance/inspect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, answer, evidence }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.detail?.[0]?.msg ?? payload?.detail ?? "Analysis failed.");
      setReport(payload as Report);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to analyze this evidence set.");
      setReport(null);
    } finally {
      setBusy(false);
    }
  };

  const saveWitness = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report.witness, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.reliance_id}-witness.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Indepora home"><span className="brand-mark">I</span><span>INDEPORA <small>RELIANCE FABRIC / 0.1</small></span></a>
        <div className="top-status"><span className="live-dot" /> LOCAL ANALYSIS <span className="divider">/</span> NO EXTERNAL MODEL</div>
        <a className="docs-link" href="/docs" target="_blank" rel="noreferrer">API DOCS ↗</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>01</span> EVIDENCE RELIANCE CONSOLE</div>
          <h1>One answer.<br /><em>Many appearances.</em><br />What do they depend on?</h1>
          <p>Map the evidence behind an AI claim. See repeated material, supplied derivations, unresolved lineage, and conflicts—without pretending that different sources prove independence.</p>
          <div className="hero-tags"><span>CLAIM FORGE</span><span>ORIGIN MESH</span><span>SEPARATION ENGINE</span></div>
        </div>
        <div className="hero-graphic" aria-label="Evidence paths converge on a claim">
          <div className="diagram-title">RELIANCE MAP <span>LIVE MODEL</span></div>
          <div className="flow-row"><i className="node node-blue" /><span>origin / document</span><b>─────────╲</b><strong>CLAIM</strong></div>
          <div className="flow-row"><i className="node node-amber" /><span>derived copy</span><b>──────╲　 ╲</b><strong className="claim-node">C-01</strong></div>
          <div className="flow-row"><i className="node node-blue" /><span>separate locator</span><b>────────╱</b><strong>UNKNOWN</strong></div>
          <div className="flow-row"><i className="node node-red" /><span>contradiction</span><b>──────╱</b><strong className="conflict-node">CONFLICT</strong></div>
          <div className="diagram-foot"><span>OBSERVED</span><span>INFERRED</span><span>UNKNOWN</span></div>
        </div>
      </section>

      <section className="workspace">
        <div className="section-heading"><div><div className="eyebrow"><span>02</span> RELIANCE INGRESS</div><h2>Inspect an evidence set</h2></div><button className="ghost-button" onClick={loadExample}>LOAD EXAMPLE ↗</button></div>
        <div className="input-grid">
          <label className="field field-claim"><span>CLAIM UNDER REVIEW <small>Explicit claim preferred</small></span><input value={claim} onChange={(event) => setClaim(event.target.value)} placeholder="e.g. The regulator issued a $12M fine." /></label>
          <label className="field"><span>AI ANSWER <small>Context only</small></span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Paste the relevant AI answer…" rows={4} /></label>
          <label className="field field-sources"><span>EVIDENCE / CITATIONS <small>One item per line</small></span><textarea value={sources} onChange={(event) => setSources(event.target.value)} placeholder={'ID | title | URL | supports/contradicts/unknown | excerpt | derived-from ID\nsource-1 | Report | https://example.com/report | supports | excerpt |'} rows={8} /></label>
        </div>
        <div className="form-footer"><p><strong>Format:</strong> ID | title | URL | stance | optional excerpt | optional upstream ID. Leave stance as <code>unknown</code> if unreviewed.</p><button className="primary-button" onClick={analyze} disabled={busy}>{busy ? "MAPPING EVIDENCE…" : "BUILD RELIANCE MAP"}<span>↗</span></button></div>
        {error && <div className="error-banner" role="alert">{error}</div>}
      </section>

      {report && overview && <section className="results" aria-live="polite">
        <div className="section-heading result-heading"><div><div className="eyebrow"><span>03</span> RELIANCE WITNESS <span className="record-id">{report.reliance_id}</span></div><h2>Evidence relationship report</h2></div><button className="ghost-button" onClick={saveWitness}>EXPORT WITNESS JSON ↓</button></div>
        <div className="claim-banner"><span>CLAIM</span><strong>{report.claim.text}</strong><small>IDENTITY {report.claim.id} · {report.claim.extraction_method.replaceAll("_", " ")}</small></div>
        <div className="metric-grid">
          <Metric label="Appearances" value={overview.evidence_appearances} note="submitted items" />
          <Metric label="Documents" value={overview.normalized_documents} note="normalized locators" />
          <Metric label="Candidate groups" value={overview.candidate_groups} note="not independence units" />
          <Metric label="Unknown pairs" value={overview.unknown_relationship_pairs} note="lineage unresolved" tone="amber" />
        </div>
        <div className="analysis-grid">
          <div className="panel graph-panel"><div className="panel-head"><div><span className="panel-index">A</span><h3>Evidence threads</h3></div><span className="micro-label">OBSERVED + ATTESTED LINKS</span></div>
            <div className="thread-list">{report.evidence.map((item, index) => {
              const id = String(item.id);
              const groupId = String(item.candidate_group_id ?? "—");
              const state = String(item.lineage_state ?? "UNKNOWN");
              const title = String(item.title ?? id);
              const url = String(item.canonical_url ?? item.url ?? "No source URL");
              const fp = Boolean(item.content_fingerprint);
              return <div className="thread-item" key={id}><div className="thread-rail"><span className={`thread-node ${state === "UNKNOWN" ? "unknown" : "linked"}`}>{String(index + 1).padStart(2, "0")}</span>{index < report.evidence.length - 1 && <i />}</div><div className="thread-content"><div className="thread-title-row"><strong>{title}</strong><span className={`state-pill ${state === "UNKNOWN" ? "state-unknown" : "state-observed"}`}>{state.replaceAll("_", " ")}</span></div><div className="thread-url">{url}</div><div className="thread-meta"><span>GROUP {groupId}</span><span>{fp ? "TEXT FINGERPRINTED" : "NO TEXT FINGERPRINT"}</span><span>{String(item.stance).toUpperCase()}</span></div></div></div>;
            })}</div>
            <div className="graph-disclaimer">Different URLs and separate candidate groups are <b>not proof of independence.</b></div>
          </div>
          <div className="side-column">
            <div className="panel"><div className="panel-head"><div><span className="panel-index">B</span><h3>Relationship signals</h3></div></div>
              <Signal label="Observed / attested" value={Number(overview.observed_or_attested_links)} tone="blue" />
              <Signal label="Possible same-URL links" value={Number(overview.possible_links)} tone="amber" />
              <Signal label="Unresolved pairs" value={Number(overview.unknown_relationship_pairs)} tone="muted" />
              <div className="assessment-chip"><span>INDEPENDENCE</span><strong>NOT ESTABLISHED</strong></div>
            </div>
            <div className="panel"><div className="panel-head"><div><span className="panel-index">C</span><h3>Decision boundary</h3></div></div><div className="gate-state">{String(report.policy_result.outcome).replaceAll("_", " ")}</div><p className="gate-copy">{report.policy_result.reasons.join(" ")}</p><div className="subsystem-list"><span>FRESHNESS <b>{report.freshness.state.replaceAll("_", " ")}</b></span><span>AUTHORITY <b>{report.authority.state}</b></span><span>CONFLICTS <b>{report.conflicts.length} labeled</b></span></div></div>
          </div>
        </div>
        <div className="caution-strip"><span>!</span><p><b>Interpretation boundary.</b> This prototype analyzes supplied metadata and user labels. It does not verify claim truth, rank source authority, or infer independence from separate URLs.</p></div>
      </section>}

      <footer className="footer"><span>INDEPORA / RELIANCE FABRIC</span><span>V0.1 · TRACE → MAP → EXPLAIN</span><span>NO TRUTH CLAIMS</span></footer>
    </main>
  );
}

function Metric({ label, value, note, tone = "blue" }: { label: string; value: string | number; note: string; tone?: string }) {
  return <div className={`metric-card metric-${tone}`}><span>{label}</span><strong>{String(value)}</strong><small>{note}</small></div>;
}

function Signal({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="signal-row"><span className={`signal-dot ${tone}`} /><span>{label}</span><strong>{value}</strong></div>;
}
