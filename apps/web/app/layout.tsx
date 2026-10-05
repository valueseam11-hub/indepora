import type { Metadata } from "next";
import "./globals.css";
import "./public-site.css";

const siteTitle = "Indepora — Evidence Assurance Infrastructure for AI";
const siteDescription = "Trace evidence lineage, keep unknowns visible, and set a reliance ceiling before AI decisions.";

export const metadata: Metadata = {
  metadataBase: new URL("https://indepora-production.up.railway.app"),
  title: siteTitle,
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    url: "/",
    siteName: "Indepora",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
