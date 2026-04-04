"use client";

import { useSnsFacilities } from "@/hooks/useFeatureSections";
import { CarouselSection } from "@/components/carousel-section";

export function SnsPicks() {
  const { facilities, loading } = useSnsFacilities();

  return (
    <CarouselSection
      title="今話題！SNSで人気のスポット"
      subtitle="ペットオーナーに話題の映えスポット"
      facilities={facilities}
      loading={loading}
    />
  );
}
