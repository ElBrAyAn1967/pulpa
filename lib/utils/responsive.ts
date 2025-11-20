/**
 * Responsive utilities for mobile-first design
 */

// Breakpoint values (matches Tailwind defaults)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Check if current viewport matches a breakpoint
 */
export function useMediaQuery(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false;

  const query = `(min-width: ${breakpoints[breakpoint]}px)`;
  return window.matchMedia(query).matches;
}

/**
 * Get current viewport size category
 */
export function getViewportSize(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'mobile';

  const width = window.innerWidth;

  if (width < breakpoints.md) return 'mobile';
  if (width < breakpoints.lg) return 'tablet';
  return 'desktop';
}

/**
 * Check if device is touch-enabled
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get safe area insets for notch/camera cutouts
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined' || !CSS.supports('padding: env(safe-area-inset-top)')) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
}

/**
 * Detect if user is on slow network
 */
export function isSlowNetwork(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }

  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) return false;

  const slowNetworkTypes = ['slow-2g', '2g', '3g'];
  return slowNetworkTypes.includes(connection.effectiveType);
}

/**
 * Get network information
 */
export function getNetworkInfo() {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return null;
  }

  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) return null;

  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}

/**
 * Check if device prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get device orientation
 */
export function getOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';

  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Viewport height accounting for mobile browser chrome
 */
export function getViewportHeight(): number {
  if (typeof window === 'undefined') return 0;

  // Use visualViewport for accurate mobile height
  if (window.visualViewport) {
    return window.visualViewport.height;
  }

  return window.innerHeight;
}

/**
 * Apply mobile-specific optimizations
 */
export function applyMobileOptimizations() {
  if (typeof document === 'undefined') return;

  // Prevent zoom on input focus (iOS)
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport && isTouchDevice()) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    );
  }

  // Add touch-action CSS for better touch handling
  document.body.style.touchAction = 'manipulation';

  // Disable pull-to-refresh on mobile
  document.body.style.overscrollBehavior = 'contain';

  // Fix 100vh on mobile (accounts for browser chrome)
  const updateViewportHeight = () => {
    document.documentElement.style.setProperty('--vh', `${getViewportHeight() * 0.01}px`);
  };

  updateViewportHeight();
  window.addEventListener('resize', updateViewportHeight);
  window.addEventListener('orientationchange', updateViewportHeight);
}

/**
 * Optimize images for network conditions
 */
export function getImageQuality(): 'high' | 'medium' | 'low' {
  const networkInfo = getNetworkInfo();

  if (!networkInfo) return 'high';

  if (networkInfo.saveData || isSlowNetwork()) {
    return 'low';
  }

  if (networkInfo.effectiveType === '4g') {
    return 'high';
  }

  return 'medium';
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for scroll/resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
