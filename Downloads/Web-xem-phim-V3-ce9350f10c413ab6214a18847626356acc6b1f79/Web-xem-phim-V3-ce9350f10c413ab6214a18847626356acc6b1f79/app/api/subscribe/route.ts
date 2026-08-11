import { NextRequest, NextResponse } from 'next/server';
import { getVapidKeys } from '@/lib/webpush';
import connectToDatabase from '@/lib/db';
import Subscription from '@/models/Subscription';

// GET VAPID Public Key
export async function GET() {
  try {
    const keys = getVapidKeys();
    return NextResponse.json({ publicKey: keys.publicKey });
  } catch (error) {
    console.error('Failed to get public key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST Subscribe / Save subscription
export async function POST(req: NextRequest) {
  try {
    const { subscription, movieSlug } = await req.json();

    if (!subscription || !movieSlug) {
      return NextResponse.json({ error: 'Missing subscription or movieSlug' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if subscription already exists for this movieSlug and endpoint
    const existingSub = await Subscription.findOne({
      movieSlug,
      "subscription.endpoint": subscription.endpoint
    }).lean();

    if (!existingSub) {
      await Subscription.create({
        subscription,
        movieSlug,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to subscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
