/**
 * Helper utilities for getting, copying, and sharing the live PWA application link.
 */

export function getAppUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    // Strip trailing slashes
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://ais-pre-43fuxb4i4jesdkqxrh5td2-1074731241775.asia-southeast1.run.app';
}

export async function copyAppUrlToClipboard(): Promise<boolean> {
  try {
    const url = getAppUrl();
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy app URL:', err);
    return false;
  }
}

export async function shareAppUrl(
  appTitle: string = 'DailyHishab'
): Promise<{ success: boolean; method: 'web-share' | 'clipboard' | 'whatsapp' | 'error' }> {
  const url = getAppUrl();
  const title = `${appTitle} - Smart Daily Accounting PWA`;
  const text = `Manage daily income, expenses, and ledger statements on ${appTitle} Progressive Web App. Open and install on your device:`;

  // 1. Try Native Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return { success: true, method: 'web-share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'web-share' };
      }
      console.warn('Native Web Share failed, falling back to clipboard:', err);
    }
  }

  // 2. Fallback to Clipboard Copy
  const copySuccess = await copyAppUrlToClipboard();
  if (copySuccess) {
    return { success: true, method: 'clipboard' };
  }

  return { success: false, method: 'error' };
}

export function shareAppToWhatsApp(appTitle: string = 'DailyHishab') {
  const url = getAppUrl();
  const text = encodeURIComponent(
    `📊 *${appTitle} - Smart Daily Accounting PWA*\n` +
    `Manage income, expenses, notes, and financial reports easily.\n\n` +
    `🔗 *Open App Link:* ${url}`
  );
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}
