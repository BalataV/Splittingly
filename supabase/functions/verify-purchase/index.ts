// Ověření účtenky za Pro a zápis `is_pro` na profil.
//
// Tohle je JEDINÉ místo, které smí Pro zapnout. Klient si ho nastavit
// nemůže — kdyby mohl, stačilo by appku odchytit proxy a mít ho zdarma.
// A hlavně: nákup na Androidu o sobě Applu nic neřekne, takže by se Pro
// nepřeneslo na iPhone téhož člověka. Pravdu drží profil, ne telefon.
//
// Nasazení (CLI je devDependency, globálně se instalovat nesmí):
//   npx supabase login
//   npx supabase link --project-ref aqikqephinmelmrbsage
//   npm run fn:deploy
//
// Tajemství se dají nastavit i v Dashboardu (Edge Functions → Secrets)
// a je to lepší cesta — soukromý klíč se pak neuloží do historie shellu.
//
//   # Android — servisní účet s právem "View financial data" v Play Console
//   supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='{...celý JSON...}'
//   supabase secrets set ANDROID_PACKAGE_NAME='com.balata.splittingly'
//
//   # iOS — klíč z App Store Connect → Users and Access → Integrations
//   supabase secrets set APPLE_API_KEY_P8="$(cat AuthKey_XXXX.p8)"
//   supabase secrets set APPLE_API_KEY_ID='XXXXXXXXXX'
//   supabase secrets set APPLE_API_ISSUER_ID='xxxxxxxx-xxxx-...'
//   supabase secrets set APPLE_BUNDLE_ID='com.balata.splittingly'
//
// Dokud tajemství nejsou nastavená, ověření vrací `false` a Pro se
// nezapne. To je záměr: raději nefunkční nákup než Pro zadarmo.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const PRODUCT_ID = 'splittingly_pro';

/**
 * Klíče projektu.
 *
 * `SUPABASE_ANON_KEY` a `SUPABASE_SERVICE_ROLE_KEY` jsou v Dashboardu
 * označené jako Deprecated — nahrazují je `SUPABASE_PUBLISHABLE_KEYS`
 * a `SUPABASE_SECRET_KEYS`, což jsou JSON slovníky, ne holé řetězce.
 * Zatím fungují obě sady, ale až ty staré zmizí, přestala by funkce
 * ověřovat nákupy a Pro by se nikomu nezapnulo. Bereme napřed nové,
 * staré zůstávají jako záloha.
 */
function projectKey(newName: string, oldName: string): string {
  const raw = Deno.env.get(newName);
  if (raw) {
    try {
      const dict = JSON.parse(raw);
      // Slovník má podobu { "název": "klíč", … } — bereme první hodnotu.
      const first = Object.values(dict).find((v) => typeof v === 'string');
      if (typeof first === 'string' && first) return first;
    } catch {
      // Není to JSON? Pak je to rovnou klíč.
      return raw;
    }
  }
  return Deno.env.get(oldName) ?? '';
}

const ANON_KEY = () => projectKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
const SECRET_KEY = () => projectKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');

type Payload = {
  platform: 'ios' | 'android';
  productId: string;
  receipt: string;
};

// ------------------------------------------------------------------ Apple
//
// `react-native-iap` v16 posílá z iOSu podepsané JWS ze StoreKit 2, ne
// starou base64 účtenku pro `verifyReceipt`. Ověřit se dá dvěma cestami:
//
//   a) rozebrat podpis JWS a ověřit řetěz certifikátů až po kořenovou
//      autoritu Applu — správné, ale je to ruční parsování X.509,
//   b) přečíst z JWS jen `transactionId` a zeptat se na něj App Store
//      Server API.
//
// Bereme (b). Odpověď přijde po ověřeném TLS přímo od Applu, takže
// důvěru nese spojení, ne náš vlastní kryptografický kód — a o jeden
// vlastnoručně psaný ověřovač podpisu je na světě míň.

const APPLE_PROD = 'https://api.storekit.itunes.apple.com/inApps/v1';
const APPLE_SANDBOX = 'https://api.storekit-sandbox.itunes.apple.com/inApps/v1';

/** Tělo JWS bez ověření podpisu — slouží JEN k vytažení transactionId. */
function decodeJwsPayload(jws: string): any | null {
  const parts = jws.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(pad), (ch) => ch.charCodeAt(0)),
    ));
  } catch {
    return null;
  }
}

/** Podepsaný token pro App Store Server API (ES256, klíč z App Store Connect). */
async function appleApiToken(): Promise<string | null> {
  const keyP8 = Deno.env.get('APPLE_API_KEY_P8');
  const keyId = Deno.env.get('APPLE_API_KEY_ID');
  const issuer = Deno.env.get('APPLE_API_ISSUER_ID');
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID');
  if (!keyP8 || !keyId || !issuer || !bundleId) return null;

  const now = Math.floor(Date.now() / 1000);
  const b64u = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsigned = `${b64u({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.`
    + `${b64u({ iss: issuer, iat: now, exp: now + 1800, aud: 'appstoreconnect-v1', bid: bundleId })}`;

  const pem = keyP8.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '');
  const der = Uint8Array.from(atob(pem), (ch) => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned),
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${unsigned}.${sigB64}`;
}

/**
 * Sandbox se zkouší, až když produkce vrátí 404.
 *
 * Nákupy z TestFlightu a od recenzenta Applu chodí VŽDY ze sandboxu.
 * Kdyby se braly jako neplatné, kontrola v App Storu appku zamítne
 * s tím, že jim nákup nefunguje.
 */
async function verifyApple(jws: string): Promise<boolean> {
  const payload = decodeJwsPayload(jws);
  const transactionId = payload?.transactionId;
  if (!transactionId) return false;

  const token = await appleApiToken();
  if (!token) return false;
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID');

  for (const base of [APPLE_PROD, APPLE_SANDBOX]) {
    const res = await fetch(`${base}/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) continue;   // v tomhle prostředí neexistuje
    if (!res.ok) return false;

    const body = await res.json();
    const info = decodeJwsPayload(body?.signedTransactionInfo ?? '');
    if (!info) return false;
    // `revocationDate` má vrácený nebo stornovaný nákup — Pro pak nepatří.
    return info.productId === PRODUCT_ID
      && info.bundleId === bundleId
      && !info.revocationDate;
  }
  return false;
}

// ----------------------------------------------------------------- Google

/** Přístupový token pro Play Developer API, podepsaný servisním účtem. */
async function googleAccessToken(): Promise<string | null> {
  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!raw) return null;
  const sa = JSON.parse(raw);

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsigned = `${b64(header)}.${b64(claim)}`;

  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '');
  const der = Uint8Array.from(atob(pem), (ch) => ch.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${sigB64}`,
    }),
  });
  const json = await res.json();
  return json?.access_token ?? null;
}

/**
 * `purchaseState: 0` = zaplaceno. 1 je zrušeno, 2 čeká na doplacení
 * (u nás třeba hotovostní platba přes Play). Pro se zapíná jen na nule.
 */
async function verifyGoogle(token: string): Promise<boolean> {
  const pkg = Deno.env.get('ANDROID_PACKAGE_NAME') ?? '';
  const access = await googleAccessToken();
  if (!access || !pkg) return false;

  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}`
    + `/purchases/products/${PRODUCT_ID}/tokens/${encodeURIComponent(token)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
  if (!res.ok) return false;
  const data = await res.json();
  return data?.purchaseState === 0;
}

// ------------------------------------------------------------------ vstup

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  // Kdo nákup uplatňuje, poznáme z tokenu, ne z těla požadavku — jinak by
  // šlo cizí účtenku zapsat na vlastní profil.
  const auth = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    ANON_KEY(),
    { global: { headers: { Authorization: auth } } },
  );
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return Response.json({ isPro: false, error: 'unauthenticated' }, { status: 401 });

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ isPro: false, error: 'bad payload' }, { status: 400 });
  }
  if (payload.productId !== PRODUCT_ID || !payload.receipt) {
    return Response.json({ isPro: false, error: 'unknown product' }, { status: 400 });
  }

  const valid = payload.platform === 'ios'
    ? await verifyApple(payload.receipt)
    : await verifyGoogle(payload.receipt);

  if (!valid) return Response.json({ isPro: false, error: 'invalid receipt' }, { status: 200 });

  // Zápis jde SERVISNÍM klíčem: profil si `is_pro` sám měnit nesmí,
  // jinak by na tomhle ověřování nezáleželo.
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY());
  const { error } = await admin
    .from('profiles')
    .update({ is_pro: true, pro_since: new Date().toISOString() })
    .eq('id', user.id);
  if (error) return Response.json({ isPro: false, error: 'write failed' }, { status: 500 });

  return Response.json({ isPro: true });
});
