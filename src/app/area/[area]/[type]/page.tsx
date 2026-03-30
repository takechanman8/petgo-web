import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://petgo.jp";

const AREA_MAP: Record<string, { name: string; prefectures: string[] }> = {
  hokkaido: { name: "北海道", prefectures: ["北海道"] },
  tohoku: {
    name: "東北",
    prefectures: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  },
  kanto: {
    name: "関東",
    prefectures: [
      "東京都",
      "神奈川県",
      "埼玉県",
      "千葉県",
      "茨城県",
      "栃木県",
      "群馬県",
    ],
  },
  chubu: {
    name: "中部",
    prefectures: [
      "新潟県",
      "富山県",
      "石川県",
      "福井県",
      "山梨県",
      "長野県",
      "岐阜県",
      "静岡県",
      "愛知県",
    ],
  },
  kansai: {
    name: "関西",
    prefectures: [
      "三重県",
      "滋賀県",
      "京都府",
      "大阪府",
      "兵庫県",
      "奈良県",
      "和歌山県",
    ],
  },
  chugoku: {
    name: "中国",
    prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  },
  shikoku: {
    name: "四国",
    prefectures: ["徳島県", "香川県", "愛媛県", "高知県"],
  },
  kyushu: {
    name: "九州・沖縄",
    prefectures: [
      "福岡県",
      "佐賀県",
      "長崎県",
      "熊本県",
      "大分県",
      "宮崎県",
      "鹿児島県",
      "沖縄県",
    ],
  },
};

const TYPE_MAP: Record<string, { name: string; dbValue: string }> = {
  hotel: { name: "ペット同伴ホテル", dbValue: "ホテル" },
  cafe: { name: "ペット同伴カフェ", dbValue: "カフェ" },
  restaurant: { name: "ペット同伴レストラン", dbValue: "レストラン" },
  park: { name: "ドッグラン・公園", dbValue: "ドッグラン" },
  camp: { name: "ペット同伴キャンプ場", dbValue: "キャンプ場" },
};

type Props = {
  params: Promise<{ area: string; type: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area, type } = await params;
  const areaInfo = AREA_MAP[area];
  const typeInfo = TYPE_MAP[type];

  if (!areaInfo || !typeInfo) {
    return { title: "ページが見つかりません" };
  }

  const title = `${areaInfo.name}の${typeInfo.name}`;
  const description = `${areaInfo.name}エリアのペット同伴OKの${typeInfo.name}一覧。口コミ・評価で比較して、愛犬・愛猫と一緒に楽しめる${typeInfo.name}を見つけよう。`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | PetGo`,
      description,
      url: `${BASE_URL}/area/${area}/${type}`,
      images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${BASE_URL}/area/${area}/${type}`,
    },
  };
}

export function generateStaticParams() {
  const params: { area: string; type: string }[] = [];
  for (const area of Object.keys(AREA_MAP)) {
    for (const type of Object.keys(TYPE_MAP)) {
      params.push({ area, type });
    }
  }
  return params;
}

export default async function AreaTypePage({ params }: Props) {
  const { area, type } = await params;
  const areaInfo = AREA_MAP[area];
  const typeInfo = TYPE_MAP[type];

  if (!areaInfo || !typeInfo) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-gray-50">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <p className="text-gray-500 text-lg">ページが見つかりません</p>
            <Link href="/" className="mt-4 inline-block text-primary hover:underline">
              トップに戻る
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const supabase = createServerClient();
  const { data: facilities } = await supabase
    .from("facilities")
    .select("*, reviews(rating)")
    .in("prefecture", areaInfo.prefectures)
    .eq("type", typeInfo.dbValue);

  const mappedFacilities = (facilities ?? []).map((f) => {
    const reviews = (f.reviews as { rating: number }[]) ?? [];
    const avgRating =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
              reviews.length) *
              10
          ) / 10
        : 0;
    return { ...f, avgRating, reviewCount: reviews.length };
  });

  const pageTitle = `${areaInfo.name}の${typeInfo.name}`;

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">
              トップ
            </Link>
            <span className="mx-2">/</span>
            <span>{areaInfo.name}</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{typeInfo.name}</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {pageTitle}
          </h1>
          <p className="text-gray-600 mb-10 max-w-2xl">
            {areaInfo.name}エリアでペットと一緒に楽しめる{typeInfo.name}
            をご紹介。口コミや評価を参考に、あなたにぴったりの施設を見つけましょう。
          </p>

          {mappedFacilities.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 mb-2">
                {pageTitle}はまだ登録されていません
              </p>
              <Link href="/" className="text-sm text-primary hover:underline">
                他のエリア・タイプで探す
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mappedFacilities.map((facility) => (
                <Link
                  key={facility.id}
                  href={`/facility/${facility.id}`}
                  className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={facility.photo_url}
                      alt={facility.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {facility.type}
                    </span>
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-gray-900 line-clamp-1">
                      {facility.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {facility.prefecture}・{facility.area}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(facility.avgRating) ? "text-amber-400" : "text-gray-200"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm text-gray-700">
                        {facility.avgRating}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({facility.reviewCount})
                      </span>
                    </div>
                    <div className="mt-3 flex items-end justify-between border-t border-gray-100 pt-3">
                      <span className="text-lg font-bold text-gray-900">
                        ¥{facility.price_range?.toLocaleString()}
                        <span className="text-xs text-gray-400">〜</span>
                      </span>
                      <span className="text-xs text-accent font-medium">
                        詳細を見る →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
