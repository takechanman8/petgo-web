"use client";

import { useDogRunFacilities } from "@/hooks/useFeatureSections";
import { CarouselSection } from "@/components/carousel-section";

export function DogRunPicks() {
  const { facilities, loading } = useDogRunFacilities();

  return (
    <CarouselSection
      title="ドッグラン付きの施設"
      subtitle="愛犬が思いっきり走り回れる施設を厳選"
      facilities={facilities}
      loading={loading}
    />
  );
}
