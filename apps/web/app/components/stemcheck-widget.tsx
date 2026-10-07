"use client";

import Link from "next/link";
import { useState, type FormEvent, type KeyboardEvent } from "react";

type EvidenceInput = {
  id: string;
  title: string;
  url?: string;
  text?: string;
  origin_id?: string;
  stance: "supports" | "contradicts" | "unknown";
  derived_from: string[];
  source_kind?: string;
};

type Payload = {
  claim: string;
  answer?: string;
  evidence: EvidenceInput[];
  policy: {
    minimum_documents: number;
    unknown_lineage_action: "qualify";
    require_conflict_review: boolean;
  };
};

type Relation = { from: string; to: string; type: string; basis?: string; certainty?: string; note?: string };
type CandidateGroup = { id: string; members: string[]; basis: string };
type StemcheckReport = {
  reliance_id: string;
  claim: { text: string };
  summary: {
    evidence_appearances: number;
    candidate_groups: number;
    observed_or_attested_links: number;
    possible_links: number;
    unknown_relationship_pairs: number;
    independence_assessment: string;
  };
  evidence: Array<{ id: string; title: string; stance: string; lineage_state?: string }>;
  relationships: {
    edges: Relation[];
    possible_links: Relation[];
    candidate_groups: CandidateGroup[];
    unknown_relationship_pairs: Array<{ left: string; right: string; state: string }>;
    independence_assessment: string;
    disclaimer: string;
  };
  fount_count: { candidate_fount_references: number; evidence_without_resolved_fount_reference: number; interpretation: string };
  echo_mass: { observed_or_attested_excess_appearances: number; observed_or_attested_relationship_count: number; method: string };
  veiled: { state: string; evidence_ids: string[]; charter_action: string };
  conflicts: Array<Record<string, unknown>>;
  policy_result: { outcome: string; reasons: string[]; interpretation: string };
  standing: string;
  engine_version: string;
};

type Mode = "challenge" | "fixture" | "paste";

const sampleClaim = "A fictional regulator issued a notice about the Northstar example.";
const sampleEvidence = [
  "origin-a | Fictional regulator notice | https://regulator.example/notices/42 | supports | The fictional notice was issued. |",
  "copy-b | Fictional syndicated report | https://daily.example/northstar | supports | The fictional notice was issued. | origin-a",
  "filing-c | Fictional court record | https://court.example/docket/99 | supports | The fictional notice appears in a filing. |",
  "company-d | Fictional company statement | https://northstar.example/statement | contradicts | The fictional notice is disputed. |",
].join("\n");

function parseEvidence(value: string): EvidenceInput[] {
  const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) throw new Error("Add at least one citation or evidence line.");
  if (lines.length > 100) throw new Error("The prototype accepts at most 100 evidence items per analysis.");
  const parsed = lines.map((line, index) => {
    const [idRaw, titleRaw, urlRaw, stanceRaw, textRaw, parentRaw] = line.split("|").map((part) => part?.trim() ?? "");
    if (!titleRaw || !urlRaw) throw new Error(`Line ${index + 1}: use ID | title | URL | stance | excerpt | upstream IDs.`);
    const stance = stanceRaw.toLowerCase() || "unknown";
    if (!["supports", "contradicts", "unknown"].includes(stance)) {
      throw new Error(`Line ${index + 1}: stance must be supports, contradicts, or unknown.`);
    }
    return {
      id: idRaw || `evidence-${index + 1}`,
      title: titleRaw,
      url: urlRaw,
      stance: stance as EvidenceInput["stance"],
      text: textRaw || undefined,
      derived_from: parentRaw ? parentRaw.split(",").map((item) => item.trim()).filter(Boolean) : [],
    };
  });
  if (new Set(parsed.map((item) => item.id)).size !== parsed.length) throw new Error("Evidence IDs must be unique.");
  return parsed;
}

function makeFixture(count: number): Payload {
  const firstGroup = Math.max(2, Math.round(count * 0.55));
  const secondGroup = Math.max(2, Math.floor(count * 0.25));
  const evidence: EvidenceInput[] = [];
  for (let index = 0; index < count; index += 1) {
    if (index < firstGroup) {
      const id = index === 0 ? "origin-a" : `strand-a-${index}`;
      evidence.push({
        id,
        title: index === 0 ? "Synthetic origin A" : `Synthetic derivative A-${index}`,
        url: index === 0 ? "https://primary-a.example/report" : `https://repost-a-${index}.example/story`,
        text: `Synthetic fixture: origin A supports the fictional event; item ${index + 1}.`,
        origin_id: "fixture-origin-a",
        stance: "supports",
        derived_from: index === 0 ? [] : ["origin-a"],
      });
    } else if (index < firstGroup + secondGroup) {
      const localIndex = index - firstGroup;
      const id = localIndex === 0 ? "origin-b" : `strand-b-${localIndex}`;
      evidence.push({
        id,
        title: localIndex === 0 ? "Synthetic origin B" : `Synthetic derivative B-${localIndex}`,
        url: localIndex === 0 ? "https://primary-b.example/record" : `https://repost-b-${localIndex}.example/summary`,
        text: `Synthetic fixture: origin B mentions the fictional event; item ${index + 1}.`,
        origin_id: "fixture-origin-b",
        stance: "supports",
        derived_from: localIndex === 0 ? [] : ["origin-b"],
      });
    } else {
      evidence.push({
        id: `veiled-${index + 1}`,
        title: `Synthetic unresolved item ${index + 1}`,
        url: `https://unresolved-${index + 1}.example/item`,
        text: `Synthetic fixture with no supplied lineage for item ${index + 1}.`,
        stance: "unknown",
        derived_from: [],
      });
    }
  }
  return {
    claim: "A fictional event occurred (synthetic fixture only).",
    evidence,
    policy: { minimum_documents: 1, unknown_lineage_action: "qualify", require_conflict_review: true },
  };
}

function makeChallengeFixture(): Payload {
  const evidence: EvidenceInput[] = [
    { id: "report-a", title: "Report · origin A", url: "https://report-a.example/story", origin_id: "challenge-origin-a", stance: "supports", source_kind: "report", text: "Synthetic report A supports a fictional event.", derived_from: [] },
    { id: "repost-a", title: "Repost · origin A", url: "https://repost-a.example/story", origin_id: "challenge-origin-a", stance: "supports", source_kind: "repost", text: "Synthetic repost derived from report A.", derived_from: ["report-a"] },
    { id: "summary-a", title: "Summary · origin A", url: "https://summary-a.example/brief", origin_id: "challenge-origin-a", stance: "supports", source_kind: "summary", text: "Synthetic summary derived from repost A.", derived_from: ["repost-a"] },
    { id: "agent-a", title: "Agent output · origin A", url: "https://agent-a.example/result", origin_id: "challenge-origin-a", stance: "supports", source_kind: "agent_output", text: "Synthetic agent output derived from summary A.", derived_from: ["summary-a"] },
    { id: "citation-a", title: "Citation · origin A", url: "https://citation-a.example/reference", origin_id: "challenge-origin-a", stance: "supports", source_kind: "citation", text: "Synthetic citation derived from agent output A.", derived_from: ["agent-a"] },
    { id: "answer-a", title: "Answer extract · origin A", url: "https://answer-a.example/extract", origin_id: "challenge-origin-a", stance: "supports", source_kind: "answer", text: "Synthetic answer excerpt derived from citation A.", derived_from: ["citation-a"] },
    { id: "report-b", title: "Report · origin B", url: "https://report-b.example/record", origin_id: "challenge-origin-b", stance: "supports", source_kind: "report", text: "A second synthetic report mentions the fictional event.", derived_from: [] },
    { id: "agent-b", title: "Agent output · origin B", url: "https://agent-b.example/result", origin_id: "challenge-origin-b", stance: "supports", source_kind: "agent_output", text: "Synthetic agent output derived from report B.", derived_from: ["report-b"] },
    { id: "unknown-c", title: "Citation · unresolved C", url: "https://unknown-c.example/item", stance: "unknown", source_kind: "citation", text: "Synthetic citation with no supplied source lineage.", derived_from: [] },
    { id: "unknown-d", title: "Agent output · unresolved D", url: "https://unknown-d.example/item", stance: "unknown", source_kind: "agent_output", text: "Synthetic agent output with no supplied source lineage.", derived_from: [] },
  ];
  return {
    claim: "A fictional event occurred (Challenge INDEPORA synthetic case).",
    evidence,
    policy: { minimum_documents: 1, unknown_lineage_action: "qualify", require_conflict_review: true },
  };
}

const modes: Mode[] = ["challenge", "fixture", "paste"];
const modeLabels: Record<Mode, string> = {
  challenge: "Challenge INDEPORA",
  fixture: "Synthetic fixture",
  paste: "Analyze pasted evidence",
};

export function StemcheckWidget() {
  const [mode, setMode] = useState<Mode>("challenge");
  const [sourceCount, setSourceCount] = useState(10);
  const [challengeGuess, setChallengeGuess] = useState("3");
  const [reportedGuess, setReportedGuess] = useState<string | null>(null);
  const [claim, setClaim] = useState("");
  const [answer, setAnswer] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [report, setReport] = useState<StemcheckReport | null>(null);
  const [reportMode, setReportMode] = useState<Mode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const analyze = async (payload: Payload, sourceMode: Mode) => {
    setBusy(true);
    setError("");
    setReport(null);
    setReportMode(null);
    setReportedGuess(sourceMode === "challenge" ? challengeGuess : null);
    try {
      const response = await fetch("/v1/stemcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
      });
      const result = await response.json().catch(() => null) as StemcheckReport | { detail?: string } | null;
      if (!response.ok) {
        const detail = result && "detail" in result && typeof result.detail === "string" ? result.detail : `Analysis failed (${response.status}).`;
        throw new Error(detail);
      }
      setReport(result as StemcheckReport);
      setReportMode(sourceMode);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const analyzeChallenge = () => { void analyze(makeChallengeFixture(), "challenge"); };
  const analyzeFixture = () => { void analyze(makeFixture(sourceCount), "fixture"); };
  const loadExample = () => {
    setClaim(sampleClaim);
    setAnswer("The Northstar example has a fictional notice, a syndicated echo, a court reference, and a company response.");
    setEvidenceText(sampleEvidence);
    setReport(null);
    setReportMode(null);
    setReportedGuess(null);
    setError("");
  };
  const clear = () => {
    setClaim("");
    setAnswer("");
    setEvidenceText("");
    setReport(null);
    setReportMode(null);
    setReportedGuess(null);
    setError("");
  };
  const submitPaste = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const evidence = parseEvidence(evidenceText);
      if (!claim.trim() && !answer.trim()) throw new Error("Provide a claim or an AI answer.");
      void analyze({
        claim: claim.trim() || answer.trim(),
        answer: answer.trim() || undefined,
        evidence,
        policy: { minimum_documents: 0, unknown_lineage_action: "qualify", require_conflict_review: true },
      }, "paste");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Check the evidence input and try again.");
    }
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const current = modes.indexOf(mode);
    const next = modes[(current + direction + modes.length) % modes.length];
    setMode(next);
    document.getElementById(`stemcheck-tab-${next}`)?.focus();
  };

  const evidenceNames = new Map((report?.evidence ?? []).map((item) => [item.id, item.title]));
  const evidenceName = (id: string) => evidenceNames.get(id) ?? id;

  return (
    <div className="stemcheck-widget">
      <div className="stemcheck-tabs" role="tablist" aria-label="Stemcheck mode">
        {modes.map((tab) => <button key={tab} id={`stemcheck-tab-${tab}`} type="button" role="tab" aria-controls={`stemcheck-panel-${tab}`} aria-selected={mode === tab} tabIndex={mode === tab ? 0 : -1} className={mode === tab ? "selected" : ""} onKeyDown={onTabKeyDown} onClick={() => setMode(tab)}>{modeLabels[tab]}</button>)}
      </div>

      {mode === "challenge" ? (
        <div id="stemcheck-panel-challenge" className="stemcheck-panel challenge-panel" role="tabpanel" aria-labelledby="stemcheck-tab-challenge" tabIndex={0}>
          <div className="challenge-intro">
            <span className="site-kicker">ILLUSTRATIVE INPUT · COMPUTED OUTPUT</span>
            <h3>How many independent origins do you think are behind these citations?</h3>
            <p>Ten fictional evidence items show reports, reposts, summaries, agent outputs, citations, and unresolved lineage. The 7-agent / 4-model counts are scenario context only; this API does not collect or score agent/model telemetry.</p>
            <div className="challenge-scene-flow"><span>REPORT</span><i>→</i><span>REPOST</span><i>→</i><span>SUMMARY</span><i>→</i><span>AGENT OUTPUT</span><i>→</i><span>CITATION</span><i>→</i><span>ANSWER</span></div>
          </div>
          <div className="challenge-action">
            <div className="challenge-choices" role="radiogroup" aria-label="Your estimate of independent origins">
              {["1", "2", "3", "4", "5+"].map((guess) => <button key={guess} type="button" role="radio" aria-checked={challengeGuess === guess} className={challengeGuess === guess ? "selected" : ""} onClick={() => setChallengeGuess(guess)}>{guess}</button>)}
            </div>
            <button type="button" className="site-button site-button-primary" onClick={analyzeChallenge} disabled={busy}>{busy ? "RUNNING REAL STEMCHECK API…" : "RUN CHALLENGE INDEPORA"}<span aria-hidden="true">↗</span></button>
            <small>Runs the current deterministic engine at <code>/v1/stemcheck</code>. Synthetic input only; no save.</small>
          </div>
        </div>
      ) : mode === "fixture" ? (
        <div id="stemcheck-panel-fixture" className="stemcheck-panel fixture-panel" role="tabpanel" aria-labelledby="stemcheck-tab-fixture" tabIndex={0}>
          <div className="fixture-copy">
            <span className="site-kicker">ILLUSTRATIVE INPUT · COMPUTED OUTPUT</span>
            <h3>Explore how observed links, candidate groups, and unknowns change with fixture size.</h3>
            <p>The browser generates fictional evidence and sends it to the same transient analysis API; no result metrics are hard-coded.</p>
          </div>
          <div className="fixture-controls">
            <label htmlFor="source-count">APPARENT EVIDENCE ITEMS <strong>{sourceCount}</strong></label>
            <input id="source-count" type="range" min="10" max="100" step="1" value={sourceCount} onChange={(event) => setSourceCount(Number(event.target.value))} />
            <div className="count-chips" aria-label="Choose example size">
              {[10, 25, 50, 100].map((count) => <button key={count} type="button" aria-pressed={sourceCount === count} className={sourceCount === count ? "selected" : ""} onClick={() => setSourceCount(count)}>{count}</button>)}
            </div>
            <button type="button" className="site-button site-button-primary" onClick={analyzeFixture} disabled={busy}>{busy ? "ANALYZING FIXTURE…" : "RUN SYNTHETIC ANALYSIS"}<span aria-hidden="true">↗</span></button>
          </div>
        </div>
      ) : (
        <form id="stemcheck-panel-paste" className="stemcheck-panel paste-panel" onSubmit={submitPaste} role="tabpanel" aria-labelledby="stemcheck-tab-paste" tabIndex={0}>
          <div className="paste-head">
            <div><span className="site-kicker">YOUR INPUT · TRANSIENT ANALYSIS</span><h3>Test a small evidence set.</h3></div>
            <button type="button" className="site-button site-button-quiet" onClick={loadExample}>LOAD FICTIONAL EXAMPLE</button>
          </div>
          <label className="stemcheck-field"><span>CLAIM <small>optional if an AI answer is supplied</small></span><input maxLength={4000} value={claim} onChange={(event) => setClaim(event.target.value)} placeholder="What claim should the evidence support?" /></label>
          <label className="stemcheck-field"><span>AI ANSWER <small>optional</small></span><textarea maxLength={20000} rows={3} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Paste the relevant answer, not an entire conversation." /></label>
          <label className="stemcheck-field"><span>CITATIONS / EVIDENCE <small>one source per line · max 100</small></span><textarea rows={7} value={evidenceText} onChange={(event) => setEvidenceText(event.target.value)} placeholder={'ID | title | URL | supports/contradicts/unknown | excerpt | upstream IDs\nsource-a | Original report | https://example.org/report | supports | Short excerpt |\ncopy-b | Syndicated copy | https://example.net/story | supports | Short excerpt | source-a'} /></label>
          <div className="stemcheck-form-actions">
            <p>Use only relationships you can attest to. Unknown lineage stays unknown; different URLs are not proof of independence.</p>
            <div><button type="button" className="site-button site-button-quiet" onClick={clear}>CLEAR</button><button type="submit" className="site-button site-button-primary" disabled={busy}>{busy ? "ANALYZING…" : "ANALYZE TRANSIENTLY"}<span aria-hidden="true">↗</span></button></div>
          </div>
        </form>
      )}

      <div className="privacy-note">
        <span className="privacy-lock" aria-hidden="true">◈</span>
        <p><strong>Request-scoped by default.</strong> Public Stemcheck does not write to Postgres or expose a saved-record URL. Inputs are processed by this service and returned to this browser session; application logs omit submitted text. Avoid regulated or highly sensitive material in this prototype. Only the authenticated owner can explicitly save a complete Reliance Record in the private workspace.</p>
      </div>

      {error && <p className="stemcheck-error" role="alert">{error}</p>}
      {report && (
        <section className="live-report" aria-live="polite" aria-label="Computed Stemcheck result">
          <div className="live-report-head"><div><span className="site-kicker">COMPUTED · CURRENT ENGINE · {report.engine_version}</span><h3>Reliance snapshot</h3></div><span className="result-pill">{report.standing}</span></div>
          {reportMode === "challenge" && <div className="challenge-reveal"><div><span>YOUR GUESS</span><strong>{reportedGuess ?? challengeGuess}</strong><small>reported as a human estimate</small></div><i aria-hidden="true">→</i><div><span>COMPUTED CANDIDATE FOUNT REFERENCES</span><strong>{report.fount_count.candidate_fount_references}</strong><small>locator/origin references, not proven independent sources</small></div></div>}
          <p className="report-claim"><span>CLAIM</span>{report.claim.text}</p>
          <section className="computed-standing" aria-label="Computed Standing summary">
            <div className="computed-standing-head"><span>STANDING · COMPUTED</span><strong>{report.standing}</strong></div>
            <div className="standing-metrics">
              <div><span>Evidence items</span><strong>{report.summary.evidence_appearances}</strong></div>
              <div><span>Candidate Fount References</span><strong>{report.fount_count.candidate_fount_references}</strong></div>
              <div><span>Unknown lineage</span><strong>{report.veiled.evidence_ids.length}</strong></div>
              <div><span>User-labeled conflicts</span><strong>{report.conflicts.length}</strong></div>
            </div>
            <p>Standing describes the evidence state and policy outcome. It is not a truth score or proof of independence. Charter outcome: <b>{report.policy_result.outcome}</b>.</p>
          </section>
          <div className="report-stats">
            <div><span>Candidate groups</span><strong>{report.summary.candidate_groups}</strong></div>
            <div><span>Observed / attested links</span><strong>{report.summary.observed_or_attested_links}</strong></div>
            <div><span>Possible links</span><strong>{report.summary.possible_links}</strong></div>
            <div><span>Unknown relationship pairs</span><strong>{report.summary.unknown_relationship_pairs}</strong></div>
            <div><span>Echo excess appearances</span><strong>{report.echo_mass.observed_or_attested_excess_appearances}</strong></div>
            <div><span>Independence assessment</span><strong>{report.summary.independence_assessment}</strong></div>
          </div>
          <div className="stemma-result">
            <div className="stemma-result-head"><div><span className="site-kicker">COMPUTED · STEMMA</span><h4>Relationships supported by this request</h4></div><span>{report.relationships.candidate_groups.length} candidate groups</span></div>
            <div className="stemma-group-grid">
              {report.relationships.candidate_groups.map((group, index) => <article className={`stemma-group ${group.members.length > 1 ? "connected" : "unresolved"}`} key={group.id}>
                <div><small>GROUP {String(index + 1).padStart(2, "0")}</small><b>{group.members.length} {group.members.length === 1 ? "item" : "items"}</b></div>
                <ul>{group.members.map((id) => <li key={id}><span>{evidenceName(id)}</span><small>{id}</small></li>)}</ul>
                <p>{group.members.length > 1 ? "Connected by observed or caller-attested links." : "No observed/attested link in this request; lineage remains unknown."}</p>
              </article>)}
            </div>
            <div className="stemma-edge-list">
              {report.relationships.edges.map((edge, index) => <div className="stemma-edge observed" key={`observed-${index}-${edge.from}-${edge.to}`}><span>{edge.certainty === "ATTESTED" ? "ATTESTED" : "OBSERVED"}</span><b>{evidenceName(edge.from)} → {evidenceName(edge.to)}</b><small>{edge.basis ?? edge.type}</small></div>)}
              {report.relationships.possible_links.map((edge, index) => <div className="stemma-edge possible" key={`possible-${index}-${edge.from}-${edge.to}`}><span>POSSIBLE</span><b>{evidenceName(edge.from)} ⇢ {evidenceName(edge.to)}</b><small>{edge.note ?? edge.basis ?? edge.type}</small></div>)}
              <div className="stemma-unknown-note"><b>{report.relationships.unknown_relationship_pairs.length} unknown relationship pairs</b><span>Unknown is not drawn or counted as dependence.</span></div>
            </div>
            <p className="stemma-disclaimer">{report.relationships.disclaimer} A Candidate Fount reference is not proof of an independent or authoritative source.</p>
          </div>
          <div className="report-caveat"><strong>Charter outcome: {report.policy_result.outcome}.</strong> {report.policy_result.reasons.join(" ")} {report.policy_result.interpretation}</div>
          <div className="report-footer"><span>REQUEST-SCOPED · NOT SAVED · {report.reliance_id}</span><Link href="/workspace/">Owner: open private workspace to explicitly save ↗</Link></div>
        </section>
      )}
    </div>
  );
}
