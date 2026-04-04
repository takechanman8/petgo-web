"use client";

import { useBeginnerPicks } from "@/hooks/useFeatureSections";
import { CarouselSection } from "@/components/carousel-section";

export function BeginnerPicks() {
  const { facilities, loading } = useBeginnerPicks();

  return (
    <CarouselSection
      title="初めてのペット旅行におすすめ"
      subtitle="ペット旅行デビューにぴったりの安心施設"
      facilities={facilities}
      loading={loading}
    />
  );
}
