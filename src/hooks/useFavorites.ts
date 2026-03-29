"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useFavorites(user: User | null) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }

    setLoading(true);
    const supabase = createClient();
    supabase
      .from("favorites")
      .select("facility_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setFavoriteIds(new Set(data.map((r) => r.facility_id)));
        }
        setLoading(false);
      });
  }, [user]);

  const toggle = useCallback(
    async (facilityId: string) => {
      if (!user) return false;

      const supabase = createClient();
      const isFav = favoriteIds.has(facilityId);

      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("facility_id", facilityId);
        if (!error) {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(facilityId);
            return next;
          });
        }
        return false;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, facility_id: facilityId });
        if (!error) {
          setFavoriteIds((prev) => new Set(prev).add(facilityId));
        }
        return true;
      }
    },
    [user, favoriteIds],
  );

  return { favoriteIds, toggle, loading };
}
