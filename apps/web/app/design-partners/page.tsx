import type { Metadata } from "next";
import { DesignPartnersContent, InfoPage } from "../components/info-pages";

export const metadata: Metadata = {
  title: "Design Partners | Indepora",
  description: "A cautious design-partner protocol for testing evidence reliance with synthetic or redacted examples.",
};

export default function DesignPartnersPage() {
  return <InfoPage active="Design Partners" kicker="HELP DEFINE THE LAYER" title="Start with the workflow. Keep sensitive evidence out of the prototype." description="Indepora is looking for grounded feedback on evidence lineage and decision reliance. The current deployment is not a secure partner upload portal."><DesignPartnersContent /></InfoPage>;
}
