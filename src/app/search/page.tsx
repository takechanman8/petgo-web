"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { mapDbRowToFacility } from "@/lib/mapFacility";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  CompactFacilityCard,
  CompactSkeletonCard,
} from "@/components/compact-facility-card";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import type { Facility } from "@/types/facility";

const PREFECTURES = [
  "北海道",
  "宮城県",
  "山形県",
  "栃木県",
  "東京都",
  "神奈川県",
  "石川県",
  "長野県",
  "静岡県",
  "愛知県",
  "三重県",
  "京都府",
  "大阪府",
  "兵庫県",
  "和歌山県",
  "広島県",
  "香川県",
  "福岡県",
  "大分県",
];

const FACILITY_TYPES = [
  "宿泊",
  "カフェ",
  "ドッグラン",
  "レストラン",
  "ペットサロン",
  "動物病院",
];

const PET_SIZES = [
  { value: "small", label: "小型犬" },
  { value: "medium", label: "中型犬" },
  { value: "large", label: "大型犬" },
  { value: "cat", label: "猫OK" },
];

const POPULAR_KEYWORDS = [
  "ドッグラン付き", "温泉", "猫OK", "大型犬歓迎", "テラス席",
  "個室あり", "送迎あり", "プール", "BBQ", "海が見える",
];

const FEATURE_FILTERS = [
  "ドッグラン", "温泉", "プール", "カフェ併設", "BBQ", "送迎", "個室", "テラス席",
];

const PET_SERVICE_FILTERS = [
  "ペット用メニュー", "ペット用アメニティ", "ペット温泉", "ペットベッド貸出",
];

const PRICE_RANGES = [
  { value: "", label: "指定なし" },
  { value: "0-5000", label: "〜5,000円" },
  { value: "5000-10000", label: "5,000〜10,000円" },
  { value: "10000-20000", label: "10,000〜20,000円" },
  { value: "20000-", label: "20,000円〜" },
];

const RATING_OPTIONS = [
  { value: 0, label: "指定なし" },
  { value: 3.5, label: "3.5以上" },
  { value: 4.0, label: "4.0以上" },
  { value: 4.5, label: "4.5以上" },
];

type SortKey = "popularity" | "rating" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popularity", label: "人気順" },
  { value: "rating", label: "評価順" },
  { value: "price_asc", label: "料金が安い順" },
  { value: "price_desc", label: "料金が高い順" },
];

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const { favoriteIds, toggle: toggleFavorite } = useFavorites(user);

  // Filter state
  const [prefecture, setPrefecture] = useState("");
  const [facilityType, setFacilityType] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<SortKey>("popularity");

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState("");
  const [minRating, setMinRating] = useState(0);

  // Results
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const activeFilterCount = selectedFeatures.length + selectedServices.length + (priceRange ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const search = useCallback(async () => {
    setLoading(true);
    setSearched(true);

    const supabase = createClient();

    let query = supabase
      .from("facilities")
      .select("*, reviews(rating)");

    if (prefecture) {
      query = query.eq("prefecture", prefecture);
    }
    if (facilityType) {
      query = query.eq("type", facilityType);
    }
    if (keyword) {
      query = query.or(
        `name.ilike.%${keyword}%,description.ilike.%${keyword}%`,
      );
    }
    if (selectedSizes.length > 0) {
      const dogSizes = selectedSizes.filter((s) => s !== "cat");
      const wantsCat = selectedSizes.includes("cat");

      if (dogSizes.length > 0 && wantsCat) {
        query = query.or(
          `accepted_dog_sizes.ov.{${dogSizes.join(",")}},cat_ok.eq.true`,
        );
      } else if (dogSizes.length > 0) {
        query = query.overlaps("accepted_dog_sizes", dogSizes);
      } else if (wantsCat) {
        query = query.eq("cat_ok", true);
      }
    }

    // Advanced: features filter
    const allFeatures = [...selectedFeatures, ...selectedServices];
    if (allFeatures.length > 0) {
      query = query.overlaps("features", allFeatures);
    }

    // Advanced: price range
    if (priceRange) {
      const [min, max] = priceRange.split("-");
      if (min) query = query.gte("price_range", Number(min));
      if (max) query = query.lte("price_range", Number(max));
    }

    // Sort on DB side where possible
    if (sort === "popularity") {
      query = query.order("pet_friendly_score", { ascending: false });
    } else if (sort === "price_asc") {
      query = query.order("price_range", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("price_range", { ascending: false });
    }

    const { data, error } = await query.limit(60);

    if (error) {
      console.error("Search error:", error);
      setFacilities([]);
      setLoading(false);
      return;
    }

    let mapped = (data ?? []).map((row: Record<string, unknown>) => {
      const reviews = row.reviews as { rating: number }[] | undefined;
      return mapDbRowToFacility(row, reviews ?? []);
    });

    // Client-side rating filter
    if (minRating > 0) {
      mapped = mapped.filter((f) => f.rating >= minRating);
    }

    // Client-side sort for rating (computed from reviews)
    if (sort === "rating") {
      mapped.sort((a, b) => b.rating - a.rating);
    }

    setFacilities(mapped);
    setLoading(false);
  }, [prefecture, facilityType, selectedSizes, keyword, sort, selectedFeatures, selectedServices, priceRange, minRating]);

  // Run initial search on mount
  useEffect(() => {
    search();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 pt-20 sm:pt-24 pb-8">
        <h1 className="text-xl font-bold text-text-heading mb-4">
          おでかけ先を探す
        </h1>

        {/* Search Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Prefecture */}
            <div>
              <label className="block text-xs font-bold text-text-heading mb-1">
                エリア
              </label>
              <select
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">すべてのエリア</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Facility Type */}
            <div>
              <label className="block text-xs font-bold text-text-heading mb-1">
                施設タイプ
              </label>
              <select
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">すべてのタイプ</option>
                {FACILITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-bold text-text-heading mb-1">
                キーワード
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="施設名・特徴で検索"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text-body placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Pet Size Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-text-heading mb-1.5">
              ペットサイズ
            </label>
            <div className="flex flex-wrap gap-3">
              {PET_SIZES.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSizes.includes(value)}
                    onChange={() => handleSizeToggle(value)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm text-text-body">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Popular Keywords */}
          <div>
            <label className="block text-xs font-bold text-text-heading mb-1.5">
              よく使われるキーワード
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => { setKeyword(kw); }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    keyword === kw
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-200 text-text-muted hover:border-primary hover:text-primary"
                  }`}
                >
                  #{kw}
                </button>
              ))}
            </div>
          </div>

          {/* Submit + Advanced Filter */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="bg-accent text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                検索する
              </button>
              <button
                type="button"
                onClick={() => setShowAdvanced(true)}
                className="relative flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-text-body hover:border-primary hover:text-primary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                絞り込み
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setPrefecture("");
                setFacilityType("");
                setSelectedSizes([]);
                setKeyword("");
                setSelectedFeatures([]);
                setSelectedServices([]);
                setPriceRange("");
                setMinRating(0);
              }}
              className="text-sm text-text-muted hover:text-text-body transition-colors"
            >
              条件をリセット
            </button>
          </div>
        </form>

        {/* Active Filter Tags */}
        {(() => {
          const tags: { label: string; onRemove: () => void }[] = [];
          if (prefecture) tags.push({ label: prefecture, onRemove: () => setPrefecture("") });
          if (facilityType) tags.push({ label: facilityType, onRemove: () => setFacilityType("") });
          selectedSizes.forEach((s) => {
            const lbl = PET_SIZES.find((p) => p.value === s)?.label ?? s;
            tags.push({ label: lbl, onRemove: () => setSelectedSizes((prev) => prev.filter((x) => x !== s)) });
          });
          if (keyword) tags.push({ label: keyword, onRemove: () => setKeyword("") });
          selectedFeatures.forEach((f) => tags.push({ label: f, onRemove: () => setSelectedFeatures((prev) => prev.filter((x) => x !== f)) }));
          selectedServices.forEach((s) => tags.push({ label: s, onRemove: () => setSelectedServices((prev) => prev.filter((x) => x !== s)) }));
          if (priceRange) {
            const lbl = PRICE_RANGES.find((p) => p.value === priceRange)?.label ?? priceRange;
            tags.push({ label: lbl, onRemove: () => setPriceRange("") });
          }
          if (minRating > 0) tags.push({ label: `${minRating}以上`, onRemove: () => setMinRating(0) });

          if (tags.length === 0) return null;
          return (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-bold text-text-muted shrink-0">絞り込み条件</span>
              {tags.map((tag) => (
                <span key={tag.label} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {tag.label}
                  <button
                    type="button"
                    onClick={() => { tag.onRemove(); setTimeout(() => search(), 0); }}
                    className="ml-0.5 text-gray-400 hover:text-gray-600"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
            </div>
          );
        })()}

        {/* Sort & Count Bar */}
        {searched && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-muted">
              {loading ? "検索中..." : `${facilities.length}件の施設が見つかりました`}
            </p>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey);
              }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-text-body focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Re-search when sort changes */}
        <SortEffect sort={sort} search={search} searched={searched} />

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CompactSkeletonCard key={i} />
            ))}
          </div>
        ) : facilities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((facility) => (
              <Link
                key={facility.id}
                href={`/facility/${facility.id}`}
                className="block"
              >
                <CompactFacilityCard
                  facility={facility}
                  isFavorite={favoriteIds.has(facility.id)}
                  onToggleFavorite={() => toggleFavorite(facility.id)}
                  onLoginRequired={() => {}}
                  isLoggedIn={!!user}
                />
              </Link>
            ))}
          </div>
        ) : searched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-bold text-text-heading mb-1">
              該当する施設が見つかりませんでした
            </p>
            <p className="text-sm text-text-muted">
              条件を変更して再検索してください
            </p>
          </div>
        ) : null}
      </main>

      <Footer />

      {/* Advanced Filter Modal */}
      {showAdvanced && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdvanced(false)} />
          <div className="absolute inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full sm:max-h-[80vh] bg-white sm:rounded-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">絞り込み</h3>
              <button onClick={() => setShowAdvanced(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Features */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">施設の特徴</h4>
                <div className="flex flex-wrap gap-2">
                  {FEATURE_FILTERS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setSelectedFeatures((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedFeatures.includes(f)
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 text-gray-600 hover:border-primary"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pet Services */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">ペット向けサービス</h4>
                <div className="flex flex-wrap gap-2">
                  {PET_SERVICE_FILTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedServices.includes(s)
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 text-gray-600 hover:border-primary"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">価格帯</h4>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriceRange(priceRange === p.value ? "" : p.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        priceRange === p.value
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 text-gray-600 hover:border-primary"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">評価</h4>
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setMinRating(minRating === r.value ? 0 : r.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                        minRating === r.value
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 text-gray-600 hover:border-primary"
                      }`}
                    >
                      {r.value > 0 && (
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedFeatures([]);
                  setSelectedServices([]);
                  setPriceRange("");
                  setMinRating(0);
                }}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                リセット
              </button>
              <button
                type="button"
                onClick={() => { setShowAdvanced(false); search(); }}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                決定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tiny helper component to trigger a re-search when sort changes,
 * without adding sort to the initial useEffect dependency array.
 */
function SortEffect({
  sort,
  search,
  searched,
}: {
  sort: SortKey;
  search: () => void;
  searched: boolean;
}) {
  const [prevSort, setPrevSort] = useState(sort);
  useEffect(() => {
    if (sort !== prevSort && searched) {
      setPrevSort(sort);
      search();
    }
  }, [sort, prevSort, search, searched]);
  return null;
}
