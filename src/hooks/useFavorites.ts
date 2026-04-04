"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const LS_KEY = "petgo_guest_favorites";

function getGuestFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveGuestFavorites(ids: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

export function useFavorites(user: User | null) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showNudge, setShowNudge] = useState(false);

  // Load favorites: from DB if logged in, from localStorage if guest
  useEffect(() => {
    if (user) {
      setLoading(true);
      const supabase = createClient();

      // Migrate guest favorites to DB on login
      const guestFavs = getGuestFavorites();
      const migrationPromise = guestFavs.size > 0
        ? (async () => {
            for (const fid of guestFavs) {
              await supabase
                .from("favorites")
                .upsert({ user_id: user.id, facility_id: fid }, { onConflict: "user_id,facility_id" });
            }
            localStorage.removeItem(LS_KEY);
          })()
        : Promise.resolve();

      migrationPromise.then(() =>
        supabase
          .from("favorites")
          .select("facility_id")
          .eq("user_id", user.id)
          .then(({ data }) => {
            if (data) {
              setFavoriteIds(new Set(data.map((r) => r.facility_id)));
            }
            setLoading(false);
          })
      );
    } else {
      const guest = getGuestFavorites();
      setFavoriteIds(guest);
      setShowNudge(guest.size >= 3);
    }
  }, [user]);

  const toggle = useCallback(
    async (facilityId: string) => {
      if (user) {
        // Logged-in: use DB
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
      } else {
        // Guest: use localStorage
        const isFav = favoriteIds.has(facilityId);
        const next = new Set(favoriteIds);
        if (isFav) {
          next.delete(facilityId);
        } else {
          next.add(facilityId);
        }
        setFavoriteIds(next);
        saveGuestFavorites(next);
        setShowNudge(next.size >= 3);
        return !isFav;
      }
    },
    [user, favoriteIds],
  );

  const dismissNudge = useCallback(() => setShowNudge(false), []);

  return { favoriteIds, toggle, loading, showNudge, dismissNudge };
}
