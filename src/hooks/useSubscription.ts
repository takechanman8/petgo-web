"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface Subscription {
  id: string;
  status: "active" | "cancelled" | "past_due";
  plan: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export function useSubscription(user: User | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchSubscription() {
      setLoading(true);
      const { data } = await supabase
        .from("subscriptions")
        .select("id, status, plan, current_period_start, current_period_end, created_at")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();

      setSubscription(data as Subscription | null);
      setLoading(false);
    }

    fetchSubscription();
  }, [user]);

  const isPassMember = subscription?.status === "active";

  return { subscription, isPassMember, loading };
}
