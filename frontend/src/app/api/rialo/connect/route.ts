import { NextRequest, NextResponse } from "next/server";
import {
  getPlaygroundSession,
  checkPlaygroundAccount,
  generatePassword,
  PLAYGROUND_API,
} from "@/lib/rialo-playground";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, email, playgroundPassword } = body as {
      walletAddress?: string;
      email?: string;
      playgroundPassword?: string;
    };

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { success: false, error: "walletAddress is required" },
        { status: 400 },
      );
    }

    console.log(`[Rialo] Connect request for wallet: ${walletAddress}`);

    // If no password provided, check if user already has a playground account
    let isNewAccount = false;
    if (!playgroundPassword && email) {
      const check = await checkPlaygroundAccount(walletAddress, email);
      if (check.status === "exists") {
        console.log("[Rialo] Existing playground account detected, requesting password");
        return NextResponse.json({
          success: false,
          needsPassword: true,
          message: "You already have a Rialo Playground account. Enter your playground password to use the same address.",
        });
      }
      isNewAccount = check.status === "new";
    }

    // Authenticate and get session cookies
    const sessionResult = await getPlaygroundSession(
      walletAddress,
      email || undefined,
      playgroundPassword || undefined,
    );
    const cookieHeader = sessionResult.cookieHeader;
    const actualPassword = sessionResult.passwordUsed;

    // Try to generate keys first
    let rialoAddress: string | null = null;
    let balance = 0;

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
      console.log("[Rialo] Keys already exist");
    } else {
      const text = await generateRes.text();
      throw new Error(`Key generation failed (${generateRes.status}): ${text}`);
    }

    // Always load keys to get current balance
    console.log("[Rialo] Loading keys + balance");
    const loadRes = await fetch(`${PLAYGROUND_API}/keys/load`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
    });

    if (loadRes.ok) {
      const data = await loadRes.json();
      rialoAddress = data.publicKey;
      balance = parseFloat(data.balance || "0");
      console.log(`[Rialo] Address: ${rialoAddress}, Balance: ${balance}`);
    }

    const response: Record<string, unknown> = {
      success: true,
      rialoAddress,
      balance,
      playgroundPassword: actualPassword,
    };
    if (isNewAccount) {
      response.isNewAccount = true;
    }
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Rialo] Connect error: ${message}`);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
