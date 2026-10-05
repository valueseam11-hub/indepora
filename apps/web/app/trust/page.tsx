import type { Metadata } from "next";
import { InfoPage, TrustContent } from "../components/info-pages";

export const metadata: Metadata = {
  title: "Trust & Privacy | Indepora",
  description: "Data handling and security boundaries for public transient Stemcheck and the private owner workspace.",
};

export default function TrustPage() {
  return <InfoPage active="Trust" kicker="EVIDENCE CAN BE SENSITIVE" title="Designed around explicit retention—not vague promises." description="Inspect what the application does, what it does not store by default, and which hosting and compliance limits remain outside the prototype."><TrustContent /></InfoPage>;
}
