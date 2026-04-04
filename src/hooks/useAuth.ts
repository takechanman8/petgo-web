"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const bonusCheckedRef = useRef(false);

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

      // 新規サインイン時のみ（セッション復元のINITIAL_SESSIONは除外）
      // かつこのマウントで1回だけ実行
      if (event === "SIGNED_IN" && currentUser && !bonusCheckedRef.current) {
        bonusCheckedRef.current = true;

        // 友達紹介チェック（localStorageにrefコードがある場合のみ）
        try {
          const refCode = localStorage.getItem("petgo_ref");
          if (refCode) {
            localStorage.removeItem("petgo_ref");
            const { grantReferralBonus } = await import("@/hooks/usePoints");
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
          // ignore
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
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
