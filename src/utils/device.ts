export function isTouchDevice(): boolean {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  );
}

export function isMobileUserAgent(): boolean {
  return /android|iphone|ipad|ipod/i.test(
    navigator.userAgent.toLowerCase(),
  );
}

export function isMobileDevice(): boolean {
  return isTouchDevice() || isMobileUserAgent();
}
