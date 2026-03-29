import type { Facility } from "@/types/facility";

const sizeMap: Record<string, string> = {
  small: "小型犬",
  medium: "中型犬",
  large: "大型犬",
};

/**
 * Supabase の facilities 行 + reviews を Facility 型に変換する
 */
export function mapDbRowToFacility(
  row: Record<string, unknown>,
  reviews?: { rating: number }[],
): Facility {
  const acceptedSizes = (row.accepted_dog_sizes as string[]) ?? [];
  const catOk = row.cat_ok as boolean;

  const ratings = reviews ?? [];
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
      : 0;

  return {
    id: row.id as string,
    name: row.name as string,
    area: `${row.prefecture}・${row.area}`,
    rating: avgRating,
    reviews: ratings.length,
    petScore: row.pet_friendly_score as number,
    sizes: catOk && acceptedSizes.length === 0
      ? ["猫"]
      : acceptedSizes.map((s) => sizeMap[s] ?? s),
    price: row.price_range as number,
    type: row.type as string,
    image: row.photo_url as string,
  };
}
