"use client";

import { useFacilities } from "@/hooks/useFacilities";
import { CarouselSection } from "@/components/carousel-section";

export function FacilityGrid() {
  const { facilities, loading } = useFacilities();

  return (
    <CarouselSection
      title="人気の施設"
      subtitle="ペットオーナーに選ばれている施設をチェック"
      facilities={facilities.slice(0, 10)}
      loading={loading}
      showRank={true}
      bgClass="bg-section-bg"
    />
  );
}
