"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type TabKey = "pending" | "approved" | "rejected";

interface FacilityDraft {
  id: string;
  facility_id: string | null;
  owner_id: string;
  status: string;
  draft_data: Record<string, unknown>;
  rejection_reason: string | null;
  created_at: string;
}

interface Facility {
  id: string;
  name: string;
  type: string;
  prefecture: string;
  area: string;
  description: string;
  photo_url: string;
  price_range: string;
  pet_friendly_score: number;
  accepted_dog_sizes: string[];
  cat_ok: boolean;
  features: string[];
  max_pets: number;
  weight_limit: number;
  access_address: string;
  access_car: string;
  access_train: string;
  status: string;
  rejection_reason: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  name: "施設名",
  type: "施設タイプ",
  prefecture: "都道府県",
  area: "エリア",
  description: "紹介文",
  price_range: "料金",
  pet_friendly_score: "ペットフレンドリースコア",
  accepted_dog_sizes: "受入サイズ",
  cat_ok: "猫OK",
  features: "施設特徴",
};

const DIFF_FIELDS = [
  "name",
  "type",
  "prefecture",
  "area",
  "description",
  "price_range",
  "pet_friendly_score",
  "accepted_dog_sizes",
  "cat_ok",
  "features",
];

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: "pending", label: "審査中" },
  { key: "approved", label: "承認済み" },
  { key: "rejected", label: "差し戻し" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "はい" : "いいえ";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return String(value);
}

function SkeletonCard() {
  return (
    <div className="rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="mt-3 flex gap-4">
        <div className="h-4 w-24 bg-gray-100 rounded" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function AdminApprovalPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [drafts, setDrafts] = useState<FacilityDraft[]>([]);
  const [facilities, setFacilities] = useState<Record<string, Facility>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchDrafts = async (tab: TabKey) => {
    setLoading(true);
    const { data: draftRows, error } = await supabase
      .from("facility_drafts")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false });

    if (error || !draftRows) {
      setDrafts([]);
      setLoading(false);
      return;
    }

    setDrafts(draftRows as FacilityDraft[]);

    // Fetch corresponding facilities for edit drafts
    const facilityIds = draftRows
      .map((d: FacilityDraft) => d.facility_id)
      .filter((id): id is string => id !== null);

    if (facilityIds.length > 0) {
      const { data: facilityRows } = await supabase
        .from("facilities")
        .select("*")
        .in("id", facilityIds);

      if (facilityRows) {
        const map: Record<string, Facility> = {};
        for (const f of facilityRows) {
          map[f.id] = f as Facility;
        }
        setFacilities(map);
      }
    } else {
      setFacilities({});
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchDrafts(activeTab);
    }
  }, [activeTab, authLoading, user]);

  const handleApprove = async (draft: FacilityDraft) => {
    setProcessing(draft.id);
    try {
      const draftData = draft.draft_data;

      if (draft.facility_id) {
        // Edit: update existing facility
        await supabase
          .from("facilities")
          .update({ ...draftData, status: "approved" })
          .eq("id", draft.facility_id);
      } else {
        // New: insert into facilities
        await supabase.from("facilities").insert({
          ...draftData,
          owner_id: draft.owner_id,
          status: "approved",
        });
      }

      await supabase
        .from("facility_drafts")
        .update({ status: "approved" })
        .eq("id", draft.id);

      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (draft: FacilityDraft) => {
    if (!rejectionReason.trim()) return;
    setProcessing(draft.id);
    try {
      await supabase
        .from("facility_drafts")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", draft.id);

      if (draft.facility_id) {
        await supabase
          .from("facilities")
          .update({
            status: "rejected",
            rejection_reason: rejectionReason.trim(),
          })
          .eq("id", draft.facility_id);
      }

      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      setRejectingId(null);
      setRejectionReason("");
    } finally {
      setProcessing(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setRejectingId(null);
    setRejectionReason("");
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
        ログインが必要です
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">施設審査</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setExpandedId(null);
              setRejectingId(null);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Draft List */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          審査待ちの施設はありません
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => {
            const isExpanded = expandedId === draft.id;
            const isNew = draft.facility_id === null;
            const currentFacility = draft.facility_id
              ? facilities[draft.facility_id]
              : null;
            const draftData = draft.draft_data;
            const draftName =
              (draftData.name as string) || "（名称未設定）";

            return (
              <div
                key={draft.id}
                className="rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Card Header */}
                <button
                  onClick={() => toggleExpand(draft.id)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {draftName}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isNew
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {isNew ? "新規登録" : "編集"}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STATUS_BADGE[draft.status] || ""
                      }`}
                    >
                      {draft.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 flex gap-4 flex-wrap">
                    <span>
                      オーナー: {draft.owner_id.slice(0, 8)}...
                    </span>
                    <span>
                      提出日:{" "}
                      {new Date(draft.created_at).toLocaleDateString("ja-JP")}
                    </span>
                    {draft.facility_id && (
                      <span>施設ID: {draft.facility_id.slice(0, 8)}...</span>
                    )}
                  </div>
                </button>

                {/* Expanded Diff View */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {/* Diff Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 border-b">
                            <th className="text-left py-2 pr-4 w-1/4">
                              項目
                            </th>
                            <th className="text-left py-2 pr-4 w-[37.5%]">
                              現在の情報
                            </th>
                            <th className="text-left py-2 w-[37.5%]">
                              変更後
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {DIFF_FIELDS.map((field) => {
                            const currentVal = currentFacility
                              ? (currentFacility as unknown as Record<string, unknown>)[field]
                              : null;
                            const proposedVal = draftData[field];

                            if (
                              proposedVal === undefined &&
                              !isNew &&
                              currentVal === undefined
                            )
                              return null;

                            const currentStr = isNew
                              ? "（新規登録）"
                              : formatValue(currentVal);
                            const proposedStr = formatValue(proposedVal);

                            const isChanged =
                              !isNew &&
                              proposedVal !== undefined &&
                              JSON.stringify(currentVal) !==
                                JSON.stringify(proposedVal);

                            return (
                              <tr
                                key={field}
                                className={
                                  isChanged ? "bg-yellow-50" : ""
                                }
                              >
                                <td className="py-2 pr-4 font-medium text-gray-700">
                                  {FIELD_LABELS[field] || field}
                                </td>
                                <td className="py-2 pr-4 text-gray-500 whitespace-pre-wrap">
                                  {currentStr}
                                </td>
                                <td
                                  className={`py-2 whitespace-pre-wrap ${
                                    isChanged
                                      ? "text-gray-900 font-medium"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {proposedStr}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Rejection reason display for rejected drafts */}
                    {draft.status === "rejected" &&
                      draft.rejection_reason && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                          <span className="font-medium">差し戻し理由:</span>{" "}
                          {draft.rejection_reason}
                        </div>
                      )}

                    {/* Action Buttons (only for pending) */}
                    {draft.status === "pending" && (
                      <div className="mt-5">
                        {rejectingId === draft.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={rejectionReason}
                              onChange={(e) =>
                                setRejectionReason(e.target.value)
                              }
                              placeholder="差し戻し理由を入力してください"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(draft)}
                                disabled={
                                  processing === draft.id ||
                                  !rejectionReason.trim()
                                }
                                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                              >
                                {processing === draft.id
                                  ? "処理中..."
                                  : "差し戻しを確定"}
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectionReason("");
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApprove(draft)}
                              disabled={processing === draft.id}
                              className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {processing === draft.id
                                ? "処理中..."
                                : "承認"}
                            </button>
                            <button
                              onClick={() => setRejectingId(draft.id)}
                              disabled={processing === draft.id}
                              className="px-5 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              差し戻し
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
