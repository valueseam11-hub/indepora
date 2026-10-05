import type { Metadata } from "next";
import { InfoPage, ResearchContent } from "../components/info-pages";

export const metadata: Metadata = {
  title: "Indepora Lab & Echo Trials | Research",
  description: "Research questions and planned Echo Trials for evidence dependence, lineage, and unknown relationships.",
};

export default function ResearchPage() {
  return <InfoPage active="Research" kicker="INDEPORA LAB" title="Measure the systems. Don't publish a victory lap." description="Evidence independence needs reviewed labels, explicit uncertainty, and reproducible methods before anyone claims detection quality."><ResearchContent /></InfoPage>;
}
