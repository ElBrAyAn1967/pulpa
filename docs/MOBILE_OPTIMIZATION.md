# Mobile Optimization Guide

## Overview

Comprehensive mobile-first optimization for the Pulpa NFC Distribution system, ensuring excellent user experience on mobile devices with touch-friendly interactions and optimized performance for mobile networks.

---

## Mobile-First Strategy

### Design Principles
1. **Touch-First**: All interactive elements have minimum 44x44px tap targets
2. **Performance-First**: Optimized for 3G/4G networks with < 3s load time
3. **Responsive-First**: Mobile layouts designed before desktop
4. **Accessibility-First**: WCAG 2.1 AA compliant on all devices

### Supported Devices
- **iOS**: iPhone 12+ (iOS 15+)
- **Android**: Modern Android devices (Android 10+)
- **Screen Sizes**: 320px - 1920px width
- **Orientations**: Portrait and landscape support

---

## Responsive Utilities

### Breakpoints

```typescript
import { breakpoints, getViewportSize, useMediaQuery } from '@/lib/utils/responsive';

// Breakpoint values
const breakpoints = {
  sm: 640px,   // Small devices (phones)
  md: 768px,   // Medium devices (tablets)
  lg: 1024px,  // Large devices (laptops)
  xl: 1280px,  // Extra large devices (desktops)
  '2xl': 1536px // 2X large devices (large desktops)
};

// Usage
const isMobile = getViewportSize() === 'mobile';
const isTablet = useMediaQuery('md');
```

### Device Detection

```typescript
import { isTouchDevice, getOrientation, prefersReducedMotion } from '@/lib/utils/responsive';

// Check if device supports touch
if (isTouchDevice()) {
  // Enable touch-specific interactions
}

// Get current orientation
const orientation = getOrientation(); // 'portrait' | 'landscape'

// Respect reduced motion preference
if (prefersReducedMotion()) {
  // Disable animations
}
```

### Network Detection

```typescript
import { isSlowNetwork, getNetworkInfo } from '@/lib/utils/responsive';

// Check for slow network
if (isSlowNetwork()) {
  // Load low-quality images
  // Disable auto-play videos
  // Reduce API polling
}

// Get detailed network info
const network = getNetworkInfo();
// {
//   effectiveType: '4g',
//   downlink: 10,
//   rtt: 50,
//   saveData: false
// }
```

---

## Touch-Optimized Components

### TouchButton

Large, touch-friendly buttons with haptic feedback:

```typescript
import { TouchButton } from '@/components/ui/MobileOptimized';

<TouchButton
  variant="primary"      // 'primary' | 'secondary' | 'success' | 'danger'
  size="large"           // 'small' | 'medium' | 'large'
  fullWidth              // Full width button
  loading={isLoading}    // Loading state with spinner
  onClick={handleClick}
>
  Scan NFC
</TouchButton>
```

**Features**:
- Minimum 44x44px tap target (WCAG 2.1)
- Active press feedback (scale effect)
- Loading state with spinner
- Disabled state with opacity
- Touch ripple effect
- Haptic feedback support

### TouchInput

Mobile-optimized input fields:

```typescript
import { TouchInput } from '@/components/ui/MobileOptimized';

<TouchInput
  id="wallet-address"
  label="Wallet Address"
  value={address}
  onChange={setAddress}
  type="text"
  inputMode="text"           // Keyboard type for mobile
  autoComplete="off"
  placeholder="0x..."
  helperText="Enter your Ethereum address"
  error={error}
  required
/>
```

**Features**:
- Minimum 48px height for touch
- Mobile keyboard optimization (`inputMode` prop)
- Clear error/helper text
- Auto-complete support
- Focus ring for accessibility

### NFCScannerMobile

Enhanced NFC scanning experience:

```typescript
import NFCScannerMobile from '@/components/nfc/NFCScannerMobile';

<NFCScannerMobile
  redirectPath={(nfcId) => `/nfc/${nfcId}/distribute`}
  title="Scan Ambassador NFC"
  description="Hold your device near the NFC sticker"
  icon="👨‍🚀"
  color="blue"
  demoNfcIds={[
    { id: 'TEST123', label: 'Test NFC', description: 'Demo ambassador' }
  ]}
/>
```

**Features**:
- Large scan button (128px icon)
- Haptic feedback on scan success/error
- Orientation detection and guidance
- Bottom sheet for manual input
- NFC support detection
- Loading states with animations
- Error handling with clear messages

### MobileAlert

Touch-friendly notifications:

```typescript
import { MobileAlert } from '@/components/ui/MobileOptimized';

<MobileAlert
  type="success"              // 'success' | 'error' | 'warning' | 'info'
  title="Distribution Successful"
  message="5 $PULPA tokens sent to recipient"
  onClose={() => setAlert(null)}
/>
```

### BottomSheet

iOS/Android-style action sheets:

```typescript
import { BottomSheet } from '@/components/ui/MobileOptimized';

<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Manual Entry"
>
  {/* Form or content */}
</BottomSheet>
```

**Features**:
- Smooth slide-up animation
- Drag handle indicator
- Safe area inset support (notch)
- Backdrop with tap-to-close
- Scrollable content area

---

## Performance Optimization

### Image Optimization

```typescript
import { lazyLoadImage } from '@/lib/utils/performance';

// Lazy load images on scroll
const img = document.querySelector('img');
lazyLoadImage(img, '/high-res.jpg', {
  lowQualitySrc: '/low-res.jpg',
  placeholder: '/placeholder.jpg'
});
```

### Resource Preloading

```typescript
import { preloadResource, prefetchResource } from '@/lib/utils/performance';

// Preload critical resources
preloadResource('/fonts/inter.woff2', 'font');
preloadResource('/styles/critical.css', 'style');

// Prefetch next page (on fast networks only)
prefetchResource('/nfc/distribute');
```

### Performance Monitoring

```typescript
import { measurePerformance, getCoreWebVitals } from '@/lib/utils/performance';

// Measure operation
const perf = measurePerformance('api-call');
perf.start();
await fetchData();
const duration = perf.end(); // Logs: "[Performance] api-call: 245.32ms"

// Get Core Web Vitals
const vitals = getCoreWebVitals();
// {
//   FCP: 1234,  // First Contentful Paint (ms)
//   LCP: 2345,  // Largest Contentful Paint (ms)
//   TTFB: 456,  // Time to First Byte (ms)
//   DCL: 1890,  // DOM Content Loaded (ms)
//   Load: 2567  // Page Load Time (ms)
// }
```

### Adaptive Loading

```typescript
import { getLoadingStrategy } from '@/lib/utils/performance';

const strategy = await getLoadingStrategy();
// Returns 'high' | 'medium' | 'low'

if (strategy === 'low') {
  // Load minimal resources
  // Use low-quality images
  // Disable animations
} else if (strategy === 'high') {
  // Load full resources
  // High-quality images
  // Enable animations
}
```

### Cache API

```typescript
import { cacheAPI } from '@/lib/utils/performance';

// Cache API response
await cacheAPI.set('user-data', userData, 3600000); // 1 hour TTL

// Retrieve cached data
const cachedData = await cacheAPI.get('user-data');

// Clear cache
await cacheAPI.clear();
```

---

## Mobile-Specific CSS

### Safe Area Insets (Notch Support)

```css
/* Handle device notches/camera cutouts */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-left {
  padding-left: env(safe-area-inset-left);
}

.safe-area-right {
  padding-right: env(safe-area-inset-right);
}
```

### Viewport Height Fix (Mobile Chrome)

```css
/* Fix for mobile browser chrome hiding */
:root {
  --vh: 1vh;
}

.full-height {
  height: 100vh; /* Fallback */
  height: calc(var(--vh, 1vh) * 100);
}
```

### Touch Optimization

```css
/* Improve touch performance */
body {
  touch-action: manipulation; /* Disable double-tap zoom */
  -webkit-tap-highlight-color: transparent; /* Remove tap highlight */
  overscroll-behavior: contain; /* Disable pull-to-refresh */
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

### Large Tap Targets

```css
/* Minimum 44x44px tap targets (WCAG 2.1) */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Extra large for primary actions */
.touch-target-large {
  min-width: 56px;
  min-height: 56px;
  padding: 16px;
}
```

---

## NFC Scanning Best Practices

### Web NFC Support

- **Supported**: Chrome 89+ on Android
- **Not Supported**: iOS (Safari), Desktop browsers

### Implementation

```typescript
async function scanNFC() {
  try {
    // Check support
    if (!('NDEFReader' in window)) {
      throw new Error('Web NFC not supported');
    }

    const ndef = new NDEFReader();
    await ndef.scan();

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    ndef.addEventListener('reading', ({ serialNumber }) => {
      // Success vibration
      navigator.vibrate([100, 50, 100]);

      // Handle NFC read
      handleNFCRead(serialNumber);
    });

    ndef.addEventListener('readingerror', () => {
      // Error vibration
      navigator.vibrate([200, 100, 200]);

      // Handle error
      handleError('Failed to read NFC');
    });

  } catch (error) {
    if (error.name === 'NotAllowedError') {
      // Permission denied
    } else if (error.name === 'NotSupportedError') {
      // Device doesn't support NFC
    }
  }
}
```

### User Experience Guidelines

1. **Clear Instructions**: Show visual guide for NFC placement
2. **Feedback**: Provide haptic and visual feedback
3. **Orientation**: Guide users to hold device vertically
4. **Fallback**: Always provide manual input option
5. **Error Handling**: Clear error messages in Spanish

---

## Performance Targets

### Load Time Goals

| Network | Target | Max Acceptable |
|---------|--------|----------------|
| 4G | < 1.5s | 2.5s |
| 3G | < 2.5s | 4s |
| 2G | < 4s | 6s |

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| FCP (First Contentful Paint) | < 1.8s | 1.8s - 3s | > 3s |
| LCP (Largest Contentful Paint) | < 2.5s | 2.5s - 4s | > 4s |
| FID (First Input Delay) | < 100ms | 100ms - 300ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |

### Bundle Size Targets

- Initial JS Bundle: < 150KB (gzipped)
- CSS: < 30KB (gzipped)
- Fonts: < 50KB (WOFF2)
- Total Page Weight: < 500KB

---

## Testing Checklist

### Device Testing

- [ ] iPhone 12/13/14 (iOS 15+)
- [ ] iPhone SE (small screen)
- [ ] Samsung Galaxy S21/S22
- [ ] Google Pixel 6/7
- [ ] iPad Mini/Air (tablet)

### Orientation Testing

- [ ] Portrait mode
- [ ] Landscape mode
- [ ] Rotation transitions

### Network Testing

- [ ] 4G connection
- [ ] 3G connection
- [ ] 2G connection (Edge)
- [ ] Offline mode

### Touch Interaction Testing

- [ ] All buttons 44x44px minimum
- [ ] Scroll smoothly
- [ ] Pull-to-refresh disabled
- [ ] Double-tap zoom disabled on inputs
- [ ] Haptic feedback works

### NFC Testing (Android Chrome only)

- [ ] NFC scan works
- [ ] Permission handling
- [ ] Error handling
- [ ] Haptic feedback
- [ ] Manual input fallback

---

## Optimization Tools

### Chrome DevTools

```bash
# Lighthouse audit for mobile
npm run lighthouse -- --preset=mobile

# Network throttling
# Use DevTools > Network > Throttling > Fast 3G

# Device emulation
# Use DevTools > Toggle device toolbar (Cmd+Shift+M)
```

### Performance Monitoring

```typescript
// Add to layout.tsx or _app.tsx
import { sendPerformanceMetrics, applyMobileOptimizations } from '@/lib/utils/performance';

useEffect(() => {
  applyMobileOptimizations();
  sendPerformanceMetrics();
}, []);
```

---

## Common Issues & Solutions

### Issue: Zoom on Input Focus (iOS)

**Problem**: Page zooms when focusing inputs

**Solution**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
```

### Issue: 100vh Includes Browser Chrome

**Problem**: Full-height elements cut off by mobile browser UI

**Solution**:
```typescript
// Use custom --vh CSS variable
import { applyMobileOptimizations } from '@/lib/utils/performance';

useEffect(() => {
  applyMobileOptimizations(); // Sets --vh variable
}, []);
```

```css
.full-height {
  height: calc(var(--vh, 1vh) * 100);
}
```

### Issue: Pull-to-Refresh Interference

**Problem**: Pull-to-refresh conflicts with scrolling

**Solution**:
```css
body {
  overscroll-behavior: contain;
}
```

### Issue: Slow Network Performance

**Problem**: Page loads slowly on 3G

**Solution**:
```typescript
import { isSlowNetwork } from '@/lib/utils/responsive';

if (isSlowNetwork()) {
  // Load low-quality images
  // Disable auto-play
  // Reduce API polling frequency
}
```

---

## Resources

- [Web.dev Mobile Performance](https://web.dev/mobile/)
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Web NFC API](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API)
- [Core Web Vitals](https://web.dev/vitals/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
