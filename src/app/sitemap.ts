import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase-server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://petgo.jp";

const AREA_SLUGS = [
  "hokkaido",
  "tohoku",
  "kanto",
  "chubu",
  "kansai",
  "chugoku",
  "shikoku",
  "kyushu",
] as const;

const TYPE_SLUGS = ["hotel", "cafe", "restaurant", "park", "camp"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient();

  const { data: facilities } = await supabase
    .from("facilities")
    .select("id, updated_at");

  const facilityUrls: MetadataRoute.Sitemap = (facilities ?? []).map((f) => ({
    url: `${BASE_URL}/facility/${f.id}`,
    lastModified: f.updated_at ? new Date(f.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const areaUrls: MetadataRoute.Sitemap = AREA_SLUGS.flatMap((area) =>
    TYPE_SLUGS.map((type) => ({
      url: `${BASE_URL}/area/${area}/${type}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...facilityUrls,
    ...areaUrls,
  ];
}
