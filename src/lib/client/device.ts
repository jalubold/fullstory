/** iPhone or iPad (iPadOS reports itself as a Mac with a touch screen). Browser-only. */
export function isAppleTouchDevice(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
