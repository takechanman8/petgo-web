"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface AdminFacility {
  id: string;
  name: string;
  type: string;
  prefecture: string;
  area: string;
  pet_friendly_score: number;
  created_at: string;
  review_count: number;
  reservation_count: number;
}

const TYPE_LABELS: Record<string, string> = {
  宿泊: "🏨 宿泊",
  カフェ: "☕ カフェ",
  観光地: "🏞️ 観光地",
  ドッグラン: "🐕 ドッグラン",
  レストラン: "🍽️ レストラン",
};

export default function AdminFacilities() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<AdminFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchFacilities();
  }, [user]);

  async function fetchFacilities() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("facilities")
      .select("id, name, type, prefecture, area, pet_friendly_score, created_at, reviews(id), reservations(id)")
      .eq("owner_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) {
      setFacilities(
        data.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          prefecture: f.prefecture,
          area: f.area,
          pet_friendly_score: f.pet_friendly_score,
          created_at: f.created_at,
          review_count: (f.reviews as unknown[])?.length ?? 0,
          reservation_count: (f.reservations as unknown[])?.length ?? 0,
        }))
      );
    }
    setLoading(false);
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingId(null);
    fetchFacilities();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">施設管理</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-light transition-colors"
        >
          + 新規施設を登録
        </button>
      </div>

      {showForm && (
        <FacilityForm
          userId={user!.id}
          editingId={editingId}
          onClose={handleFormClose}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-5 shadow-sm animate-pulse"
            >
              <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : facilities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="text-5xl mb-4">🏨</div>
          <p className="text-gray-500 mb-4">まだ施設を登録していません</p>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-light transition-colors"
          >
            最初の施設を登録する
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  施設名
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  エリア
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ペットスコア
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  予約
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  レビュー
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {facilities.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={`/facility/${f.id}`}
                      className="font-medium text-gray-900 hover:text-primary"
                    >
                      {f.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(f.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {TYPE_LABELS[f.type] ?? f.type}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {f.prefecture} {f.area}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-primary">
                      🐾 {f.pet_friendly_score}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center text-sm text-gray-600">
                    {f.reservation_count}
                  </td>
                  <td className="px-5 py-4 text-center text-sm text-gray-600">
                    {f.review_count}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleEdit(f.id)}
                      className="text-sm text-primary hover:text-primary-dark font-medium"
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================
// Facility Form Component
// =============================================

const FACILITY_TYPES = ["宿泊", "カフェ", "観光地", "ドッグラン", "レストラン"];
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];
const DOG_SIZES = [
  { value: "small", label: "小型犬" },
  { value: "medium", label: "中型犬" },
  { value: "large", label: "大型犬" },
];
const FEATURE_OPTIONS = [
  "ドッグラン", "ペット用アメニティ", "トリミング", "ペット預かり",
  "ペット同伴食事", "ペット用メニュー", "大型犬OK", "猫OK",
  "駐車場あり", "WiFi完備", "温泉", "プール",
];

interface FacilityFormProps {
  userId: string;
  editingId: string | null;
  onClose: () => void;
}

function FacilityForm({ userId, editingId, onClose }: FacilityFormProps) {
  const [saving, setSaving] = useState(false);
  const [formLoading, setFormLoading] = useState(!!editingId);
  const [form, setForm] = useState({
    name: "",
    type: "宿泊",
    prefecture: "東京都",
    area: "",
    description: "",
    photo_url: "",
    price_range: 5000,
    pet_friendly_score: 80,
    accepted_dog_sizes: ["small", "medium"] as string[],
    cat_ok: false,
    features: [] as string[],
  });

  useEffect(() => {
    if (!editingId) return;

    const supabase = createClient();
    supabase
      .from("facilities")
      .select("*")
      .eq("id", editingId)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name,
            type: data.type,
            prefecture: data.prefecture,
            area: data.area,
            description: data.description ?? "",
            photo_url: data.photo_url ?? "",
            price_range: data.price_range ?? 5000,
            pet_friendly_score: data.pet_friendly_score,
            accepted_dog_sizes: data.accepted_dog_sizes ?? [],
            cat_ok: data.cat_ok,
            features: data.features ?? [],
          });
        }
        setFormLoading(false);
      });
  }, [editingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const payload = { ...form, owner_id: userId };

    if (editingId) {
      await supabase.from("facilities").update(payload).eq("id", editingId);
    } else {
      await supabase.from("facilities").insert(payload);
    }

    setSaving(false);
    onClose();
  }

  function toggleDogSize(size: string) {
    setForm((prev) => ({
      ...prev,
      accepted_dog_sizes: prev.accepted_dog_sizes.includes(size)
        ? prev.accepted_dog_sizes.filter((s) => s !== size)
        : [...prev.accepted_dog_sizes, size],
    }));
  }

  function toggleFeature(feature: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  }

  if (formLoading) {
    return (
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">
          {editingId ? "施設を編集" : "新規施設を登録"}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Name & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              施設名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="例: ペットリゾート箱根"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイプ <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {FACILITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Prefecture & Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              都道府県 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.prefecture}
              onChange={(e) =>
                setForm({ ...form, prefecture: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              エリア <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="例: 箱根・湯本"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            説明文
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            placeholder="施設の説明を入力してください"
          />
        </div>

        {/* Photo URL & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              写真URL
            </label>
            <input
              type="url"
              value={form.photo_url}
              onChange={(e) =>
                setForm({ ...form, photo_url: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              価格帯（円）
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.price_range}
              onChange={(e) =>
                setForm({ ...form, price_range: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Pet Friendly Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ペットフレンドリースコア: {form.pet_friendly_score}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={form.pet_friendly_score}
            onChange={(e) =>
              setForm({
                ...form,
                pet_friendly_score: Number(e.target.value),
              })
            }
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        {/* Dog Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            対応犬サイズ
          </label>
          <div className="flex gap-3">
            {DOG_SIZES.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => toggleDogSize(size.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
                  form.accepted_dog_sizes.includes(size.value)
                    ? "border-primary bg-green-50 text-primary"
                    : "border-gray-300 text-gray-500 hover:border-gray-400"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cat OK */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.cat_ok}
            onChange={(e) => setForm({ ...form, cat_ok: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
          />
          <span className="text-sm font-medium text-gray-700">猫OK</span>
        </label>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            特徴タグ
          </label>
          <div className="flex flex-wrap gap-2">
            {FEATURE_OPTIONS.map((feature) => (
              <button
                key={feature}
                type="button"
                onClick={() => toggleFeature(feature)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  form.features.includes(feature)
                    ? "border-primary bg-green-50 text-primary"
                    : "border-gray-300 text-gray-500 hover:border-gray-400"
                }`}
              >
                {feature}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving
              ? "保存中..."
              : editingId
                ? "更新する"
                : "登録する"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
