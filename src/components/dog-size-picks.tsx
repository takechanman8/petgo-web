"use client";

import { useDogSizeFacilities } from "@/hooks/useFeatureSections";
import { CarouselSection } from "@/components/carousel-section";

export function SmallDogPicks() {
  const { facilities, loading } = useDogSizeFacilities("small");

  return (
    <CarouselSection
      title="小型犬オーナーに人気の施設"
      subtitle="小型犬と快適に過ごせる施設をピックアップ"
      facilities={facilities}
      loading={loading}
    />
  );
}

export function MediumDogPicks() {
  const { facilities, loading } = useDogSizeFacilities("medium");

  return (
    <CarouselSection
      title="中型犬オーナーに人気の施設"
      subtitle="中型犬も安心して楽しめる施設を厳選"
      facilities={facilities}
      loading={loading}
    />
  );
}

export function LargeDogPicks() {
  const { facilities, loading } = useDogSizeFacilities("large");

  return (
    <CarouselSection
      title="大型犬オーナーに人気の施設"
      subtitle="大型犬でものびのびできる施設をご紹介"
      facilities={facilities}
      loading={loading}
    />
  );
}
