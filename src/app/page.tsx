import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { RecommendationSection } from "@/components/recommendation-section";
import { FacilityGrid } from "@/components/facility-grid";
import { SpringPicks } from "@/components/spring-picks";
import { BeginnerPicks } from "@/components/beginner-picks";
import { DogRunPicks } from "@/components/dogrun-picks";
import { SnsPicks } from "@/components/sns-picks";
import { SmallDogPicks, MediumDogPicks, LargeDogPicks } from "@/components/dog-size-picks";
import { WeekendPicks } from "@/components/weekend-picks";
import { PassBanner } from "@/components/pass-banner";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <RecommendationSection />
        <FacilityGrid />
        <SpringPicks />
        <WeekendPicks />
        <BeginnerPicks />
        <DogRunPicks />
        <SnsPicks />
        <SmallDogPicks />
        <MediumDogPicks />
        <LargeDogPicks />
        <PassBanner />
      </main>
      <Footer />
    </>
  );
}
