import type { Metadata } from "next";
import { DevelopersContent, InfoPage } from "../components/info-pages";

export const metadata: Metadata = {
  title: "Developers | Indepora",
  description: "Use Indepora's request-scoped Stemcheck API and inspect the current integration boundary.",
};

export default function DevelopersPage() {
  return <InfoPage active="Developers" kicker="BUILD EVIDENCE-AWARE AI" title="Start with the relationship contract." description="Try the public transient endpoint, inspect the OpenAPI contract, and keep caller-attested links separate from inference."><DevelopersContent /></InfoPage>;
}
