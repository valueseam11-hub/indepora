import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { label: "Product", href: "/product/" },
  { label: "Live Demo", href: "/#stemcheck" },
  { label: "Developers", href: "/developers/" },
  { label: "Plugins", href: "/product/#integrations" },
  { label: "Research", href: "/research/" },
  { label: "Design Partners", href: "/design-partners/" },
];

function BrandMark() {
  return (
    <svg className="site-brand-mark" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 5v11M20 16 9 23M20 16l11 7M9 23v10M31 23v10M20 16v17" />
      <circle cx="20" cy="5" r="2.5" />
      <circle cx="9" cy="23" r="2.5" />
      <circle cx="31" cy="23" r="2.5" />
      <circle cx="20" cy="33" r="2.5" />
    </svg>
  );
}

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="site-header">
      <Link className="site-brand" href="/" aria-label="Indepora home">
        <BrandMark />
        <span>INDEPORA<small>EVIDENCE ASSURANCE INFRASTRUCTURE</small></span>
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        {navigation.map((item) => (
          <Link key={item.label} href={item.href} className={active === item.label ? "is-active" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link className="site-header-cta" href="/#stemcheck">Analyze evidence <span aria-hidden="true">↗</span></Link>
      <details className="site-mobile-menu">
        <summary aria-label="Open navigation menu">Menu</summary>
        <nav aria-label="Mobile navigation">
          {navigation.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}
          <Link href="/#stemcheck">Analyze evidence</Link>
        </nav>
      </details>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <Link className="site-brand site-footer-brand" href="/">
          <BrandMark />
          <span>INDEPORA<small>AGENT COUNT IS NOT EVIDENCE COUNT.</small></span>
        </Link>
        <p>Trace the ancestry.<br />Keep uncertainty visible.<br />Set the reliance ceiling.</p>
        <div className="site-footer-flow" aria-label="Evidence flows to a versioned decision">
          <span>Evidence</span><i>→</i><span>Stemma</span><i>→</i><span>Standing</span><i>→</i><span>Decision</span>
        </div>
      </div>
      <div className="site-footer-links">
        <Link href="/product/">Product</Link>
        <Link href="/#stemcheck">Stemcheck</Link>
        <Link href="/developers/">Developers</Link>
        <Link href="/research/">Research</Link>
        <Link href="/design-partners/">Design partners</Link>
        <Link href="/trust/">Trust &amp; privacy</Link>
        <Link href="/workspace/">Owner workspace</Link>
        <a href="https://github.com/valueseam11-hub/indepora" target="_blank" rel="noreferrer">GitHub ↗</a>
      </div>
      <div className="site-footer-bottom">
        <span>© INDEPORA · PROTOTYPE, NOT A TRUTH OR INDEPENDENCE CERTIFIER</span>
        <span>LIVE ANALYSIS IS TRANSIENT · SAVE IS OWNER-ONLY</span>
      </div>
    </footer>
  );
}

export function SiteShell({ children, active }: { children: ReactNode; active?: string }) {
  return (
    <div className="public-site">
      <SiteHeader active={active} />
      {children}
      <SiteFooter />
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="site-eyebrow"><span aria-hidden="true">◆</span>{children}</div>;
}
