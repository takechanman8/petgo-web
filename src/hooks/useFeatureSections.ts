"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { mapDbRowToFacility } from "@/lib/mapFacility";
import type { Facility } from "@/types/facility";

const fallbackSpring: Facility[] = [
  {
    id: "s1111111-1111-1111-1111-111111111111",
    name: "桜テラス ペットガーデン",
    area: "東京都・目黒",
    rating: 4.6,
    reviews: 98,
    petScore: 90,
    sizes: ["小型犬", "中型犬"],
    price: 1800,
    type: "カフェ",
    image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=300&fit=crop",
  },
  {
    id: "s2222222-2222-2222-2222-222222222222",
    name: "花見の里 ペットリゾート",
    area: "千葉県・館山",
    rating: 4.7,
    reviews: 156,
    petScore: 93,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 16000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1462275646964-a0e3c11f18a6?w=400&h=300&fit=crop",
  },
  {
    id: "s3333333-3333-3333-3333-333333333333",
    name: "ガーデンカフェ ペタル",
    area: "神奈川県・鎌倉",
    rating: 4.5,
    reviews: 72,
    petScore: 88,
    sizes: ["小型犬", "中型犬"],
    price: 1500,
    type: "カフェ",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop",
  },
  {
    id: "s4444444-4444-4444-4444-444444444444",
    name: "春風パーク ドッグラン",
    area: "埼玉県・秩父",
    rating: 4.4,
    reviews: 64,
    petScore: 86,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 600,
    type: "ドッグラン",
    image: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=300&fit=crop",
  },
  {
    id: "s5555555-5555-5555-5555-555555555555",
    name: "お花見レストラン SAKURA",
    area: "東京都・上野",
    rating: 4.3,
    reviews: 45,
    petScore: 84,
    sizes: ["小型犬"],
    price: 2800,
    type: "レストラン",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
  },
  {
    id: "s6666666-6666-6666-6666-666666666666",
    name: "ペットと楽しむ春の庭園",
    area: "京都府・嵐山",
    rating: 4.8,
    reviews: 189,
    petScore: 95,
    sizes: ["小型犬", "中型犬"],
    price: 12000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop",
  },
];

const fallbackBeginner: Facility[] = [
  {
    id: "b1111111-1111-1111-1111-111111111111",
    name: "はじめてのペット旅館 安心庵",
    area: "静岡県・熱海",
    rating: 4.9,
    reviews: 320,
    petScore: 98,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 19000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    name: "ペットデビュー応援カフェ",
    area: "東京都・吉祥寺",
    rating: 4.7,
    reviews: 245,
    petScore: 94,
    sizes: ["小型犬", "中型犬"],
    price: 1400,
    type: "カフェ",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
  },
  {
    id: "b3333333-3333-3333-3333-333333333333",
    name: "わんことお泊りデビュー宿",
    area: "神奈川県・箱根",
    rating: 4.8,
    reviews: 278,
    petScore: 96,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 21000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop",
  },
  {
    id: "b4444444-4444-4444-4444-444444444444",
    name: "ペット初心者歓迎レストラン",
    area: "大阪府・心斎橋",
    rating: 4.6,
    reviews: 198,
    petScore: 92,
    sizes: ["小型犬"],
    price: 3200,
    type: "レストラン",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
  },
  {
    id: "b5555555-5555-5555-5555-555555555555",
    name: "安心ドッグラン ビギナーズ",
    area: "千葉県・木更津",
    rating: 4.5,
    reviews: 167,
    petScore: 90,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 700,
    type: "ドッグラン",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
  },
  {
    id: "b6666666-6666-6666-6666-666666666666",
    name: "ファミリーペットリゾート",
    area: "長野県・軽井沢",
    rating: 4.8,
    reviews: 302,
    petScore: 97,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 24000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop",
  },
];

const fallbackDogRun: Facility[] = [
  {
    id: "d1111111-1111-1111-1111-111111111111",
    name: "広大ドッグラン＆パーク",
    area: "千葉県・成田",
    rating: 4.7,
    reviews: 189,
    petScore: 95,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 500,
    type: "ドッグラン",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
  },
  {
    id: "d2222222-2222-2222-2222-222222222222",
    name: "ドッグラン付きコテージ 森の風",
    area: "栃木県・那須",
    rating: 4.8,
    reviews: 234,
    petScore: 96,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 18000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
  },
  {
    id: "d3333333-3333-3333-3333-333333333333",
    name: "湘南オーシャンドッグラン",
    area: "神奈川県・茅ヶ崎",
    rating: 4.5,
    reviews: 112,
    petScore: 89,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 800,
    type: "ドッグラン",
    image: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=300&fit=crop",
  },
  {
    id: "d4444444-4444-4444-4444-444444444444",
    name: "天然芝ドッグランリゾート",
    area: "山梨県・河口湖",
    rating: 4.9,
    reviews: 298,
    petScore: 98,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 22000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop",
  },
  {
    id: "d5555555-5555-5555-5555-555555555555",
    name: "わんわんパラダイス",
    area: "静岡県・伊豆高原",
    rating: 4.6,
    reviews: 156,
    petScore: 93,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 900,
    type: "ドッグラン",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop",
  },
  {
    id: "d6666666-6666-6666-6666-666666666666",
    name: "プレミアムドッグラン＆カフェ",
    area: "東京都・立川",
    rating: 4.4,
    reviews: 87,
    petScore: 87,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 1200,
    type: "カフェ",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
  },
];

const fallbackSns: Facility[] = [
  {
    id: "n1111111-1111-1111-1111-111111111111",
    name: "映えカフェ PAWS & LATTE",
    area: "東京都・表参道",
    rating: 4.7,
    reviews: 412,
    petScore: 91,
    sizes: ["小型犬", "中型犬"],
    price: 2200,
    type: "カフェ",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
  },
  {
    id: "n2222222-2222-2222-2222-222222222222",
    name: "インスタ映えペットリゾート",
    area: "沖縄県・恩納村",
    rating: 4.9,
    reviews: 378,
    petScore: 97,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 28000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop",
  },
  {
    id: "n3333333-3333-3333-3333-333333333333",
    name: "フォトジェニックドッグカフェ",
    area: "神奈川県・横浜",
    rating: 4.6,
    reviews: 289,
    petScore: 90,
    sizes: ["小型犬"],
    price: 1600,
    type: "カフェ",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop",
  },
  {
    id: "n4444444-4444-4444-4444-444444444444",
    name: "SNSで話題のペットホテル",
    area: "大阪府・梅田",
    rating: 4.8,
    reviews: 345,
    petScore: 95,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 15000,
    type: "宿泊",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop",
  },
  {
    id: "n5555555-5555-5555-5555-555555555555",
    name: "絶景テラス ペットレストラン",
    area: "兵庫県・神戸",
    rating: 4.5,
    reviews: 267,
    petScore: 88,
    sizes: ["小型犬", "中型犬"],
    price: 4500,
    type: "レストラン",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
  },
  {
    id: "n6666666-6666-6666-6666-666666666666",
    name: "バズりスポット ペットパーク",
    area: "福岡県・糸島",
    rating: 4.7,
    reviews: 312,
    petScore: 93,
    sizes: ["小型犬", "中型犬", "大型犬"],
    price: 1000,
    type: "ドッグラン",
    image: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=300&fit=crop",
  },
];

/**
 * 春のおでかけ特集（cafe, park, restaurantタイプを優先）
 */
export function useSpringPicks() {
  const [facilities, setFacilities] = useState<Facility[]>(fallbackSpring);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetch() {
      try {
        const { data } = await supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .in("type", ["cafe", "park", "restaurant"])
          .order("pet_friendly_score", { ascending: false })
          .limit(8);

        let results = data ?? [];

        // データが足りない場合はランダムで補完
        if (results.length < 6) {
          const { data: extra } = await supabase
            .from("facilities")
            .select("*, reviews(rating)")
            .order("pet_friendly_score", { ascending: false })
            .limit(8);

          if (extra) {
            const ids = new Set(results.map((r: Record<string, unknown>) => r.id));
            for (const row of extra) {
              if (!ids.has((row as Record<string, unknown>).id) && results.length < 8) {
                results.push(row);
              }
            }
          }
        }

        if (results.length > 0) {
          setFacilities(
            results.map((row: Record<string, unknown>) =>
              mapDbRowToFacility(row, row.reviews as { rating: number }[])
            )
          );
        }
      } catch (e) {
        console.log("[useSpringPicks] Supabase fetch failed, using fallback:", e);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, []);

  return { facilities, loading };
}

/**
 * 初めてのペット旅行におすすめ（高評価・レビュー多い施設）
 */
export function useBeginnerPicks() {
  const [facilities, setFacilities] = useState<Facility[]>(fallbackBeginner);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetch() {
      try {
        const { data } = await supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .gte("pet_friendly_score", 85)
          .order("pet_friendly_score", { ascending: false })
          .limit(8);

        if (data && data.length > 0) {
          // レビュー数が多い順にソート
          const mapped = data.map((row: Record<string, unknown>) =>
            mapDbRowToFacility(row, row.reviews as { rating: number }[])
          );
          mapped.sort((a, b) => b.reviews - a.reviews);
          setFacilities(mapped);
        }
      } catch (e) {
        console.log("[useBeginnerPicks] Supabase fetch failed, using fallback:", e);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, []);

  return { facilities, loading };
}

/**
 * ドッグラン付きの施設
 */
export function useDogRunFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>(fallbackDogRun);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetch() {
      try {
        // ドッグランタイプの施設、または特徴にドッグランが含まれる施設
        const { data } = await supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .or("type.eq.dog_run,features.cs.{dog_run}")
          .order("pet_friendly_score", { ascending: false })
          .limit(8);

        if (data && data.length > 0) {
          setFacilities(
            data.map((row: Record<string, unknown>) =>
              mapDbRowToFacility(row, row.reviews as { rating: number }[])
            )
          );
        }
      } catch (e) {
        console.log("[useDogRunFacilities] Supabase fetch failed, using fallback:", e);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, []);

  return { facilities, loading };
}

/**
 * SNSで人気のスポット（レビュー数が多い施設）
 */
export function useSnsFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>(fallbackSns);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetch() {
      try {
        const { data } = await supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .order("pet_friendly_score", { ascending: false });

        if (data && data.length > 0) {
          const mapped = data.map((row: Record<string, unknown>) =>
            mapDbRowToFacility(row, row.reviews as { rating: number }[])
          );
          // レビュー数でソートしてシャッフル要素を加える
          mapped.sort((a, b) => b.reviews - a.reviews);
          setFacilities(mapped.slice(0, 8));
        }
      } catch (e) {
        console.log("[useSnsFacilities] Supabase fetch failed, using fallback:", e);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, []);

  return { facilities, loading };
}

// ---- 犬サイズ別 fallback ----
const allFallback: Facility[] = [
  ...fallbackSpring,
  ...fallbackBeginner,
  ...fallbackDogRun,
  ...fallbackSns,
];

const uniqueFallback = allFallback.filter(
  (f, i, arr) => arr.findIndex((x) => x.id === f.id) === i
);

const sizeLabel = { small: "小型犬", medium: "中型犬", large: "大型犬" } as const;

/**
 * 犬サイズ別施設
 */
export function useDogSizeFacilities(size: "small" | "medium" | "large") {
  const label = sizeLabel[size];
  const fallback = uniqueFallback.filter((f) => f.sizes.includes(label)).slice(0, 8);
  const [facilities, setFacilities] = useState<Facility[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function doFetch() {
      try {
        const col = `dog_size_${size}`;
        const { data } = await supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .eq(col, true)
          .order("pet_friendly_score", { ascending: false })
          .limit(8);

        if (data && data.length > 0) {
          setFacilities(
            data.map((row: Record<string, unknown>) =>
              mapDbRowToFacility(row, row.reviews as { rating: number }[])
            )
          );
        }
      } catch (e) {
        console.log(`[useDogSizeFacilities:${size}] Supabase fetch failed, using fallback:`, e);
      } finally {
        setLoading(false);
      }
    }

    doFetch();
  }, [size]);

  return { facilities, loading };
}
