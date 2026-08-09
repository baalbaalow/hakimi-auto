import { Features } from "@/components/marketing/Features";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Hero } from "@/components/marketing/Hero";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { Workflow } from "@/components/marketing/Workflow";

export default function Home() {
  return (
    <>
      <Hero />
      <ProductPreview />
      <Features />
      <Workflow />
      <FinalCTA />
    </>
  );
}
