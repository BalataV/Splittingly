// Webová náhrada za `appicon.ts` — ikona aplikace se na webu nemění.

export function supportsAltIcons(): boolean {
  return false;
}

export async function setIcon(key: string | null): Promise<void> {
  void key;
}
