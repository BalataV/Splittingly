// Webová náhrada za `applock.ts` — `npm run web` je jen nástroj pro vývoj
// (viz AGENTS.md), zámek aplikace na webu nedává smysl. Fail-open jako stub.

export async function canAuthenticate(): Promise<boolean> {
  return false;
}

export async function authenticate(reason: string): Promise<boolean> {
  void reason;
  return true;
}
