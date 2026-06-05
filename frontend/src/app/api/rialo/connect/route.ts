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

    console.log(`[Rialo] Connect request for wallet: ${walletAddress}`);

    // Authenticate and get session cookies
    const cookieHeader = await getPlaygroundSession(walletAddress);

    // Try to generate keys first
    let rialoAddress: string | null = null;

    console.log("[Rialo] Generating keys");
    const generateRes = await fetch(`${PLAYGROUND_API}/keys/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({}),
    });

    if (generateRes.status === 201) {
      const data = await generateRes.json();
      rialoAddress = data.publicKey;
      console.log(`[Rialo] Keys generated: ${rialoAddress}`);
    } else if (generateRes.status === 409 || generateRes.status === 400) {
      // Keys already exist, load them instead
      console.log("[Rialo] Keys already exist, loading");
      const loadRes = await fetch(`${PLAYGROUND_API}/keys/load`, {
        method: "GET",
        headers: { Cookie: cookieHeader },
      });

      if (!loadRes.ok) {
        const text = await loadRes.text();
        throw new Error(`Failed to load keys (${loadRes.status}): ${text}`);
      }

      const data = await loadRes.json();
      rialoAddress = data.publicKey;
      console.log(`[Rialo] Keys loaded: ${rialoAddress}`);
    } else {
      const text = await generateRes.text();
      throw new Error(`Key generation failed (${generateRes.status}): ${text}`);
    }

    return NextResponse.json({
      success: true,
      rialoAddress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Rialo] Connect error: ${message}`);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
