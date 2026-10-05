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
};

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
  fount_count: { candidate_fount_references: number; evidence_without_resolved_fount_reference: number; interpretation: string };
  echo_mass: { observed_or_attested_excess_appearances: number; observed_or_attested_relationship_count: number; method: string };
  veiled: { state: string; evidence_ids: string[]; charter_action: string };
  conflicts: Array<Record<string, unknown>>;
  policy_result: { outcome: string; reasons: string[]; interpretation: string };
  standing: string;
  engine_version: string;
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

export function StemcheckWidget() {
  const [mode, setMode] = useState<"fixture" | "paste">("fixture");
  const [sourceCount, setSourceCount] = useState(10);
  const [claim, setClaim] = useState("");
  const [answer, setAnswer] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [report, setReport] = useState<StemcheckReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const analyze = async (payload: Payload) => {
    setBusy(true);
    setError("");
    setReport(null);
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const analyzeFixture = () => { void analyze(makeFixture(sourceCount)); };
  const loadExample = () => {
    setClaim(sampleClaim);
    setAnswer("The Northstar example has a fictional notice, a syndicated echo, a court reference, and a company response.");
    setEvidenceText(sampleEvidence);
    setReport(null);
    setError("");
  };
  const clear = () => {
    setClaim("");
    setAnswer("");
    setEvidenceText("");
    setReport(null);
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
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Check the evidence input and try again.");
    }
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = mode === "fixture" ? "paste" : "fixture";
    setMode(next);
    document.getElementById(`stemcheck-tab-${next}`)?.focus();
  };

  return (
    <div className="stemcheck-widget">
      <div className="stemcheck-tabs" role="tablist" aria-label="Stemcheck mode">
        <button id="stemcheck-tab-fixture" type="button" role="tab" aria-controls="stemcheck-panel-fixture" aria-selected={mode === "fixture"} tabIndex={mode === "fixture" ? 0 : -1} className={mode === "fixture" ? "selected" : ""} onKeyDown={onTabKeyDown} onClick={() => setMode("fixture")}>Synthetic evidence collapse</button>
        <button id="stemcheck-tab-paste" type="button" role="tab" aria-controls="stemcheck-panel-paste" aria-selected={mode === "paste"} tabIndex={mode === "paste" ? 0 : -1} className={mode === "paste" ? "selected" : ""} onKeyDown={onTabKeyDown} onClick={() => setMode("paste")}>Analyze pasted evidence</button>
      </div>

      {mode === "fixture" ? (
        <div id="stemcheck-panel-fixture" className="stemcheck-panel fixture-panel" role="tabpanel" aria-labelledby="stemcheck-tab-fixture" tabIndex={0}>
          <div className="fixture-copy">
            <span className="site-kicker">LIVE ENGINE · SYNTHETIC FIXTURE</span>
            <h3>Watch apparent sources resolve into observed, attested, and unknown relationships.</h3>
            <p>Choose a fixture size. The browser generates fictional evidence and sends it to the same transient analysis API; no example metrics are hard-coded.</p>
          </div>
          <div className="fixture-controls">
            <label htmlFor="source-count">APPARENT EVIDENCE ITEMS <strong>{sourceCount}</strong></label>
            <input id="source-count" type="range" min="10" max="100" step="1" value={sourceCount} onChange={(event) => setSourceCount(Number(event.target.value))} />
            <div className="count-chips" aria-label="Choose example size">
              {[10, 25, 50, 100].map((count) => (
                <button key={count} type="button" aria-pressed={sourceCount === count} className={sourceCount === count ? "selected" : ""} onClick={() => setSourceCount(count)}>{count}</button>
              ))}
            </div>
            <button type="button" className="site-button site-button-primary" onClick={analyzeFixture} disabled={busy}>
              {busy ? "ANALYZING FIXTURE…" : "RUN SYNTHETIC ANALYSIS"}<span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      ) : (
        <form id="stemcheck-panel-paste" className="stemcheck-panel paste-panel" onSubmit={submitPaste} role="tabpanel" aria-labelledby="stemcheck-tab-paste" tabIndex={0}>
          <div className="paste-head">
            <div><span className="site-kicker">YOUR INPUT · TRANSIENT ANALYSIS</span><h3>Don&apos;t believe us. Test an evidence set.</h3></div>
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
        <p><strong>Request-scoped by default.</strong> The public Stemcheck route does not write to Postgres or expose a saved-record URL. Inputs are processed by this service and returned in this browser session; application logs omit the submitted text. Avoid regulated or highly sensitive material in this prototype. Only the authenticated owner can save a complete Reliance Record in the private workspace.</p>
      </div>

      {error && <p className="stemcheck-error" role="alert">{error}</p>}
      {report && (
        <section className="live-report" aria-live="polite" aria-label="Stemcheck analysis result">
          <div className="live-report-head"><div><span className="site-kicker">REQUEST RESULT · {report.engine_version}</span><h3>Reliance snapshot</h3></div><span className="result-pill">{report.standing}</span></div>
          <p className="report-claim"><span>CLAIM</span>{report.claim.text}</p>
          <div className="report-stats">
            <div><span>Evidence appearances</span><strong>{report.summary.evidence_appearances}</strong></div>
            <div><span>Candidate groups</span><strong>{report.summary.candidate_groups}</strong></div>
            <div><span>Candidate Fount refs</span><strong>{report.fount_count.candidate_fount_references}</strong></div>
            <div><span>Echo excess appearances</span><strong>{report.echo_mass.observed_or_attested_excess_appearances}</strong></div>
            <div><span>Veiled evidence items</span><strong>{report.veiled.evidence_ids.length}</strong></div>
            <div><span>User-labeled conflicts</span><strong>{report.conflicts.length}</strong></div>
          </div>
          <div className="report-caveat"><strong>Independence: {report.summary.independence_assessment}.</strong> {report.fount_count.interpretation} {report.policy_result.interpretation}</div>
          <div className="report-footer"><span>Decision policy: {report.policy_result.outcome} · {report.policy_result.reasons.join(" ")}</span><Link href="/workspace/">Owner: open private workspace to explicitly save ↗</Link></div>
        </section>
      )}
    </div>
  );
}
