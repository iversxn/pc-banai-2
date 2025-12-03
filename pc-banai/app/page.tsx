import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { BuildShowcase } from "@/components/build-showcase"
import { PriceComparison } from "@/components/price-comparison"
import { CommunitySection } from "@/components/community-section"
import FunctionalBuildConfigurator from "@/components/functional-build-configurator" // ← default import

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <section id="build-configurator" className="py-20">
        <FunctionalBuildConfigurator />
      </section>
      <BuildShowcase />
      <PriceComparison />
      <CommunitySection />
    </div>
  )
}
