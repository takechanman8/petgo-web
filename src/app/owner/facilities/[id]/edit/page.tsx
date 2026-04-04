"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const FACILITY_TYPES = ["宿泊", "カフェ", "ドッグラン", "レストラン", "ペットサロン", "動物病院"];

const FEATURES_OPTIONS = [
  "ドッグラン", "温泉", "ペット温泉", "プール", "カフェ併設",
  "駐車場", "送迎", "個室", "BBQ", "テラス席",
  "ペット用メニュー", "フォトスポット", "アジリティ",
];

const DOG_SIZES = [
  { value: "small", label: "小型犬" },
  { value: "medium", label: "中型犬" },
  { value: "large", label: "大型犬" },
];

interface FormData {
  name: string;
  type: string;
  prefecture: string;
  area: string;
  description: string;
  photo_url: string;
  price_range: number | "";
  pet_friendly_score: number;
  accepted_dog_sizes: string[];
  cat_ok: boolean;
  features: string[];
  max_pets: number | "";
  weight_limit: string;
  access_address: string;
  access_car: string;
  access_train: string;
}

const initialFormData: FormData = {
  name: "",
  type: "",
  prefecture: "",
  area: "",
  description: "",
  photo_url: "",
  price_range: "",
  pet_friendly_score: 50,
  accepted_dog_sizes: [],
  cat_ok: false,
  features: [],
  max_pets: "",
  weight_limit: "",
  access_address: "",
  access_car: "",
  access_train: "",
};

interface ValidationErrors {
  [key: string]: string;
}

export default function FacilityEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const facilityId = params.id as string;
  const isNew = facilityId === "new";

  const [form, setForm] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [facilityStatus, setFacilityStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [hasPendingDraft, setHasPendingDraft] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    if (isNew) return;

    async function loadFacility() {
      setLoading(true);

      // Check for pending draft first
      const { data: draft } = await supabase
        .from("facility_drafts")
        .select("*")
        .eq("facility_id", facilityId)
        .eq("owner_id", user!.id)
        .eq("status", "pending")
        .maybeSingle();

      if (draft) {
        setHasPendingDraft(true);
        setFacilityStatus("pending");
        const draftData = draft.draft_data as FormData;
        setForm({ ...initialFormData, ...draftData });
        setLoading(false);
        return;
      }

      // Check for rejected draft
      const { data: rejectedDraft } = await supabase
        .from("facility_drafts")
        .select("*")
        .eq("facility_id", facilityId)
        .eq("owner_id", user!.id)
        .eq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rejectedDraft) {
        setFacilityStatus("rejected");
        setRejectionReason(rejectedDraft.rejection_reason ?? null);
      }

      // Load facility data
      const { data: facility, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("id", facilityId)
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (error || !facility) {
        router.push("/owner/facilities");
        return;
      }

      if (!rejectedDraft && facility.status) {
        setFacilityStatus(facility.status);
      }

      setForm({
        name: facility.name ?? "",
        type: facility.type ?? "",
        prefecture: facility.prefecture ?? "",
        area: facility.area ?? "",
        description: facility.description ?? "",
        photo_url: facility.photo_url ?? "",
        price_range: facility.price_range ?? "",
        pet_friendly_score: facility.pet_friendly_score ?? 50,
        accepted_dog_sizes: facility.accepted_dog_sizes ?? [],
        cat_ok: facility.cat_ok ?? false,
        features: facility.features ?? [],
        max_pets: facility.max_pets ?? "",
        weight_limit: facility.weight_limit ?? "",
        access_address: facility.access_address ?? "",
        access_car: facility.access_car ?? "",
        access_train: facility.access_train ?? "",
      });

      setLoading(false);
    }

    loadFacility();
  }, [authLoading, user, facilityId, isNew]);

  function validate(): boolean {
    const newErrors: ValidationErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "施設名は必須です";
    }
    if (!form.type) {
      newErrors.type = "施設タイプを選択してください";
    }
    if (form.description.length > 0 && form.description.length < 100) {
      newErrors.description = "紹介文は100文字以上で入力してください";
    }
    if (form.description.length > 500) {
      newErrors.description = "紹介文は500文字以内で入力してください";
    }
    if (form.max_pets !== "" && (Number(form.max_pets) < 1 || Number(form.max_pets) > 10)) {
      newErrors.max_pets = "1〜10の範囲で入力してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function toggleArrayField(key: "accepted_dog_sizes" | "features", value: string) {
    setForm((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  async function handleSave() {
    if (!validate()) return;
    if (!user) return;

    setSaving(true);
    setSuccessMessage("");

    const draftData = { ...form };

    const { error } = await supabase.from("facility_drafts").upsert(
      {
        facility_id: isNew ? null : facilityId,
        owner_id: user.id,
        status: "pending",
        draft_data: draftData,
      },
      { onConflict: "facility_id,owner_id,status" }
    );

    setSaving(false);

    if (error) {
      // If upsert with onConflict fails, try a plain insert
      const { error: insertError } = await supabase.from("facility_drafts").insert({
        facility_id: isNew ? null : facilityId,
        owner_id: user.id,
        status: "pending",
        draft_data: draftData,
      });

      if (insertError) {
        setErrors({ _form: "保存に失敗しました。もう一度お試しください。" });
        return;
      }
    }

    setSuccessMessage("保存しました。事務局の審査後に反映されます。");
    setHasPendingDraft(true);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">ログインしてください</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/owner/facilities" className="text-gray-500 text-sm">
            ← 施設一覧に戻る
          </Link>
          <h1 className="text-lg font-bold">{isNew ? "新規施設登録" : "施設情報の編集"}</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Status badges */}
        {facilityStatus && (
          <div className="flex items-start gap-3">
            {facilityStatus === "approved" && (
              <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                公開中
              </span>
            )}
            {facilityStatus === "pending" && (
              <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-800">
                審査中
              </span>
            )}
            {facilityStatus === "rejected" && (
              <div className="flex flex-col gap-1">
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 w-fit">
                  差し戻し
                </span>
                {rejectionReason && (
                  <p className="text-sm text-red-600 mt-1">理由: {rejectionReason}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pending draft banner */}
        {hasPendingDraft && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            審査中の下書きがあります
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        {/* Form error */}
        {errors._form && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            {errors._form}
          </div>
        )}

        {/* Section 1: 基本情報 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold mb-4">基本情報</h2>
          <div className="space-y-4">
            {/* name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                施設名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.name ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="例: ペットホテル PetGo"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                施設タイプ <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.type ? "border-red-400" : "border-gray-300"
                }`}
              >
                <option value="">選択してください</option>
                {FACILITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
            </div>

            {/* prefecture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">都道府県</label>
              <select
                value={form.prefecture}
                onChange={(e) => updateField("prefecture", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">エリア</label>
              <input
                type="text"
                value={form.area}
                onChange={(e) => updateField("area", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="例: 箱根"
              />
            </div>
          </div>
        </div>

        {/* Section 2: 紹介文 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold mb-4">紹介文</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">施設の紹介文</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={6}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.description ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="施設の魅力を100〜500文字でご紹介ください"
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-xs text-red-500">{errors.description}</p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs ${
                  form.description.length > 500
                    ? "text-red-500"
                    : form.description.length >= 100
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {form.description.length} / 500
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: 写真・料金 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold mb-4">写真・料金</h2>
          <div className="space-y-4">
            {/* photo_url */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">写真URL</label>
              <input
                type="text"
                value={form.photo_url}
                onChange={(e) => updateField("photo_url", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            {/* price_range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">料金帯（円）</label>
              <input
                type="number"
                value={form.price_range}
                onChange={(e) =>
                  updateField("price_range", e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="例: 15000"
                min={0}
              />
            </div>

            {/* pet_friendly_score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ペットフレンドリースコア: {form.pet_friendly_score}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.pet_friendly_score}
                onChange={(e) => updateField("pet_friendly_score", Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: ペット対応情報 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold mb-4">ペット対応情報</h2>
          <div className="space-y-4">
            {/* accepted_dog_sizes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">受入可能な犬のサイズ</label>
              <div className="flex flex-wrap gap-3">
                {DOG_SIZES.map((size) => (
                  <label key={size.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.accepted_dog_sizes.includes(size.value)}
                      onChange={() => toggleArrayField("accepted_dog_sizes", size.value)}
                      className="rounded border-gray-300 text-primary focus:ring-primary/50"
                    />
                    {size.label}
                  </label>
                ))}
              </div>
            </div>

            {/* cat_ok */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.cat_ok}
                  onChange={(e) => updateField("cat_ok", e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary/50"
                />
                <span className="font-medium text-gray-700">猫の受入可</span>
              </label>
            </div>

            {/* max_pets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最大ペット数</label>
              <input
                type="number"
                value={form.max_pets}
                onChange={(e) =>
                  updateField("max_pets", e.target.value === "" ? "" : Number(e.target.value))
                }
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.max_pets ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="例: 3"
                min={1}
                max={10}
              />
              {errors.max_pets && <p className="text-xs text-red-500 mt-1">{errors.max_pets}</p>}
            </div>

            {/* weight_limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">体重制限</label>
              <input
                type="text"
                value={form.weight_limit}
                onChange={(e) => updateField("weight_limit", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="例: 25kgまで"
              />
            </div>
          </div>
        </div>

        {/* Section 5: 施設特徴 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold mb-4">施設特徴</h2>
          <div className="flex flex-wrap gap-3">
            {FEATURES_OPTIONS.map((feature) => (
              <label key={feature} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.features.includes(feature)}
                  onChange={() => toggleArrayField("features", feature)}
                  className="rounded border-gray-300 text-primary focus:ring-primary/50"
                />
                {feature}
              </label>
            ))}
          </div>
        </div>

        {/* Section 6: アクセス情報 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold mb-4">アクセス情報</h2>
          <div className="space-y-4">
            {/* access_address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
              <input
                type="text"
                value={form.access_address}
                onChange={(e) => updateField("access_address", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="例: 神奈川県足柄下郡箱根町..."
              />
            </div>

            {/* access_car */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">車でのアクセス</label>
              <textarea
                value={form.access_car}
                onChange={(e) => updateField("access_car", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="例: 東名高速道路 御殿場ICから約30分"
              />
            </div>

            {/* access_train */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電車でのアクセス</label>
              <textarea
                value={form.access_train}
                onChange={(e) => updateField("access_train", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="例: 箱根登山鉄道 強羅駅から徒歩10分"
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pt-2 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-opacity"
          >
            {saving ? "保存中..." : "下書き保存して審査に提出"}
          </button>
          <Link
            href="/owner/facilities"
            className="w-full text-center text-gray-500 text-sm py-2"
          >
            キャンセル
          </Link>
        </div>
      </div>
    </div>
  );
}
