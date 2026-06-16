// Rialo Playground shared helpers.
// Stateless auth flow: register (idempotent) -> fetch CSRF -> fetch session cookies -> login.
// Every serverless invocation re-authenticates so no persistent cookie store is needed.

const PLAYGROUND_FRONTEND = "https://playground.rialo.io";
const PLAYGROUND_API = "https://api.playground.rialo.io";

// ---------------------------------------------------------------------------
// Deterministic credentials derived from wallet address
// ---------------------------------------------------------------------------

export function generateEmail(walletAddress: string): string {
  return `rialo_${walletAddress.slice(0, 12).toLowerCase()}@qrispay.app`;
}

export function generateLegacyPassword(walletAddress: string): string {
  return `Rialo!${walletAddress.slice(0, 16)}#2024`;
}

export function generatePassword(walletAddress: string): string {
  // A simple synchronous hash function to make the password unguessable from just the address
  let hash1 = 0x811c9dc5;
  let hash2 = 0x811c9dc5;
  const str = walletAddress + "QrisPay_Secure_Salt_2026!";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 ^= char;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= char;
    hash2 = Math.imul(hash2, 0x1000193);
  }
  const h1Str = Math.abs(hash1).toString(36);
  const h2Str = Math.abs(hash2).toString(36).toUpperCase();
  return `Rp!${h1Str}${h2Str}#`;
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

/**
 * Extract raw Set-Cookie values from a fetch Response and return them as an
 * array of "name=value" strings (stripping attributes like Path, Domain, etc).
 */
function extractCookies(response: Response): string[] {
  const cookies: string[] = [];
  // Headers.getSetCookie() is available in Node 18.15+ and all modern runtimes.
  const setCookieHeaders =
    (response.headers as unknown as { getSetCookie?: () => string[] })
      .getSetCookie?.() ?? [];

  for (const header of setCookieHeaders) {
    // Take only the name=value portion before the first semicolon.
    const nameValue = header.split(";")[0].trim();
    if (nameValue) {
      cookies.push(nameValue);
    }
  }
  return cookies;
}

/**
 * Merge multiple cookie arrays into a single Cookie header string,
 * de-duplicating by cookie name (last value wins).
 */
function mergeCookies(...arrays: string[][]): string {
  const map = new Map<string, string>();
  for (const arr of arrays) {
    for (const entry of arr) {
      const eqIdx = entry.indexOf("=");
      if (eqIdx > 0) {
        const name = entry.slice(0, eqIdx);
        map.set(name, entry);
      }
    }
  }
  return Array.from(map.values()).join("; ");
}

// ---------------------------------------------------------------------------
// Auth flow
// ---------------------------------------------------------------------------

/**
 * Register the account. Returns 'new' if just created, 'exists' if already registered.
 */
async function register(email: string, password: string, name: string): Promise<"new" | "exists"> {
  console.log(`[Rialo] Registering account: ${email}`);
  const res = await fetch(`${PLAYGROUND_FRONTEND}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (res.status === 201) {
    const data = await res.json();
    console.log(`[Rialo] Registration success, userId: ${data.userId}`);
    return "new";
  }

  if (res.status === 409) {
    console.log("[Rialo] Account already exists");
    return "exists";
  }

  const text = await res.text();
  throw new Error(`[Rialo] Registration failed (${res.status}): ${text}`);
}

/**
 * Fetch the CSRF token and its associated cookies.
 */
async function fetchCsrf(): Promise<{ csrfToken: string; cookies: string[] }> {
  console.log("[Rialo] Fetching CSRF token");
  const res = await fetch(`${PLAYGROUND_FRONTEND}/api/auth/csrf`, {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Rialo] CSRF fetch failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const cookies = extractCookies(res);
  console.log(`[Rialo] CSRF token received, cookies: ${cookies.length}`);
  return { csrfToken: data.csrfToken, cookies };
}

/**
 * Hit the session endpoint to collect additional cookies (csrf-token, callback-url).
 */
async function fetchSessionCookies(existingCookies: string): Promise<string[]> {
  console.log("[Rialo] Fetching session cookies");
  const res = await fetch(`${PLAYGROUND_FRONTEND}/api/auth/session`, {
    method: "GET",
    headers: { Cookie: existingCookies },
  });

  const cookies = extractCookies(res);
  console.log(`[Rialo] Session cookies received: ${cookies.length}`);
  return cookies;
}

/**
 * Perform the credentials login. The endpoint returns a 302 redirect and sets
 * the session token cookie. We use redirect:'manual' to capture it.
 */
async function login(
  email: string,
  password: string,
  csrfToken: string,
  cookieHeader: string,
): Promise<string[]> {
  console.log("[Rialo] Logging in");

  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    json: "true",
  });

  const res = await fetch(
    `${PLAYGROUND_FRONTEND}/api/auth/callback/credentials`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: body.toString(),
      redirect: "manual",
    },
  );

  // 302 is the expected success status.
  if (res.status !== 302 && res.status !== 200) {
    const text = await res.text();
    throw new Error(`[Rialo] Login failed (${res.status}): ${text}`);
  }

  const cookies = extractCookies(res);

  // Verify we actually got a session token - if not, password was wrong
  const hasSession = cookies.some(c => c.includes("authjs.session-token"));
  if (!hasSession) {
    throw new Error(`[Rialo] Login failed: no session token received (wrong password?)`);
  }

  console.log(`[Rialo] Login success, new cookies: ${cookies.length}`);
  return cookies;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if a user's email already has a playground account.
 * Returns 'new' if we just registered them (auto), 'exists' if they had one already.
 */
export async function checkPlaygroundAccount(
  walletAddress: string,
  userEmail?: string,
): Promise<{ status: "new" | "exists"; email: string }> {
  const password = generatePassword(walletAddress);
  const name = `QrisPay_${walletAddress.slice(0, 8)}`;
  const email = userEmail || generateEmail(walletAddress);

  const result = await register(email, password, name);
  return { status: result, email };
}

/**
 * Run the full register + login flow and return a merged Cookie header string.
 *
 * - If playgroundPassword is provided, use it with the user's email (for returning users).
 * - If userEmail is provided (without playgroundPassword), try our deterministic password.
 * - If login fails, fall back to deterministic email.
 */
export async function getPlaygroundSession(
  walletAddress: string,
  userEmail?: string,
  playgroundPassword?: string,
): Promise<{ cookieHeader: string; passwordUsed: string }> {
  const name = `QrisPay_${walletAddress.slice(0, 8)}`;

  // Option 1: user provided their playground password
  if (userEmail && playgroundPassword) {
    const cookieHeader = await attemptSession(userEmail, playgroundPassword, name);
    return { cookieHeader, passwordUsed: playgroundPassword };
  }

  // Option 2: try user email with our deterministic passwords
  if (userEmail) {
    const ourPassword = generatePassword(walletAddress);
    try {
      const cookieHeader = await attemptSession(userEmail, ourPassword, name);
      return { cookieHeader, passwordUsed: ourPassword };
    } catch {
      console.log("[Rialo] Login with new password failed, trying legacy password");
      const legacyPw = generateLegacyPassword(walletAddress);
      try {
        const cookieHeader = await attemptSession(userEmail, legacyPw, name);
        return { cookieHeader, passwordUsed: legacyPw };
      } catch {
        console.log("[Rialo] Login with user email failed completely, falling back to deterministic email");
      }
    }
  }

  // Option 3: fallback to deterministic email (always works)
  const deterministicEmail = generateEmail(walletAddress);
  const password = generatePassword(walletAddress);
  try {
    const cookieHeader = await attemptSession(deterministicEmail, password, name);
    return { cookieHeader, passwordUsed: password };
  } catch {
    console.log("[Rialo] Deterministic login failed, trying legacy password");
    const legacyPw = generateLegacyPassword(walletAddress);
    const cookieHeader = await attemptSession(deterministicEmail, legacyPw, name);
    return { cookieHeader, passwordUsed: legacyPw };
  }
}

/**
 * Attempt a full register + login session with given credentials.
 * Throws if login fails (e.g. password mismatch).
 */
async function attemptSession(email: string, password: string, name: string): Promise<string> {
  await register(email, password, name);

  const { csrfToken, cookies: csrfCookies } = await fetchCsrf();

  const sessionCookies = await fetchSessionCookies(
    mergeCookies(csrfCookies),
  );

  const allPreLoginCookies = mergeCookies(csrfCookies, sessionCookies);
  const loginCookies = await login(email, password, csrfToken, allPreLoginCookies);

  const finalCookieHeader = mergeCookies(csrfCookies, sessionCookies, loginCookies);
  console.log(`[Rialo] Session acquired for ${email}`);
  return finalCookieHeader;
}

export { PLAYGROUND_FRONTEND, PLAYGROUND_API };

