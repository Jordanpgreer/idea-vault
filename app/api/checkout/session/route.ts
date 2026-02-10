import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { appConfig } from "@/lib/config";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe || !appUrl) {
    return NextResponse.json({ error: "Server payment config missing" }, { status: 500 });
  }

  const { ideaId } = await request.json();
  if (!ideaId) {
    return NextResponse.json({ error: "ideaId is required" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/submit?checkout=cancel`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Idea Submission"
          },
          unit_amount: appConfig.ideaPriceInCents
        },
        quantity: 1
      }
    ],
    metadata: { ideaId }
  });

  return NextResponse.json({ ok: true, url: session.url });
}
