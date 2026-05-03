/**
 * clipboard.ts — PinchPad©™
 *
 * Robust clipboard utility with fallback for non-secure contexts (HTTP over LAN).
 *
 * Maintained by CrustAgent©™
 */

/**
 * Copies text to the clipboard.
 * Uses navigator.clipboard if available (Secure Context / Localhost),
 * otherwise falls back to the legacy document.execCommand('copy') pattern.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern Clipboard API (requires Secure Context or localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] Navigator API failed, falling back...', err);
    }
  }

  // 2. Fallback: Legacy execCommand('copy') with hidden textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Position off-screen so user doesn't see it
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) return true;
  } catch (err) {
    console.error('[Clipboard] Fallback copy failed:', err);
  }

  return false;
}
