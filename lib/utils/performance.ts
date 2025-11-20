/**
 * Performance optimization utilities for mobile networks
 */

import { isSlowNetwork, getNetworkInfo } from './responsive';

/**
 * Lazy load images based on network conditions
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  options?: {
    lowQualitySrc?: string;
    placeholder?: string;
  }
) {
  const shouldUseLowQuality = isSlowNetwork();

  // Set placeholder first
  if (options?.placeholder) {
    img.src = options.placeholder;
  }

  // Use Intersection Observer for lazy loading
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const imageSrc = shouldUseLowQuality && options?.lowQualitySrc ? options.lowQualitySrc : src;

          img.src = imageSrc;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px', // Start loading 50px before visible
    }
  );

  observer.observe(img);
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, as: 'script' | 'style' | 'image' | 'font') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = url;

  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Prefetch resources for next navigation
 */
export function prefetchResource(url: string) {
  // Don't prefetch on slow networks
  if (isSlowNetwork()) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Measure and log performance metrics
 */
export function measurePerformance(metricName: string) {
  if (typeof window === 'undefined' || !('performance' in window)) return;

  return {
    start: () => {
      performance.mark(`${metricName}-start`);
    },
    end: () => {
      performance.mark(`${metricName}-end`);
      performance.measure(metricName, `${metricName}-start`, `${metricName}-end`);

      const measure = performance.getEntriesByName(metricName)[0];
      console.log(`[Performance] ${metricName}: ${measure.duration.toFixed(2)}ms`);

      return measure.duration;
    },
  };
}

/**
 * Get Core Web Vitals metrics
 */
export function getCoreWebVitals() {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  const fcp = paint.find((entry) => entry.name === 'first-contentful-paint');
  const lcp = performance.getEntriesByType('largest-contentful-paint').slice(-1)[0];

  return {
    // First Contentful Paint (good < 1.8s)
    FCP: fcp ? fcp.startTime : null,

    // Largest Contentful Paint (good < 2.5s)
    LCP: lcp ? (lcp as any).renderTime || (lcp as any).loadTime : null,

    // Time to First Byte (good < 600ms)
    TTFB: navigation ? navigation.responseStart - navigation.requestStart : null,

    // DOM Content Loaded (good < 2s)
    DCL: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : null,

    // Page Load Time (good < 3s)
    Load: navigation ? navigation.loadEventEnd - navigation.fetchStart : null,
  };
}

/**
 * Optimize initial page load
 */
export function optimizeInitialLoad() {
  // Defer non-critical scripts
  document.querySelectorAll('script[data-defer]').forEach((script) => {
    script.setAttribute('defer', '');
  });

  // Lazy load images
  document.querySelectorAll('img[data-src]').forEach((img) => {
    const imgElement = img as HTMLImageElement;
    const src = imgElement.dataset.src;
    const lowQualitySrc = imgElement.dataset.lowSrc;
    const placeholder = imgElement.dataset.placeholder;

    if (src) {
      lazyLoadImage(imgElement, src, { lowQualitySrc, placeholder });
    }
  });

  // Prefetch next page resources
  if (!isSlowNetwork()) {
    document.querySelectorAll('a[data-prefetch]').forEach((link) => {
      const href = (link as HTMLAnchorElement).href;
      if (href) {
        prefetchResource(href);
      }
    });
  }
}

/**
 * Request Idle Callback polyfill
 */
export function requestIdleCallback(callback: IdleRequestCallback): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback);
  }

  // Polyfill for Safari
  return setTimeout(() => {
    const start = Date.now();
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    });
  }, 1) as unknown as number;
}

/**
 * Cancel Idle Callback
 */
export function cancelIdleCallback(id: number) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Batch DOM updates for performance
 */
export function batchDOMUpdates(updates: (() => void)[]) {
  requestIdleCallback(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Check if page is in view (for analytics/tracking)
 */
export function isPageVisible(): boolean {
  if (typeof document === 'undefined') return false;
  return document.visibilityState === 'visible';
}

/**
 * Monitor page visibility changes
 */
export function onVisibilityChange(callback: (visible: boolean) => void) {
  if (typeof document === 'undefined') return () => {};

  const handler = () => {
    callback(isPageVisible());
  };

  document.addEventListener('visibilitychange', handler);

  return () => {
    document.removeEventListener('visibilitychange', handler);
  };
}

/**
 * Optimize for battery saving mode
 */
export function isBatterySavingMode(): Promise<boolean> {
  if ('getBattery' in navigator) {
    return (navigator as any).getBattery().then((battery: any) => {
      return battery.level < 0.2 || battery.charging === false;
    });
  }

  return Promise.resolve(false);
}

/**
 * Adaptive loading based on network and device conditions
 */
export async function getLoadingStrategy(): Promise<'high' | 'medium' | 'low'> {
  const networkInfo = getNetworkInfo();
  const isBatterySaving = await isBatterySavingMode();

  if (isBatterySaving || isSlowNetwork()) {
    return 'low';
  }

  if (networkInfo?.effectiveType === '4g' && !networkInfo.saveData) {
    return 'high';
  }

  return 'medium';
}

/**
 * Service Worker registration for offline support
 */
export function registerServiceWorker(swPath: string = '/sw.js') {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  return navigator.serviceWorker
    .register(swPath)
    .then((registration) => {
      console.log('[SW] Service Worker registered:', registration.scope);
      return registration;
    })
    .catch((error) => {
      console.error('[SW] Service Worker registration failed:', error);
      return null;
    });
}

/**
 * Cache API utilities for offline support
 */
export const cacheAPI = {
  async set(key: string, data: any, ttl: number = 3600000) {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    const cache = await caches.open('api-cache');
    const response = new Response(JSON.stringify({ data, timestamp: Date.now(), ttl }));

    await cache.put(key, response);
  },

  async get(key: string) {
    if (typeof window === 'undefined' || !('caches' in window)) return null;

    const cache = await caches.open('api-cache');
    const response = await cache.match(key);

    if (!response) return null;

    const { data, timestamp, ttl } = await response.json();

    // Check if cache is expired
    if (Date.now() - timestamp > ttl) {
      await cache.delete(key);
      return null;
    }

    return data;
  },

  async clear() {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  },
};

/**
 * Monitor performance and send analytics
 */
export function sendPerformanceMetrics() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const metrics = getCoreWebVitals();
      const networkInfo = getNetworkInfo();

      console.log('[Performance Metrics]', {
        ...metrics,
        network: networkInfo,
        timestamp: new Date().toISOString(),
      });

      // Send to analytics service if configured
      // analytics.track('performance_metrics', { ...metrics, network: networkInfo });
    }, 0);
  });
}
