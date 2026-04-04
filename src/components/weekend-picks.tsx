"use client";

import { useWeekendPicks } from "@/hooks/useRecommendations";
import { CarouselSection } from "@/components/carousel-section";

export function WeekendPicks() {
  const { picks, loading } = useWeekendPicks();

  return (
    <CarouselSection
      title="今週末のおすすめ"
      subtitle="週末のおでかけにぴったりの施設をご紹介"
      facilities={picks}
      loading={loading}
      bgClass="bg-section-bg"
    />
  );
}
