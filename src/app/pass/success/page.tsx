"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function PassSuccessPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="flex-1 bg-gray-50">
            <div className="mx-auto max-w-2xl px-4 py-20 text-center">
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
                <p className="text-gray-500">読み込み中...</p>
              </div>
            </div>
          </main>
          <Footer />
        </>
      }
    >
      <PassSuccessContent />
    </Suspense>
  );
}

function PassSuccessContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const savedRef = useRef(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (authLoading || !user || savedRef.current) return;
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("セッション情報が不足しています");
      return;
    }

    savedRef.current = true;

    async function saveSubscription() {
      const supabase = createClient();

      // 重複チェック
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("stripe_subscription_id", sessionId)
        .maybeSingle();

      if (existing) {
        setStatus("success");
        return;
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error } = await supabase.from("subscriptions").insert({
        user_id: user!.id,
        stripe_subscription_id: sessionId,
        status: "active",
        plan: "pass",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      });

      if (error) {
        console.error("[subscription] Save error:", error);
        setStatus("error");
        setErrorMsg("サブスクリプションの保存に失敗しました。お問い合わせください。");
      } else {
        setStatus("success");
      }
    }

    saveSubscription();
  }, [user, authLoading, sessionId]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          {status === "loading" ? (
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
              <p className="text-gray-500">PetGo PASSを有効化しています...</p>
            </div>
          ) : status === "success" ? (
            <div className="space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                <span className="text-4xl">👑</span>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  PetGo PASSへようこそ！
                </h1>
                <p className="mt-2 text-gray-500">
                  PASS会員の登録が完了しました。すべての特典をお楽しみください。
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm text-left space-y-4">
                <h2 className="font-bold text-gray-900">ご利用いただける特典</h2>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-base">💰</span>
                    予約手数料割引
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-base">⚡</span>
                    優先予約枠
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-base">✨</span>
                    ポイント2倍
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 justify-center">
                <Link
                  href="/mypage"
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-light transition-colors"
                >
                  マイページで確認
                </Link>
                <Link
                  href="/"
                  className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  トップに戻る
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-10 w-10 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">エラーが発生しました</h1>
                <p className="mt-2 text-gray-500">{errorMsg}</p>
              </div>
              <Link
                href="/pass"
                className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-light transition-colors"
              >
                PetGo PASSに戻る
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
