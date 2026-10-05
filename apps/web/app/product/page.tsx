import type { Metadata } from "next";
import { InfoPage, ProductContent } from "../components/info-pages";

export const metadata: Metadata = {
  title: "Product & Reliance Fabric | Indepora",
  description: "Explore Indepora's implemented evidence-lineage MVP, current Charter controls, and clearly marked roadmap.",
};

export default function ProductPage() {
  return <InfoPage active="Product" kicker="THE RELIANCE FABRIC" title="Evidence lineage before evidence reliance." description="A small, inspectable core now; adapters and automatic enforcement later. See exactly what is live and where the prototype stops."><ProductContent /></InfoPage>;
}
