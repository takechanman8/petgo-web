import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { FacilityGrid } from "@/components/facility-grid";
import { PassBanner } from "@/components/pass-banner";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FacilityGrid />
        <PassBanner />
      </main>
      <Footer />
    </>
  );
}
