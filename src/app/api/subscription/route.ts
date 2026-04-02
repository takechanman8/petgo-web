import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return Response.json({ error: "ログインが必要です" }, { status: 400 });
    }

    const priceId = process.env.STRIPE_PASS_PRICE_ID;
    if (!priceId) {
      return Response.json(
        { error: "サブスクリプションの設定が完了していません" },
        { status: 500 },
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      customer_email: email,
      success_url: `${origin}/pass/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pass`,
      metadata: {
        user_id: userId,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
        },
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[subscription] Error:", err);
    return Response.json(
      { error: "サブスクリプションの作成に失敗しました" },
      { status: 500 },
    );
  }
}
