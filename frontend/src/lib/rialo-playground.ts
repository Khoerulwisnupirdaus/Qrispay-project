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

export function generatePassword(walletAddress: string): string {
  return `Rialo!${walletAddress.slice(0, 16)}#2024`;
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
 * Register the deterministic account. 201 = new account, 409 = already exists.
 * Both are acceptable outcomes.
 */
async function register(email: string, password: string, name: string): Promise<void> {
  console.log(`[Rialo] Registering account: ${email}`);
  const res = await fetch(`${PLAYGROUND_FRONTEND}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (res.status === 201) {
    const data = await res.json();
    console.log(`[Rialo] Registration success, userId: ${data.userId}`);
    return;
  }

  if (res.status === 409) {
    console.log("[Rialo] Account already exists, continuing");
    return;
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
  console.log(`[Rialo] Login success, new cookies: ${cookies.length}`);
  return cookies;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the full register + login flow and return a merged Cookie header string
 * that can be used for authenticated requests to the Rialo API.
 */
export async function getPlaygroundSession(walletAddress: string): Promise<string> {
  const email = generateEmail(walletAddress);
  const password = generatePassword(walletAddress);
  const name = `QrisPay_${walletAddress.slice(0, 8)}`;

  // Step 1 - Register (idempotent)
  await register(email, password, name);

  // Step 2 - Get CSRF token + cookies
  const { csrfToken, cookies: csrfCookies } = await fetchCsrf();

  // Step 3 - Get session cookies
  const sessionCookies = await fetchSessionCookies(
    mergeCookies(csrfCookies),
  );

  // Step 4 - Login with all accumulated cookies
  const allPreLoginCookies = mergeCookies(csrfCookies, sessionCookies);
  const loginCookies = await login(email, password, csrfToken, allPreLoginCookies);

  // Merge everything into a single Cookie header
  const finalCookieHeader = mergeCookies(csrfCookies, sessionCookies, loginCookies);
  console.log("[Rialo] Session acquired successfully");
  return finalCookieHeader;
}

export { PLAYGROUND_FRONTEND, PLAYGROUND_API };
