"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { grantRegistrationBonus, grantReferralBonus } from "@/hooks/usePoints";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // 初回ログイン時の処理
      if (event === "SIGNED_IN" && currentUser) {
        // 会員登録ボーナス（重複チェックはgrantRegistrationBonus内で実施）
        await grantRegistrationBonus(currentUser.id);

        // 友達紹介チェック
        try {
          const refCode = localStorage.getItem("petgo_ref");
          if (refCode) {
            localStorage.removeItem("petgo_ref");
            // 紹介コードからユーザーIDを取得
            const { data: referrer } = await supabase
              .from("user_settings")
              .select("user_id")
              .eq("referral_code", refCode)
              .maybeSingle();
            if (referrer && referrer.user_id !== currentUser.id) {
              await grantReferralBonus(referrer.user_id, currentUser.id);
            }
          }
        } catch {
          // localStorage not available
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // 紹介コードをlocalStorageに保存してからログイン
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");
      if (ref) {
        localStorage.setItem("petgo_ref", ref);
      }
    } catch {
      // ignore
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signInWithGoogle, signOut };
}
