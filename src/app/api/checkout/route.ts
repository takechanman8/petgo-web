import Stripe from "stripe";
import { createServerClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { facilityId, facilityName, checkIn, checkOut, guests, petsInfo, totalPrice, nights } =
      body;

    if (!facilityId || !checkIn || !checkOut || !totalPrice) {
      return Response.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    // 施設の存在確認
    const supabase = createServerClient();
    const { data: facility, error: facilityError } = await supabase
      .from("facilities")
      .select("id, name")
      .eq("id", facilityId)
      .single();

    if (facilityError || !facility) {
      return Response.json({ error: "施設が見つかりません" }, { status: 404 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Stripe Checkout セッション作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `${facilityName} - ${nights}泊`,
              description: `${checkIn} 〜 ${checkOut} / ${guests}名 / ${petsInfo}`,
            },
            unit_amount: totalPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/reservation/success?session_id={CHECKOUT_SESSION_ID}&facility_id=${facilityId}&check_in=${checkIn}&check_out=${checkOut}&guests=${guests}&pets_info=${encodeURIComponent(petsInfo)}&total_price=${totalPrice}`,
      cancel_url: `${origin}/facility/${facilityId}`,
      metadata: {
        facility_id: facilityId,
        check_in: checkIn,
        check_out: checkOut,
        guests: String(guests),
        pets_info: petsInfo,
        total_price: String(totalPrice),
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Error:", err);
    return Response.json(
      { error: "決済セッションの作成に失敗しました" },
      { status: 500 },
    );
  }
}
