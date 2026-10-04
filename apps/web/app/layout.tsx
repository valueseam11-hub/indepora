import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indepora — Evidence Reliance Console",
  description: "Inspect evidence lineage and possible dependence behind AI-generated claims.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
