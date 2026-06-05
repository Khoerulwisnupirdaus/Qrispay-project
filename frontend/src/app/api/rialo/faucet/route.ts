import { NextRequest, NextResponse } from "next/server";
import {
  getPlaygroundSession,
  PLAYGROUND_API,
} from "@/lib/rialo-playground";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body as { walletAddress?: string };

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { success: false, error: "walletAddress is required" },
        { status: 400 },
      );
    }

    console.log(`[Rialo] Faucet request for wallet: ${walletAddress}`);

    // Authenticate and get session cookies
    const cookieHeader = await getPlaygroundSession(walletAddress);

    // Call faucet
    console.log("[Rialo] Calling faucet endpoint");
    const faucetRes = await fetch(`${PLAYGROUND_API}/faucet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({}),
    });

    if (faucetRes.status === 201 || faucetRes.status === 200) {
      const data = await faucetRes.json();
      console.log(`[Rialo] Faucet success: sig=${data.txSignature}, amount=${data.amount}`);
      return NextResponse.json({
        success: true,
        txSignature: data.txSignature,
        amount: data.amount,
      });
    }

    const text = await faucetRes.text();

    // Handle rate-limiting or cooldown responses
    if (faucetRes.status === 429 || faucetRes.status === 400) {
      console.warn(`[Rialo] Faucet rejected (${faucetRes.status}): ${text}`);
      return NextResponse.json(
        { success: false, error: `Faucet cooldown or rate limit: ${text}` },
        { status: 429 },
      );
    }

    throw new Error(`Faucet call failed (${faucetRes.status}): ${text}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Rialo] Faucet error: ${message}`);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
