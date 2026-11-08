/** iPhone or iPad (iPadOS reports itself as a Mac with a touch screen). Browser-only. */
export function isAppleTouchDevice(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Phones and tablets: iOS (iPhone, iPad) and Android. Browser-only. */
export function isMobileDevice(): boolean {
  return isAppleTouchDevice() || /Android/i.test(navigator.userAgent);
}
