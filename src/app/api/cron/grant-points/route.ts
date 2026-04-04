import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Use service role key for server-side cron (bypasses RLS)
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function POST(request: Request) {
  // Simple auth check via secret header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  // Find confirmed reservations where checkout has passed and points not yet granted
  const { data: pendingReservations, error: fetchError } = await supabase
    .from("reservations")
    .select("id, user_id, total_price, facility_id, points_used")
    .eq("status", "confirmed")
    .eq("points_granted", false)
    .lt("check_out_date", today);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!pendingReservations || pendingReservations.length === 0) {
    return NextResponse.json({ granted: 0, message: "No pending reservations" });
  }

  let grantedCount = 0;

  for (const res of pendingReservations) {
    const basePoints = Math.max(1, Math.round(res.total_price * 0.01));

    // Check if user is a PASS member for 2x bonus
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", res.user_id)
      .eq("status", "active")
      .maybeSingle();

    const points = sub ? basePoints * 2 : basePoints;
    const refId = `booking_${res.id}`;

    // Duplicate check
    const { data: existing } = await supabase
      .from("point_history")
      .select("id")
      .eq("user_id", res.user_id)
      .eq("reason", "booking_bonus")
      .eq("reference_id", refId)
      .maybeSingle();

    if (existing) {
      // Already granted, just update the flag
      await supabase
        .from("reservations")
        .update({ points_granted: true })
        .eq("id", res.id);
      continue;
    }

    // Insert point history
    const { error: historyError } = await supabase.from("point_history").insert({
      user_id: res.user_id,
      points,
      type: "earned",
      reason: "booking_bonus",
      reference_id: refId,
    });

    if (historyError) continue;

    // Update user_points total
    const { data: userPoints } = await supabase
      .from("user_points")
      .select("total_points")
      .eq("user_id", res.user_id)
      .maybeSingle();

    if (userPoints) {
      await supabase
        .from("user_points")
        .update({ total_points: userPoints.total_points + points })
        .eq("user_id", res.user_id);
    } else {
      await supabase
        .from("user_points")
        .insert({ user_id: res.user_id, total_points: points });
    }

    // Mark reservation as points granted
    await supabase
      .from("reservations")
      .update({ points_granted: true })
      .eq("id", res.id);

    grantedCount++;
  }

  return NextResponse.json({
    granted: grantedCount,
    total: pendingReservations.length,
    message: `Granted points for ${grantedCount} reservations`,
  });
}
