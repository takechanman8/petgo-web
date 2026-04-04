"use client";

import { useSpringPicks } from "@/hooks/useFeatureSections";
import { CarouselSection } from "@/components/carousel-section";

export function SpringPicks() {
  const { facilities, loading } = useSpringPicks();

  return (
    <CarouselSection
      title="🌸 春のおでかけ特集"
      subtitle="桜やガーデンをペットと一緒に楽しもう"
      facilities={facilities}
      loading={loading}
    />
  );
}
