"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { mapDbRowToFacility } from "@/lib/mapFacility";
import type { Facility } from "@/types/facility";

const fallbackFacilities: Facility[] = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    name: "箱根ペットリゾート 森の宿",
    area: "神奈川県・箱根",
    rating: 4.8,
    reviews: 342,
    petScore: 95,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 18500,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    name: "Dog Cafe WOOF",
    area: "東京都・渋谷",
    rating: 4.6,
    reviews: 128,
    petScore: 90,
    sizes: ["小型犬", "中型犬"],
    price: 1200,
    type: "カフェ",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
  },
  {
    id: "a3333333-3333-3333-3333-333333333333",
    name: "淡路島わんわんヴィラ",
    area: "兵庫県・淡路島",
    rating: 4.9,
    reviews: 256,
    petScore: 98,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 22000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop",
  },
  {
    id: "a4444444-4444-4444-4444-444444444444",
    name: "湘南ドッグパーク",
    area: "神奈川県・茅ヶ崎",
    rating: 4.5,
    reviews: 89,
    petScore: 88,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 800,
    type: "ドッグラン",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
  },
  {
    id: "a5555555-5555-5555-5555-555555555555",
    name: "猫と泊まれる古民家 にゃんこ庵",
    area: "京都府・嵐山",
    rating: 4.7,
    reviews: 167,
    petScore: 92,
    sizes: ["猫"],
    price: 15000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop",
  },
  {
    id: "a6666666-6666-6666-6666-666666666666",
    name: "軽井沢ペットフレンドリーロッジ",
    area: "長野県・軽井沢",
    rating: 4.8,
    reviews: 203,
    petScore: 96,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 25000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop",
  },
  {
    id: "a7777777-7777-7777-7777-777777777777",
    name: "ペット同伴OK イタリアン BONO",
    area: "大阪府・梅田",
    rating: 4.4,
    reviews: 75,
    petScore: 85,
    sizes: ["小型犬"],
    price: 3500,
    type: "レストラン",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
  },
  {
    id: "a8888888-8888-8888-8888-888888888888",
    name: "伊豆高原 わんこの湯宿",
    area: "静岡県・伊豆高原",
    rating: 4.9,
    reviews: 412,
    petScore: 99,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 20000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop",
  },
];

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>(fallbackFacilities);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchFacilities() {
      try {
        const { data, error } = await supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .order("pet_friendly_score", { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setFacilities(
            data.map((row: Record<string, unknown>) =>
              mapDbRowToFacility(
                row,
                (row as Record<string, unknown>).reviews as { rating: number }[],
              ),
            ),
          );
        }
      } catch (e) {
        console.log("[useFacilities] Supabase fetch failed, using fallback:", e);
        setError(e instanceof Error ? e.message : "データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }

    fetchFacilities();
  }, []);

  return { facilities, loading, error };
}
