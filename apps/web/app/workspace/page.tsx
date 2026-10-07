"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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
  engine_version?: string;
  analysis_timestamp?: string;
  standing?: string;
};

type SavedItem = {
  record_id: string;
  reliance_id: string;
  analysis_timestamp: string;
  engine_version: string;
  standing: string;
  claim: string;
};

type SavedRecord = {
  record_id: string;
  submitted_input: { claim?: string; answer?: string; evidence?: Evidence[] };
  analysis: Report;
};

type AuthView = "loading" | "setup" | "login" | "authenticated" | "unavailable";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");
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

function errorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

async function requestJson<T>(path: string, init: RequestInit = {}, csrf?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (csrf) headers.set("X-CSRF-Token", csrf);
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(payload, `Request failed (${response.status}).`));
  return payload as T;
}

function formatEvidence(items: Evidence[] = []): string {
  return items.map((item) => [
    item.id,
    item.title,
    item.url ?? "",
    item.stance ?? "unknown",
    item.text ?? "",
    item.derived_from?.join(",") ?? "",
  ].join(" | ")).join("\n");
}

export default function Home() {
  const [authView, setAuthView] = useState<AuthView>("loading");
  const [csrfToken, setCsrfToken] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupPasswordAgain, setSetupPasswordAgain] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordAgain, setNewPasswordAgain] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [claim, setClaim] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [activeRecordId, setActiveRecordId] = useState("");
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [recordsBusy, setRecordsBusy] = useState(false);

  const overview = useMemo(() => report?.summary ?? null, [report]);

  const loadRecords = useCallback(async () => {
    setRecordsBusy(true);
    try {
      const payload = await requestJson<{ items: SavedItem[] }>("/v1/records?limit=50&offset=0");
      setSavedItems(payload.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Saved records could not be loaded.");
    } finally {
      setRecordsBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const csrf = await requestJson<{ csrf_token: string }>("/v1/auth/csrf");
        if (active) setCsrfToken(csrf.csrf_token);
        const status = await requestJson<{ owner_setup_required: boolean }>("/v1/auth/bootstrap/status");
        if (!active) return;
        if (status.owner_setup_required) {
          setAuthView("setup");
          return;
        }
        let me: { email: string };
        try {
          me = await requestJson<{ email: string }>("/v1/auth/me");
        } catch {
          if (active) setAuthView("login");
          return;
        }
        if (active) {
          setOwnerEmail(me.email);
          setAuthView("authenticated");
        }
        try {
          const records = await requestJson<{ items: SavedItem[] }>("/v1/records?limit=50&offset=0");
          if (active) setSavedItems(records.items);
        } catch (caught) {
          if (active) setError(caught instanceof Error ? caught.message : "Saved records could not be loaded.");
        }
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Private storage is not ready.");
          setAuthView("unavailable");
        }
      }
    };
    void initialize();
    return () => { active = false; };
  }, []);

  const loadExample = () => {
    setClaim(exampleClaim);
    setAnswer(exampleAnswer);
    setSources(exampleSources);
    setReport(null);
    setActiveRecordId("");
    setError("");
    setNotice("");
  };

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (setupPassword !== setupPasswordAgain) throw new Error("The passwords do not match.");
      const payload = await requestJson<{ email: string; csrf_token: string }>("/v1/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({ bootstrap_secret: bootstrapSecret, email: setupEmail, password: setupPassword }),
      }, csrfToken);
      setOwnerEmail(payload.email);
      setCsrfToken(payload.csrf_token);
      setBootstrapSecret("");
      setSetupPassword("");
      setSetupPasswordAgain("");
      setAuthView("authenticated");
      await loadRecords();
      setNotice("Private owner account created. Save your password securely; public sign-up is disabled.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Owner setup failed.");
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = await requestJson<{ email: string; csrf_token: string }>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      }, csrfToken);
      setOwnerEmail(payload.email);
      setCsrfToken(payload.csrf_token);
      setLoginPassword("");
      setAuthView("authenticated");
      await loadRecords();
      setNotice("Signed in to the private owner workspace.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    setError("");
    try {
      await requestJson<void>("/v1/auth/logout", { method: "POST" }, csrfToken);
      const csrf = await requestJson<{ csrf_token: string }>("/v1/auth/csrf");
      setCsrfToken(csrf.csrf_token);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-out failed.");
    } finally {
      setOwnerEmail("");
      setLoginPassword("");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordAgain("");
      setClaim("");
      setAnswer("");
      setSources("");
      setReport(null);
      setActiveRecordId("");
      setSavedItems([]);
      setAuthView("login");
      setBusy(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (newPassword !== newPasswordAgain) throw new Error("The new passwords do not match.");
      const payload = await requestJson<{ csrf_token: string }>("/v1/auth/password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      }, csrfToken);
      setCsrfToken(payload.csrf_token);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordAgain("");
      setShowPasswordPanel(false);
      setNotice("Password updated; previous sessions were revoked.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Password update failed.");
    } finally {
      setBusy(false);
    }
  };

  const analyze = async () => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const evidence = parseEvidence(sources);
      const payload = await requestJson<Report>("/v1/reliance/inspect", {
        method: "POST",
        body: JSON.stringify({ claim, answer, evidence }),
      });
      setReport(payload);
      setActiveRecordId("");
      setNotice("Analysis complete. Nothing was saved; use Save Reliance Record if you want to persist it.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to analyze this evidence set.");
      setReport(null);
    } finally {
      setBusy(false);
    }
  };

  const saveRecord = async () => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const evidence = parseEvidence(sources);
      const payload = await requestJson<SavedRecord>("/v1/records", {
        method: "POST",
        body: JSON.stringify({ claim, answer, evidence }),
      }, csrfToken);
      setReport(payload.analysis);
      setActiveRecordId(payload.record_id);
      await loadRecords();
      setNotice("Reliance Record saved privately to your Postgres workspace.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Record was not saved.");
    } finally {
      setBusy(false);
    }
  };

  const openRecord = async (recordId: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = await requestJson<SavedRecord>(`/v1/records/${encodeURIComponent(recordId)}`);
      setReport(payload.analysis);
      setActiveRecordId(payload.record_id);
      setClaim(payload.submitted_input.claim ?? "");
      setAnswer(payload.submitted_input.answer ?? "");
      setSources(formatEvidence(payload.submitted_input.evidence ?? []));
      setNotice("Loaded the stored snapshot; historical Standing was not recalculated.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Saved record could not be opened.");
    } finally {
      setBusy(false);
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!window.confirm("Permanently delete this saved Reliance Record? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      await requestJson<void>(`/v1/records/${encodeURIComponent(recordId)}`, { method: "DELETE" }, csrfToken);
      if (activeRecordId === recordId) {
        setActiveRecordId("");
        setReport(null);
      }
      await loadRecords();
      setNotice("Saved record deleted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Record could not be deleted.");
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

  if (authView === "loading") return <main className="auth-shell"><div className="auth-card"><Brand /><p className="micro-label">CHECKING PRIVATE WORKSPACE…</p></div></main>;

  if (authView === "unavailable") return <main className="auth-shell"><div className="auth-card"><Brand /><div className="eyebrow">PRIVATE STORAGE UNAVAILABLE</div><h1>Workspace is not ready.</h1><p className="auth-copy">The service could not reach its configured private database. No evidence has been saved. The operator must verify the existing Railway Postgres connection.</p>{error && <div className="error-banner" role="alert">{error}</div>}<a className="docs-link" href="/healthz">Check service health ↗</a></div></main>;

  if (authView === "setup" || authView === "login") return (
    <main className="auth-shell">
      <section className="auth-card">
        <Brand />
        <div className="eyebrow"><span>PRIVATE / SINGLE-OWNER</span></div>
        <h1>{authView === "setup" ? "Activate the owner workspace." : "Sign in to Indepora."}</h1>
        <p className="auth-copy">{authView === "setup" ? "One-time first-owner setup. There is no public sign-up; this form closes after the owner is created." : "Private evidence assurance console. Only the configured owner can access saved Reliance Records."}</p>
        <form className="auth-form" onSubmit={authView === "setup" ? authenticate : signIn}>
          {authView === "setup" && <label className="field"><span>ONE-TIME OWNER SETUP CODE</span><input required type="password" autoComplete="off" value={bootstrapSecret} onChange={(event) => setBootstrapSecret(event.target.value)} /></label>}
          <label className="field"><span>OWNER EMAIL</span><input required type="email" autoComplete="username" value={authView === "setup" ? setupEmail : loginEmail} onChange={(event) => authView === "setup" ? setSetupEmail(event.target.value) : setLoginEmail(event.target.value)} /></label>
          <label className="field"><span>{authView === "setup" ? "OWNER PASSWORD (14+ CHARACTERS)" : "PASSWORD"}</span><input required type="password" minLength={authView === "setup" ? 14 : undefined} autoComplete={authView === "setup" ? "new-password" : "current-password"} value={authView === "setup" ? setupPassword : loginPassword} onChange={(event) => authView === "setup" ? setSetupPassword(event.target.value) : setLoginPassword(event.target.value)} /></label>
          {authView === "setup" && <label className="field"><span>CONFIRM OWNER PASSWORD</span><input required type="password" minLength={14} autoComplete="new-password" value={setupPasswordAgain} onChange={(event) => setSetupPasswordAgain(event.target.value)} /></label>}
          <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "VERIFYING…" : authView === "setup" ? "CREATE PRIVATE OWNER" : "SIGN IN"}<span>↗</span></button>
        </form>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <div className="auth-security-note">Passwords are stored as Argon2 hashes. Sessions use HttpOnly, Secure, SameSite cookies. Evidence is not stored unless the owner explicitly saves it.</div>
      </section>
    </main>
  );

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Indepora home"><span className="brand-mark">I</span><span>INDEPORA <small>RELIANCE FABRIC / 0.2</small></span></a>
        <div className="top-status"><span className="live-dot" /> PRIVATE OWNER SESSION <span className="divider">/</span> NO EXTERNAL MODEL</div>
        <div className="account-controls"><span className="owner-label">{ownerEmail}</span><button className="text-button" onClick={() => setShowPasswordPanel(!showPasswordPanel)}>PASSWORD</button><button className="text-button" onClick={signOut} disabled={busy}>SIGN OUT</button><a className="docs-link" href="/docs" target="_blank" rel="noreferrer">API DOCS ↗</a></div>
      </header>

      {showPasswordPanel && <section className="password-panel"><div><div className="eyebrow">ACCOUNT SECURITY</div><h2>Change owner password</h2></div><form className="password-form" onSubmit={changePassword}><input aria-label="Current password" type="password" autoComplete="current-password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /><input aria-label="New password" type="password" autoComplete="new-password" placeholder="New password (14+ characters)" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={14} /><input aria-label="Confirm new password" type="password" autoComplete="new-password" placeholder="Confirm new password" value={newPasswordAgain} onChange={(event) => setNewPasswordAgain(event.target.value)} required minLength={14} /><button className="ghost-button" type="submit" disabled={busy}>UPDATE PASSWORD</button></form></section>}

      {notice && <div className="notice-banner" role="status">{notice}</div>}
      {error && <div className="error-banner app-error" role="alert">{error}</div>}

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>01</span> EVIDENCE RELIANCE CONSOLE</div>
          <h1>One answer.<br /><em>Many appearances.</em><br />What do they depend on?</h1>
          <p>Map the evidence behind an AI claim. See repeated material, supplied derivations, unresolved lineage, and conflicts—without pretending that different sources prove independence.</p>
          <div className="hero-tags"><span>CLAIM FORGE</span><span>ORIGIN MESH</span><span>SEPARATION ENGINE</span></div>
        </div>
        <div className="hero-graphic" aria-label="Evidence paths converge on a claim">
          <div className="diagram-title">RELIANCE MAP <span>ENGINE V0.2</span></div>
          <div className="flow-row"><i className="node node-blue" /><span>origin / document</span><b>─────────╲</b><strong>CLAIM</strong></div>
          <div className="flow-row"><i className="node node-amber" /><span>derived copy</span><b>──────╲　 ╲</b><strong className="claim-node">C-01</strong></div>
          <div className="flow-row"><i className="node node-blue" /><span>separate locator</span><b>────────╱</b><strong>UNKNOWN</strong></div>
          <div className="flow-row"><i className="node node-red" /><span>contradiction</span><b>──────╱</b><strong className="conflict-node">CONFLICT</strong></div>
          <div className="diagram-foot"><span>OBSERVED</span><span>ATTESTED</span><span>VEILED</span></div>
        </div>
      </section>

      <section className="workspace">
        <div className="section-heading"><div><div className="eyebrow"><span>02</span> RELIANCE INGRESS</div><h2>Inspect an evidence set</h2></div><button className="ghost-button" onClick={loadExample}>LOAD EXAMPLE ↗</button></div>
        <div className="privacy-callout"><strong>Transient until you save.</strong> Analyze requests are not persisted. Only <em>Save Reliance Record</em> writes the complete submitted evidence and analysis snapshot to your private Postgres workspace.</div>
        <div className="input-grid">
          <label className="field field-claim"><span>CLAIM UNDER REVIEW <small>Explicit claim preferred</small></span><input value={claim} onChange={(event) => setClaim(event.target.value)} placeholder="e.g. The regulator issued a $12M fine." /></label>
          <label className="field"><span>AI ANSWER <small>Context only</small></span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Paste the relevant AI answer…" rows={4} /></label>
          <label className="field field-sources"><span>EVIDENCE / CITATIONS <small>One item per line</small></span><textarea value={sources} onChange={(event) => setSources(event.target.value)} placeholder={'ID | title | URL | supports/contradicts/unknown | excerpt | derived-from ID\nsource-1 | Report | https://example.com/report | supports | excerpt |'} rows={8} /></label>
        </div>
        <div className="form-footer"><p><strong>Format:</strong> ID | title | URL | stance | optional excerpt | optional upstream ID. Leave stance as <code>unknown</code> if unreviewed.</p><div className="action-buttons"><button className="primary-button" onClick={analyze} disabled={busy}>{busy ? "MAPPING EVIDENCE…" : "BUILD RELIANCE MAP"}<span>↗</span></button>{report && <button className="save-button" onClick={saveRecord} disabled={busy}>{busy ? "SAVING…" : activeRecordId ? "SAVE AS NEW RECORD" : "SAVE RELIANCE RECORD"}</button>}</div></div>
      </section>

      <section className="saved-section">
        <div className="section-heading"><div><div className="eyebrow"><span>03</span> PRIVATE POSTGRES WORKSPACE</div><h2>Saved Reliance Records</h2></div><button className="ghost-button" onClick={() => void loadRecords()} disabled={recordsBusy}>{recordsBusy ? "LOADING…" : "REFRESH ↻"}</button></div>
        {savedItems.length === 0 ? <p className="empty-records">{recordsBusy ? "Loading saved records…" : "No saved records. Analysis remains transient until you explicitly save."}</p> : <div className="saved-list">{savedItems.map((item) => <article className="saved-item" key={item.record_id}><button className="saved-open" onClick={() => void openRecord(item.record_id)} disabled={busy}><strong>{item.claim || "Untitled claim"}</strong><span>{item.record_id} · {item.engine_version} · {item.standing}</span><small>{new Date(item.analysis_timestamp).toLocaleString()}</small></button><button className="delete-button" aria-label={`Delete ${item.record_id}`} onClick={() => void deleteRecord(item.record_id)} disabled={busy}>DELETE</button></article>)}</div>}
      </section>

      {report && overview && <section className="results" aria-live="polite">
        <div className="section-heading result-heading"><div><div className="eyebrow"><span>04</span> RELIANCE WITNESS <span className="record-id">{report.reliance_id}{activeRecordId ? ` · ${activeRecordId}` : " · TRANSIENT"}</span></div><h2>Evidence relationship report</h2></div><button className="ghost-button" onClick={saveWitness}>EXPORT WITNESS JSON ↓</button></div>
        <div className="claim-banner"><span>CLAIM</span><strong>{report.claim.text}</strong><small>IDENTITY {report.claim.id} · {report.claim.extraction_method.replaceAll("_", " ")}</small></div>
        <div className="metric-grid">
          <Metric label="Appearances" value={overview.evidence_appearances} note="submitted items" />
          <Metric label="Documents" value={overview.normalized_documents} note="normalized locators" />
          <Metric label="Candidate groups" value={overview.candidate_groups} note="not independence units" />
          <Metric label="Veiled pairs" value={overview.unknown_relationship_pairs} note="lineage unresolved" tone="amber" />
        </div>
        <div className="metric-grid metric-grid-secondary">
          <Metric label="Candidate Fount References" value={Number((report as Report & { fount_count?: { candidate_fount_references?: number } }).fount_count?.candidate_fount_references ?? 0)} note="not an independence count" />
          <Metric label="Echo Mass" value={Number((report as Report & { echo_mass?: { observed_or_attested_excess_appearances?: number } }).echo_mass?.observed_or_attested_excess_appearances ?? 0)} note="observed / attested excess only" tone="amber" />
          <Metric label="Standing" value={String(report.standing ?? report.policy_result.outcome)} note="Charter workflow outcome" />
          <Metric label="Engine" value={String(report.engine_version ?? "—")} note="snapshot version" />
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
            <div className="graph-disclaimer">Different URLs and separate candidate groups are <b>not proof of independence.</b> Veiled relations remain unknown.</div>
          </div>
          <div className="side-column">
            <div className="panel"><div className="panel-head"><div><span className="panel-index">B</span><h3>Relationship signals</h3></div></div>
              <Signal label="Observed / attested" value={Number(overview.observed_or_attested_links)} tone="blue" />
              <Signal label="Possible same-URL links" value={Number(overview.possible_links)} tone="amber" />
              <Signal label="Veiled / unresolved pairs" value={Number(overview.unknown_relationship_pairs)} tone="muted" />
              <div className="assessment-chip"><span>INDEPENDENCE</span><strong>NOT ESTABLISHED</strong></div>
            </div>
            <div className="panel"><div className="panel-head"><div><span className="panel-index">C</span><h3>Decision boundary</h3></div></div><div className="gate-state">{String(report.policy_result.outcome).replaceAll("_", " ")}</div><p className="gate-copy">{report.policy_result.reasons.join(" ")}</p><div className="subsystem-list"><span>FRESHNESS <b>{report.freshness.state.replaceAll("_", " ")}</b></span><span>AUTHORITY <b>{report.authority.state}</b></span><span>CONFLICTS <b>{report.conflicts.length} labeled</b></span><span>STANDING <b>{String(report.standing ?? "NOT_CONFIGURED")}</b></span></div></div>
          </div>
        </div>
        <div className="caution-strip"><span>!</span><p><b>Interpretation boundary.</b> This engine analyzes supplied metadata and user labels. It does not verify claim truth, rank source authority, or infer independence from separate URLs. Historical saved Standings are returned as stored snapshots, not recalculated.</p></div>
      </section>}

      <footer className="footer"><span>INDEPORA / RELIANCE FABRIC</span><span>V0.2 · PRIVATE OWNER WORKSPACE</span><span>NO AUTOMATIC SAVES</span></footer>
    </main>
  );
}

function Brand() {
  return <a className="brand auth-brand" href="#top" aria-label="Indepora home"><span className="brand-mark">I</span><span>INDEPORA <small>RELIANCE FABRIC / 0.2</small></span></a>;
}

function Metric({ label, value, note, tone = "blue" }: { label: string; value: string | number; note: string; tone?: string }) {
  return <div className={`metric-card metric-${tone}`}><span>{label}</span><strong>{String(value)}</strong><small>{note}</small></div>;
}

function Signal({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="signal-row"><span className={`signal-dot ${tone}`} /><span>{label}</span><strong>{value}</strong></div>;
}
