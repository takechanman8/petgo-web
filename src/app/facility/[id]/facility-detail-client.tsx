"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { mapDbRowToFacility } from "@/lib/mapFacility";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ReviewModal } from "@/components/review-modal";
import { FavoriteButton } from "@/components/favorite-button";
import { ReservationForm } from "@/components/reservation-form";
import { CarouselSection } from "@/components/carousel-section";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useFavorites } from "@/hooks/useFavorites";
import { useSimilarFacilities } from "@/hooks/useRecommendations";
import { petChan } from "@/lib/petName";
import type { Facility } from "@/types/facility";

// --- Types ---
interface FacilityRaw {
  prefecture: string;
  type: string;
  features: string[];
  accepted_dog_sizes: string[];
  cat_ok: boolean;
  description: string;
}

interface UserPet {
  id: string;
  name: string;
  type: "犬" | "猫";
  size: "small" | "medium" | "large" | null;
}

interface ReviewData {
  id: string;
  user_name: string;
  pet_type: string | null;
  pet_breed: string | null;
  pet_size: string | null;
  rating: number;
  comment: string;
  photo_url: string | null;
  created_at: string;
}

// --- Size labels ---
const SIZE_LABELS: Record<string, string> = {
  small: "小型犬",
  medium: "中型犬",
  large: "大型犬",
};

// --- Feature icon mapping ---
const FEATURE_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  ドッグラン: { icon: <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217 1.5 3 2 3.5s1.5.5 2 .5c.667 0 1.333-.333 2-1m0-7.828c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.137 1.217-1.5 3-2 3.5s-1.5.5-2 .5c-.667 0-1.333-.333-2-1" />, label: "ドッグラン" },
  温泉: { icon: <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />, label: "温泉" },
  ペット温泉: { icon: <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />, label: "ペット温泉" },
  プール: { icon: <path d="M2 12h2a8 8 0 018-8h0a8 8 0 018 8h2M6 20a2 2 0 01-2-2m16 2a2 2 0 002-2M2 16h20" />, label: "プール" },
  ドッグプール: { icon: <path d="M2 12h2a8 8 0 018-8h0a8 8 0 018 8h2M6 20a2 2 0 01-2-2m16 2a2 2 0 002-2M2 16h20" />, label: "ドッグプール" },
  カフェ併設: { icon: <path d="M17 8h1a4 4 0 110 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zm0 0V6" />, label: "カフェ併設" },
  駐車場: { icon: <path d="M19 17h2l-2-7H5L3 17h2m14 0a2 2 0 11-4 0m4 0H7m0 0a2 2 0 11-4 0" />, label: "駐車場" },
  駐車場完備: { icon: <path d="M19 17h2l-2-7H5L3 17h2m14 0a2 2 0 11-4 0m4 0H7m0 0a2 2 0 11-4 0" />, label: "駐車場完備" },
  送迎: { icon: <path d="M8 7h8m-8 4h4m-2-6v14m-4 0h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" />, label: "送迎" },
  個室: { icon: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />, label: "個室" },
  BBQ: { icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />, label: "BBQ" },
  テラス席: { icon: <path d="M3 21h18M9 8h6m-3-4v4m-7 4l3-4h8l3 4M4 21V12m16 0v9" />, label: "テラス席" },
  ペット用メニュー: { icon: <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />, label: "ペット用メニュー" },
};

// --- Gallery dummy images per type ---
function getGalleryImages(mainImage: string, type: string): string[] {
  const extras: Record<string, string[]> = {
    宿泊: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&h=400&fit=crop",
    ],
    カフェ: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&h=400&fit=crop",
    ],
    ドッグラン: [
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=600&h=400&fit=crop",
    ],
    レストラン: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=400&fit=crop",
    ],
  };
  const fallback = [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=600&h=400&fit=crop",
  ];
  return [mainImage, ...(extras[type] ?? fallback)];
}

// --- Category photo gallery data ---
const CATEGORY_PHOTOS: Record<string, string[]> = {
  客室: [
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=400&fit=crop",
  ],
  ドッグラン: [
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600&h=400&fit=crop",
  ],
  食事: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
  ],
  "温泉・風呂": [
    "https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop",
  ],
};

const PHOTO_CATEGORIES = ["すべて", "客室", "ドッグラン", "食事", "温泉・風呂"] as const;

// --- Access info helper ---
function getAccessInfo(area: string): { address: string; car: string; train: string } {
  if (area.includes("箱根")) {
    return {
      address: "神奈川県足柄下郡箱根町湯本123-4",
      car: "東名高速道路「厚木IC」より小田原厚木道路経由で約60分。駐車場30台完備（無料）",
      train: "箱根登山鉄道「箱根湯本駅」より送迎バスで約10分（要予約）",
    };
  }
  if (area.includes("軽井沢")) {
    return {
      address: "長野県北佐久郡軽井沢町大字長倉456-7",
      car: "上信越自動車道「碓氷軽井沢IC」より約15分。駐車場50台完備（無料）",
      train: "北陸新幹線「軽井沢駅」より無料シャトルバスで約20分",
    };
  }
  if (area.includes("伊豆") || area.includes("熱海")) {
    return {
      address: "静岡県伊東市八幡野789-10",
      car: "東名高速道路「沼津IC」より伊豆縦貫道経由で約60分。駐車場20台完備（無料）",
      train: "JR伊東線「伊豆高原駅」よりタクシーで約10分",
    };
  }
  if (area.includes("那須")) {
    return {
      address: "栃木県那須郡那須町高久甲1234-5",
      car: "東北自動車道「那須IC」より約20分。駐車場40台完備（無料）",
      train: "東北新幹線「那須塩原駅」より無料送迎バスで約30分（要予約）",
    };
  }
  // Default
  return {
    address: `${area} 1-2-3`,
    car: "最寄りICより車で約20分。駐車場完備（無料）",
    train: "最寄り駅よりタクシーで約15分",
  };
}

// --- Sample plans ---
function getSamplePlans(type: string, price: number) {
  if (type === "宿泊") {
    return [
      { name: "スタンダードプラン", desc: "愛犬と過ごす基本プラン。ドッグランフリーパス付き", price, sizes: ["小型犬", "中型犬", "大型犬"], passOnly: false },
      { name: "デラックスプラン", desc: "広めのお部屋でゆったり。ペット用アメニティ充実", price: Math.round(price * 1.3), sizes: ["小型犬", "中型犬", "大型犬"], passOnly: false },
      { name: "PASS限定 プレミアムプラン", desc: "ペット温泉付き特別室。部屋食対応", price: Math.round(price * 1.6), sizes: ["小型犬", "中型犬"], passOnly: true },
      { name: "記念日プラン", desc: "ケーキ＆写真撮影サービス付き", price: Math.round(price * 1.5), sizes: ["小型犬", "中型犬", "大型犬"], passOnly: false },
    ];
  }
  if (type === "カフェ" || type === "レストラン") {
    return [
      { name: "ランチセット", desc: "メイン+ドリンク。ペット用おやつ付き", price, sizes: ["小型犬", "中型犬"], passOnly: false },
      { name: "ディナーコース", desc: "前菜からデザートまで。テラス席確約", price: Math.round(price * 2), sizes: ["小型犬", "中型犬"], passOnly: false },
      { name: "PASS限定 ペアセット", desc: "2名分+ペット用メニュー。PASS会員限定特別価格", price: Math.round(price * 1.8), sizes: ["小型犬"], passOnly: true },
    ];
  }
  return [
    { name: "1日利用プラン", desc: "時間無制限で施設を利用可能", price, sizes: ["小型犬", "中型犬", "大型犬"], passOnly: false },
    { name: "半日プラン", desc: "3時間のショート利用", price: Math.round(price * 0.6), sizes: ["小型犬", "中型犬", "大型犬"], passOnly: false },
    { name: "PASS限定 フリーパス", desc: "月額で何度でも利用可能", price: Math.round(price * 3), sizes: ["小型犬", "中型犬", "大型犬"], passOnly: true },
  ];
}

// --- Amenity rules ---
function getAmenityRules(type: string) {
  if (type === "宿泊") {
    return [
      { label: "ケージ貸出", ok: true },
      { label: "ペット用食事", ok: true },
      { label: "同室就寝", ok: true },
      { label: "頭数制限", value: "2頭まで" },
      { label: "体重制限", value: "25kgまで" },
      { label: "ペット用タオル", ok: true },
      { label: "食器貸出", ok: true },
      { label: "トイレシート", ok: true },
    ];
  }
  if (type === "カフェ" || type === "レストラン") {
    return [
      { label: "ケージ貸出", ok: false },
      { label: "ペット用メニュー", ok: true },
      { label: "テラス席同伴", ok: true },
      { label: "頭数制限", value: "1頭まで" },
      { label: "体重制限", value: "10kgまで" },
      { label: "水飲みボウル", ok: true },
      { label: "リード必須", ok: true },
    ];
  }
  return [
    { label: "ケージ貸出", ok: false },
    { label: "ペット用食事", ok: false },
    { label: "頭数制限", value: "制限なし" },
    { label: "体重制限", value: "制限なし" },
    { label: "水飲み場", ok: true },
    { label: "リード必須", ok: true },
  ];
}

// --- Pseudo-random from ID ---
function pseudoRandom(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function FacilityDetailClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [facilityRaw, setFacilityRaw] = useState<FacilityRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState(false);
  const { user, signInWithGoogle } = useAuth();
  const { isPassMember } = useSubscription(user);
  const { favoriteIds, toggle } = useFavorites(user);

  // Gallery
  const [galleryIndex, setGalleryIndex] = useState(0);

  // User pets
  const [userPets, setUserPets] = useState<UserPet[]>([]);

  // Plan filter
  const [planSizeFilter, setPlanSizeFilter] = useState("all");

  // Section 7: Category photo gallery
  const [photoCat, setPhotoCat] = useState<string>("すべて");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Section 9: Enhanced reviews
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewFilter, setReviewFilter] = useState<"all" | "small" | "medium" | "large" | "cat">("all");
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Section 11: Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<Facility[]>([]);

  // Section 10: Similar facilities
  const { similar: similarFacilities, loading: similarLoading } = useSimilarFacilities(
    id,
    facilityRaw?.prefecture ?? null,
    facilityRaw?.type ?? null,
  );

  const fetchPets = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("pets")
      .select("id, name, type, size")
      .eq("user_id", user.id);
    if (data) setUserPets(data as UserPet[]);
  }, [user]);

  useEffect(() => {
    const supabase = createClient();
    async function fetchFacility() {
      try {
        const { data, error } = await supabase
          .from("facilities")
          .select("*, reviews(rating)")
          .eq("id", id)
          .single();
        if (error) throw error;
        if (data) {
          const row = data as Record<string, unknown>;
          setFacility(mapDbRowToFacility(row, row.reviews as { rating: number }[]));
          setFacilityRaw({
            prefecture: row.prefecture as string,
            type: row.type as string,
            features: (row.features as string[]) ?? [],
            accepted_dog_sizes: (row.accepted_dog_sizes as string[]) ?? [],
            cat_ok: (row.cat_ok as boolean) ?? false,
            description: (row.description as string) ?? "",
          });
        }
      } catch (e) {
        console.error("[FacilityDetail] Error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchFacility();
    fetchPets();
  }, [id, fetchPets]);

  // Fetch reviews
  useEffect(() => {
    const supabase = createClient();
    async function fetchReviews() {
      setReviewsLoading(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, user_name, pet_type, pet_breed, pet_size, rating, comment, photo_url, created_at")
          .eq("facility_id", id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (data) setReviews(data as ReviewData[]);
      } catch (e) {
        console.error("[FacilityDetail] Reviews fetch error:", e);
      } finally {
        setReviewsLoading(false);
      }
    }
    fetchReviews();
  }, [id, reviewRefreshKey]);

  // Default review filter to user's first pet's size
  useEffect(() => {
    if (userPets.length > 0) {
      const firstPet = userPets[0];
      if (firstPet.type === "猫") {
        setReviewFilter("cat");
      } else if (firstPet.size) {
        setReviewFilter(firstPet.size as "small" | "medium" | "large");
      }
    }
  }, [userPets]);

  // Section 11: Save to recently viewed and load history
  useEffect(() => {
    if (!facility) return;

    try {
      const key = "recentlyViewed";
      const stored = localStorage.getItem(key);
      const list: Facility[] = stored ? JSON.parse(stored) : [];

      // Remove current facility if already in the list
      const filtered = list.filter((f) => f.id !== facility.id);

      // Add current facility at the front
      const updated = [
        {
          id: facility.id,
          name: facility.name,
          image: facility.image,
          area: facility.area,
          type: facility.type,
          price: facility.price,
          rating: facility.rating,
          reviews: facility.reviews,
          petScore: facility.petScore,
          sizes: facility.sizes,
        },
        ...filtered,
      ].slice(0, 10);

      localStorage.setItem(key, JSON.stringify(updated));

      // Display list excludes current facility
      setRecentlyViewed(filtered.slice(0, 10));
    } catch {
      // localStorage not available
    }
  }, [facility]);

  const galleryImages = facility && facilityRaw ? getGalleryImages(facility.image, facilityRaw.type) : [];
  const viewerCount = facility ? (pseudoRandom(facility.id) % 18) + 5 : 0;
  const remainingRooms = facility ? (pseudoRandom(facility.id + "r") % 4) + 1 : 0;
  const passDiscount = facility ? Math.round(facility.price * 0.15) : 0;

  // Section 7: Get photos for selected category
  const getCategoryPhotos = (): string[] => {
    if (photoCat === "すべて") {
      return Object.values(CATEGORY_PHOTOS).flat();
    }
    return CATEGORY_PHOTOS[photoCat] ?? [];
  };

  // Section 9: Rating distribution
  const getRatingDistribution = (): number[] => {
    const dist = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
    for (const r of reviews) {
      const idx = Math.max(0, Math.min(4, Math.round(r.rating) - 1));
      dist[idx]++;
    }
    return dist;
  };

  // Section 9: Filter reviews
  const getFilteredReviews = (): ReviewData[] => {
    if (reviewFilter === "all") return reviews;
    if (reviewFilter === "cat") return reviews.filter((r) => r.pet_type === "猫");
    return reviews.filter((r) => r.pet_size === reviewFilter);
  };

  // Section 9: Overall average rating
  const getAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 pt-16">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6">
            &larr; 施設一覧に戻る
          </Link>

          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-64 rounded-xl bg-gray-200" />
              <div className="h-8 w-1/2 rounded bg-gray-200" />
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-32 rounded bg-gray-200" />
            </div>
          ) : !facility || !facilityRaw ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">施設が見つかりませんでした</p>
              <Link href="/" className="mt-4 inline-block text-primary hover:underline">トップに戻る</Link>
            </div>
          ) : (
            <>
              {/* ===== セクション1: フォトギャラリー ===== */}
              <div className="mb-6">
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <img
                    src={galleryImages[galleryIndex]}
                    alt={`${facility.name} - 写真${galleryIndex + 1}`}
                    className="w-full h-64 sm:h-96 object-cover"
                  />
                  <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-primary">
                    {facility.type}
                  </span>
                  <div className="absolute top-4 right-4">
                    <FavoriteButton
                      isFavorite={favoriteIds.has(facility.id)}
                      onToggle={() => toggle(facility.id)}
                      onLoginRequired={signInWithGoogle}
                      isLoggedIn={!!user}
                      size="md"
                    />
                  </div>
                  <span className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                    {galleryIndex + 1} / {galleryImages.length}
                  </span>
                  {galleryIndex > 0 && (
                    <button onClick={() => setGalleryIndex(galleryIndex - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors">
                      <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  )}
                  {galleryIndex < galleryImages.length - 1 && (
                    <button onClick={() => setGalleryIndex(galleryIndex + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors">
                      <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                  {galleryImages.map((img, i) => (
                    <button key={i} onClick={() => setGalleryIndex(i)} className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === galleryIndex ? "border-primary" : "border-transparent"}`}>
                      <img src={img} alt="" className="h-16 w-24 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Main content + Sidebar */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left column */}
                <div className="flex-1 space-y-6">
                  {/* Facility header */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-gray-900">{facility.name}</h1>
                    <p className="mt-1 text-gray-500">{facility.area}</p>

                    <div className="flex items-center gap-4 flex-wrap mt-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`h-5 w-5 ${star <= Math.round(facility.rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 font-medium text-gray-700">{facility.rating}</span>
                        <span className="text-sm text-gray-400">({facility.reviews}件)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🐾</span>
                        <div className="h-2 w-16 rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${facility.petScore}%` }} />
                        </div>
                        <span className="text-sm font-medium text-primary">{facility.petScore}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {facility.sizes.map((size) => (
                        <span key={size} className="rounded-full bg-green-50 px-3 py-1 text-sm text-primary font-medium">{size}</span>
                      ))}
                    </div>

                    {facilityRaw.description && (
                      <p className="mt-4 text-sm text-gray-600 leading-relaxed">{facilityRaw.description}</p>
                    )}

                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="text-2xl font-bold text-gray-900">
                        ¥{facility.price.toLocaleString()}
                        <span className="text-base font-normal text-gray-400">〜</span>
                      </div>
                    </div>
                  </div>

                  {/* ===== セクション3: ペット相性バッジ ===== */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-3">あなたのペットとの相性</h2>
                    {!user ? (
                      <p className="text-sm text-gray-400">ログインすると相性チェックができます</p>
                    ) : userPets.length === 0 ? (
                      <Link href="/mypage" className="text-sm text-primary hover:underline">
                        ペットを登録して相性チェック →
                      </Link>
                    ) : (
                      <div className="space-y-2">
                        {userPets.map((pet) => {
                          const isMatch =
                            pet.type === "猫"
                              ? facilityRaw.cat_ok
                              : pet.size
                                ? facilityRaw.accepted_dog_sizes.includes(pet.size)
                                : true;
                          return (
                            <div key={pet.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isMatch ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                              {isMatch ? (
                                <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              )}
                              <span className="font-medium">{petChan(pet.name)}</span>
                              <span>{isMatch ? "OK!" : `この施設は${pet.type === "猫" ? "猫" : pet.size === "large" ? "大型犬" : pet.size === "medium" ? "中型犬" : "小型犬"}には対応していません`}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ===== セクション4: 施設ハイライト ===== */}
                  {facilityRaw.features.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-5">
                      <h2 className="text-base font-bold text-gray-900 mb-3">施設の特徴</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {facilityRaw.features.map((feat) => {
                          const mapped = FEATURE_ICONS[feat];
                          return (
                            <div key={feat} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
                              <svg className="h-5 w-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                {mapped ? mapped.icon : <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />}
                              </svg>
                              <span className="text-sm text-gray-700">{feat}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ===== セクション5: プラン一覧 ===== */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-gray-900">プラン一覧</h2>
                      <select
                        value={planSizeFilter}
                        onChange={(e) => setPlanSizeFilter(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 focus:border-primary focus:outline-none"
                      >
                        <option value="all">すべてのサイズ</option>
                        <option value="小型犬">小型犬</option>
                        <option value="中型犬">中型犬</option>
                        <option value="大型犬">大型犬</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      {getSamplePlans(facilityRaw.type, facility.price)
                        .filter((p) => planSizeFilter === "all" || p.sizes.includes(planSizeFilter))
                        .map((plan) => (
                          <div key={plan.name} className={`rounded-lg border p-4 ${plan.passOnly ? "border-orange-200 bg-orange-50/30" : "border-gray-200"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-sm text-gray-900">{plan.name}</h3>
                                  {plan.passOnly && (
                                    <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">PASS限定</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{plan.desc}</p>
                                <div className="flex gap-1 mt-2">
                                  {plan.sizes.map((s) => (
                                    <span key={s} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{s}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-lg font-bold text-gray-900">¥{plan.price.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400">〜</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* ===== セクション6: ペット向けアメニティ・ルール ===== */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-3">ペット向けアメニティ・ルール</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {getAmenityRules(facilityRaw.type).map((rule) => (
                        <div key={rule.label} className="flex items-center gap-2 py-1.5">
                          {"ok" in rule ? (
                            rule.ok ? (
                              <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg className="h-4 w-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            )
                          ) : (
                            <svg className="h-4 w-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
                          )}
                          <span className="text-sm text-gray-700">{rule.label}</span>
                          {"value" in rule && <span className="text-sm font-medium text-gray-900 ml-auto">{rule.value}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ===== セクション7: カテゴリ別フォトギャラリー ===== */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-3">フォトギャラリー</h2>
                    <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                      {PHOTO_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPhotoCat(cat)}
                          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                            photoCat === cat
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {getCategoryPhotos().slice(0, 4).map((img, i) => (
                        <button
                          key={`${photoCat}-${i}`}
                          onClick={() => setLightboxImg(img)}
                          className="relative rounded-lg overflow-hidden aspect-[4/3] group"
                        >
                          <img
                            src={img}
                            alt={`${photoCat} ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ===== セクション8: アクセス / 地図 ===== */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-3">アクセス</h2>
                    {/* Map embed */}
                    <div className="rounded-lg overflow-hidden mb-4">
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(facility.area)}&output=embed`}
                        width="100%"
                        height="250"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="施設の地図"
                      />
                    </div>
                    {/* Address */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <p className="text-sm text-gray-700">{getAccessInfo(facility.area).address}</p>
                      </div>

                      {/* Car access */}
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H18.75M20.625 4.5H3.375m17.25 0A2.625 2.625 0 0123.25 7.125v7.5a2.625 2.625 0 01-2.625 2.625m17.25-12.75L18 14.25m0 0h2.625M3.375 4.5L6 14.25m0 0H3.375" />
                        </svg>
                        <div>
                          <p className="text-xs font-bold text-gray-900 mb-0.5">車でのアクセス</p>
                          <p className="text-sm text-gray-600">{getAccessInfo(facility.area).car}</p>
                        </div>
                      </div>

                      {/* Train access */}
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V2m0 4a4 4 0 014 4v4a4 4 0 01-4 4m0-12a4 4 0 00-4 4v4a4 4 0 004 4m0 0v2m0 0h3m-3 0H9m6 0l2 3m-8-3l-2 3" />
                        </svg>
                        <div>
                          <p className="text-xs font-bold text-gray-900 mb-0.5">電車でのアクセス</p>
                          <p className="text-sm text-gray-600">{getAccessInfo(facility.area).train}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== セクション2: 予約ボックス（スティッキー） ===== */}
                <div className="w-full lg:w-80 shrink-0">
                  <div className="lg:sticky lg:top-20 space-y-4">
                    {/* 閲覧中・残り表示 */}
                    <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        本日<span className="font-bold text-gray-900">{viewerCount}人</span>がこの施設を閲覧中
                      </div>
                      {facilityRaw.type === "宿泊" && (
                        <p className="text-xs font-bold text-red-500">残り{remainingRooms}室</p>
                      )}
                      {isPassMember && (
                        <p className="text-xs font-bold text-red-500">PetGo PASSなら ¥{passDiscount.toLocaleString()}お得</p>
                      )}
                    </div>

                    <ReservationForm facility={facility} />
                  </div>
                </div>
              </div>

              {/* ===== セクション9: 強化レビューセクション ===== */}
              <div className="mt-8 space-y-6">
                {/* Orange banner */}
                <div className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 flex items-center gap-2">
                  <svg className="h-5 w-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-bold text-white">レビュー投稿で+50pt獲得！</span>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">レビュー</h2>
                  {user ? (
                    <button onClick={() => setShowReviewModal(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-light">
                      レビューを書く
                    </button>
                  ) : (
                    <button onClick={signInWithGoogle} className="rounded-lg border-2 border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-green-50">
                      ログインしてレビューを書く
                    </button>
                  )}
                </div>

                {successMessage && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-primary font-medium">
                    レビューありがとうございます！+50ポイント獲得
                  </div>
                )}

                {/* Rating overview */}
                {!reviewsLoading && reviews.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Big rating number */}
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-gray-900">{getAverageRating()}</span>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`h-4 w-4 ${star <= Math.round(getAverageRating()) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{reviews.length}件のレビュー</span>
                      </div>

                      {/* Rating distribution bars */}
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const dist = getRatingDistribution();
                          const count = dist[star - 1];
                          const maxCount = Math.max(...dist, 1);
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                              <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <div className="flex-1 h-2 rounded-full bg-gray-100">
                                <div
                                  className="h-2 rounded-full bg-amber-400 transition-all"
                                  style={{ width: `${(count / maxCount) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-6">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pet size filter tabs */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {([
                    { value: "all" as const, label: "すべて" },
                    { value: "small" as const, label: "小型犬" },
                    { value: "medium" as const, label: "中型犬" },
                    { value: "large" as const, label: "大型犬" },
                    { value: "cat" as const, label: "猫" },
                  ]).map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setReviewFilter(tab.value)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        reviewFilter === tab.value
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Personalized label */}
                {user && userPets.length > 0 && reviewFilter !== "all" && (
                  <p className="text-sm text-primary font-medium">
                    あなたと同じ{reviewFilter === "cat" ? "猫" : SIZE_LABELS[reviewFilter] ?? ""}オーナーの声
                  </p>
                )}

                {/* Review list */}
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-white rounded-xl p-4 space-y-3">
                        <div className="h-4 w-1/3 rounded bg-gray-200" />
                        <div className="h-3 w-full rounded bg-gray-200" />
                        <div className="h-3 w-2/3 rounded bg-gray-200" />
                      </div>
                    ))}
                  </div>
                ) : getFilteredReviews().length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <p className="text-gray-400 text-sm">
                      {reviewFilter === "all" ? "まだレビューがありません" : "該当するレビューがありません"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredReviews().map((review) => (
                      <div key={review.id} className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-gray-900">{review.user_name || "匿名ユーザー"}</span>
                              {review.pet_type && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                                  {review.pet_type}{review.pet_breed ? ` / ${review.pet_breed}` : ""}
                                  {review.pet_size ? ` (${SIZE_LABELS[review.pet_size] ?? review.pet_size})` : ""}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className={`h-3.5 w-3.5 ${star <= Math.round(review.rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">
                            {new Date(review.created_at).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                        {review.photo_url && (
                          <div className="mt-3">
                            <img src={review.photo_url} alt="レビュー写真" className="rounded-lg h-32 object-cover" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showReviewModal && user && (
                <ReviewModal
                  facilityId={id}
                  user={user}
                  isPassMember={isPassMember}
                  onClose={() => setShowReviewModal(false)}
                  onSubmitted={() => {
                    setShowReviewModal(false);
                    setReviewRefreshKey((k) => k + 1);
                    setSuccessMessage(true);
                    setTimeout(() => setSuccessMessage(false), 5000);
                  }}
                />
              )}

              {/* ===== セクション10: おすすめ施設（カルーセル） ===== */}
              <div className="mt-8">
                {user && userPets.length === 0 && (
                  <div className="mb-2">
                    <Link href="/mypage" className="text-sm text-primary hover:underline font-medium">
                      ペットを登録してパーソナライズ →
                    </Link>
                  </div>
                )}
                <CarouselSection
                  title={
                    user && userPets.length > 0
                      ? `あなたの${petChan(userPets[0].name)}に合う施設`
                      : "この施設を見た人はこちらも見ています"
                  }
                  subtitle="同じエリア・タイプの人気施設"
                  facilities={similarFacilities}
                  loading={similarLoading}
                />
              </div>

              {/* ===== セクション11: 最近見た施設（カルーセル） ===== */}
              {recentlyViewed.length > 0 && (
                <div className="mt-8">
                  <CarouselSection
                    title="最近見た施設"
                    subtitle="あなたの閲覧履歴から"
                    facilities={recentlyViewed}
                    loading={false}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Lightbox modal for Section 7 */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
            onClick={() => setLightboxImg(null)}
            aria-label="閉じる"
          >
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImg}
            alt="拡大写真"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
