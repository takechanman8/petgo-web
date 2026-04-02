"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const BENEFITS = [
  {
    icon: "💰",
    title: "予約手数料割引",
    description: "すべての予約で手数料が割引されます。何度でもお得にご利用いただけます。",
  },
  {
    icon: "⚡",
    title: "優先予約枠",
    description: "人気施設の予約枠を優先的に確保。空き待ちのストレスから解放されます。",
  },
  {
    icon: "✨",
    title: "ポイント2倍",
    description: "ご利用ごとに貯まるポイントが通常の2倍。さらにお得にご利用いただけます。",
  },
];

export default function PassPage() {
  const { user, signInWithGoogle } = useAuth();
  const { isPassMember, loading: subLoading } = useSubscription(user);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "エラーが発生しました");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-8xl">🐾</div>
            <div className="absolute bottom-10 right-10 text-8xl">🐾</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] opacity-5">
              ✦
            </div>
          </div>
          <div className="relative mx-auto max-w-4xl px-4 py-20 sm:py-28 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800 mb-6">
              <span className="text-base">👑</span>
              プレミアム会員プラン
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight">
              PetGo PASSで、
              <br className="sm:hidden" />
              もっとお得に。
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              月額たったの¥480で、予約手数料の割引・優先予約枠・ポイント2倍など
              <br className="hidden sm:block" />
              PetGoをもっと便利にお使いいただける特典が満載です。
            </p>

            {/* Price */}
            <div className="mt-10 inline-flex flex-col items-center rounded-2xl bg-white shadow-lg px-10 py-8">
              <p className="text-sm text-gray-500">月額料金</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-sm text-gray-500">¥</span>
                <span className="text-5xl font-bold text-gray-900">480</span>
                <span className="text-gray-500">/月</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">税込 ・ いつでも解約可能</p>

              {isPassMember ? (
                <div className="mt-6 flex items-center gap-2 rounded-full bg-green-50 px-6 py-3 text-sm font-bold text-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  PASS会員です
                </div>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={submitting || subLoading}
                  className="mt-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-10 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "処理中..." : user ? "PetGo PASSに加入する" : "ログインして加入する"}
                </button>
              )}

              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-12">
              PASS会員の特典
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-10">
              よくある質問
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900">いつでも解約できますか？</h3>
                <p className="mt-1 text-sm text-gray-500">
                  はい、マイページからいつでも解約可能です。解約後も現在の請求期間が終了するまで特典をご利用いただけます。
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">支払い方法は？</h3>
                <p className="mt-1 text-sm text-gray-500">
                  クレジットカード（Visa, Mastercard, JCB, American Express）でのお支払いに対応しています。
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">特典はすぐに適用されますか？</h3>
                <p className="mt-1 text-sm text-gray-500">
                  はい、加入完了後すぐにすべての特典がご利用いただけます。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-10 sm:p-14 text-white">
              <h2 className="text-2xl sm:text-3xl font-bold">
                今すぐPetGo PASSを始めよう
              </h2>
              <p className="mt-3 text-amber-100">
                月額¥480で、PetGoをもっとお得に、もっと便利に。
              </p>
              {!isPassMember && (
                <button
                  onClick={handleSubscribe}
                  disabled={submitting || subLoading}
                  className="mt-8 rounded-full bg-white px-10 py-3.5 text-sm font-bold text-amber-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {submitting ? "処理中..." : "PetGo PASSに加入する"}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
