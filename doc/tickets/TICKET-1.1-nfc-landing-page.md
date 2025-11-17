# Ticket 1.1: NFC Landing Page & Routing

## Metadata

- **Epic**: [Epic 1: Ambassador Management System](./EPIC-1-ambassador-management.md)
- **Priority**: P0 (Critical Path)
- **Status**: 📋 To Do
- **Assignee**: Unassigned
- **Estimated Effort**: 2-3 hours
- **Dependencies**: None

## Description

Create the NFC landing page that serves as the entry point when users scan an NFC sticker. This page must detect whether the NFC is registered (has an ambassador) or new, and route accordingly to either the registration or distribution flow.

## User Story

**As a user scanning an NFC sticker**, I want to be routed to the correct flow (registration or distribution) based on whether the NFC is already registered, so that I have a seamless onboarding experience.

## Technical Requirements

### 1. Page Structure

Create Next.js dynamic route:
```
app/nfc/[nfcId]/page.tsx
```

### 2. NFC ID Parsing

- Extract `nfcId` from URL parameter
- Validate NFC ID format (UUID or alphanumeric)
- Store NFC ID in:
  - URL state (persistence across navigation)
  - localStorage (`pulpa_nfc_id`)
- Handle missing or malformed NFC IDs

### 3. State Detection Logic

```typescript
interface NFCState {
  nfcId: string;
  isRegistered: boolean;
  ambassador?: {
    id: string;
    displayName: string;
    walletAddress: string;
  };
  isLoading: boolean;
  error: string | null;
}
```

**Flow**:
1. Parse NFC ID from URL
2. Query API: `GET /api/nfc/[nfcId]/status`
3. If registered → Show distribution form
4. If new → Show registration form
5. If error → Show error message with retry

### 4. API Endpoint

Create status check endpoint:
```typescript
// app/api/nfc/[nfcId]/status/route.ts
GET /api/nfc/[nfcId]/status

Response:
{
  nfcId: string;
  isRegistered: boolean;
  ambassador?: {
    id: string;
    displayName: string;
    walletAddress: string;
    favoriteFruit: string;
    totalDistributions: number;
  };
}
```

### 5. Error Handling

Handle these cases:
- Invalid NFC ID format
- Network errors during status check
- NFC ID not found in database
- Malformed URL parameters

Error messages:
- "NFC ID inválido. Por favor, escanea de nuevo."
- "Error al verificar NFC. Intenta de nuevo."
- "Esta etiqueta NFC no está en el sistema."

### 6. Loading States

Show loading indicators:
- Page initial load
- API status check
- Transition to next flow

## Acceptance Criteria

- [ ] **AC1**: Page loads successfully with NFC ID from URL (`/nfc/ABC123`)
- [ ] **AC2**: State detection correctly identifies new vs registered NFCs
- [ ] **AC3**: Routes to registration form when NFC is new
- [ ] **AC4**: Routes to distribution form when NFC is registered
- [ ] **AC5**: Invalid NFC IDs show user-friendly error message
- [ ] **AC6**: NFC ID persists in localStorage across page reloads
- [ ] **AC7**: Loading states display during API calls
- [ ] **AC8**: Error states allow retry functionality
- [ ] **AC9**: Mobile-responsive design works on iOS and Android
- [ ] **AC10**: TypeScript types are properly defined

## Implementation Details

### File Structure

```
app/
├── nfc/
│   └── [nfcId]/
│       ├── page.tsx                    # Main landing page
│       └── loading.tsx                 # Loading UI
├── api/
│   └── nfc/
│       └── [nfcId]/
│           └── status/
│               └── route.ts            # Status API endpoint
components/
└── nfc/
    ├── NFCStatusChecker.tsx            # Status detection logic
    ├── NFCErrorDisplay.tsx             # Error UI
    └── NFCLoadingState.tsx             # Loading UI
lib/
└── utils/
    └── nfc.ts                          # NFC validation utilities
```

### Code Examples

#### NFC Validation Utility

```typescript
// lib/utils/nfc.ts
export function validateNFCId(nfcId: string): {
  valid: boolean;
  error?: string;
} {
  if (!nfcId || typeof nfcId !== 'string') {
    return { valid: false, error: 'NFC ID requerido' };
  }

  // UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Alphanumeric format (6-20 chars)
  const alphanumericRegex = /^[A-Za-z0-9]{6,20}$/;

  if (uuidRegex.test(nfcId) || alphanumericRegex.test(nfcId)) {
    return { valid: true };
  }

  return { valid: false, error: 'Formato de NFC ID inválido' };
}

export function storeNFCId(nfcId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulpa_nfc_id', nfcId);
  }
}

export function retrieveNFCId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pulpa_nfc_id');
  }
  return null;
}
```

#### Landing Page Component

```typescript
// app/nfc/[nfcId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { validateNFCId, storeNFCId } from '@/lib/utils/nfc';
import NFCStatusChecker from '@/components/nfc/NFCStatusChecker';
import NFCErrorDisplay from '@/components/nfc/NFCErrorDisplay';

interface NFCStatus {
  nfcId: string;
  isRegistered: boolean;
  ambassador?: {
    id: string;
    displayName: string;
    walletAddress: string;
    favoriteFruit: string;
  };
}

export default function NFCLandingPage() {
  const params = useParams();
  const router = useRouter();
  const nfcId = params.nfcId as string;

  const [status, setStatus] = useState<NFCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkNFCStatus() {
      // Validate NFC ID
      const validation = validateNFCId(nfcId);
      if (!validation.valid) {
        setError(validation.error || 'NFC ID inválido');
        setLoading(false);
        return;
      }

      // Store in localStorage
      storeNFCId(nfcId);

      try {
        // Check NFC status
        const response = await fetch(`/api/nfc/${nfcId}/status`);

        if (!response.ok) {
          throw new Error('Error al verificar NFC');
        }

        const data: NFCStatus = await response.json();
        setStatus(data);

        // Route based on registration status
        if (data.isRegistered) {
          router.push(`/nfc/${nfcId}/distribute`);
        } else {
          router.push(`/nfc/${nfcId}/register`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    checkNFCStatus();
  }, [nfcId, router]);

  if (loading) {
    return (
      <div className="page flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-foreground">Verificando NFC...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <NFCErrorDisplay
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="page flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirigiendo...</p>
    </div>
  );
}
```

#### Status API Route

```typescript
// app/api/nfc/[nfcId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateNFCId } from '@/lib/utils/nfc';

export async function GET(
  request: NextRequest,
  { params }: { params: { nfcId: string } }
) {
  try {
    const { nfcId } = params;

    // Validate NFC ID
    const validation = validateNFCId(nfcId);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check if ambassador exists for this NFC
    const ambassador = await prisma.ambassador.findUnique({
      where: { nfcId },
      select: {
        id: true,
        displayName: true,
        walletAddress: true,
        favoriteFruit: true,
        totalDistributions: true,
      },
    });

    return NextResponse.json({
      nfcId,
      isRegistered: !!ambassador,
      ambassador: ambassador || undefined,
    });
  } catch (error) {
    console.error('NFC status check error:', error);
    return NextResponse.json(
      { error: 'Error al verificar NFC' },
      { status: 500 }
    );
  }
}
```

## Testing Requirements

### Unit Tests

```typescript
// __tests__/lib/utils/nfc.test.ts
describe('validateNFCId', () => {
  it('should accept valid UUID format', () => {
    const result = validateNFCId('123e4567-e89b-12d3-a456-426614174000');
    expect(result.valid).toBe(true);
  });

  it('should accept valid alphanumeric format', () => {
    const result = validateNFCId('NFC123ABC');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid formats', () => {
    const result = validateNFCId('invalid@nfc!');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject empty strings', () => {
    const result = validateNFCId('');
    expect(result.valid).toBe(false);
  });
});
```

### Integration Tests

```typescript
// __tests__/api/nfc/status.test.ts
describe('GET /api/nfc/[nfcId]/status', () => {
  it('should return isRegistered: false for new NFC', async () => {
    const response = await fetch('/api/nfc/NEW123/status');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isRegistered).toBe(false);
    expect(data.ambassador).toBeUndefined();
  });

  it('should return isRegistered: true for registered NFC', async () => {
    // Setup: Create test ambassador
    await prisma.ambassador.create({
      data: {
        nfcId: 'TEST123',
        walletAddress: '0x...',
        displayName: 'Test Ambassador',
        favoriteFruit: '🍎',
      },
    });

    const response = await fetch('/api/nfc/TEST123/status');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isRegistered).toBe(true);
    expect(data.ambassador).toBeDefined();
  });

  it('should return 400 for invalid NFC ID', async () => {
    const response = await fetch('/api/nfc/invalid@nfc/status');
    expect(response.status).toBe(400);
  });
});
```

### Manual Testing

- [ ] Test with valid UUID NFC ID
- [ ] Test with valid alphanumeric NFC ID
- [ ] Test with invalid NFC ID format
- [ ] Test with missing NFC ID
- [ ] Test network error scenarios (offline)
- [ ] Test localStorage persistence
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test loading states
- [ ] Test error states with retry

## Design Specifications

### Loading State

```
┌─────────────────────────────┐
│                             │
│     [Spinner Animation]     │
│                             │
│    Verificando NFC...       │
│                             │
└─────────────────────────────┘
```

### Error State

```
┌─────────────────────────────┐
│          ⚠️                 │
│                             │
│   NFC ID inválido           │
│   Por favor, escanea        │
│   de nuevo                  │
│                             │
│   [Reintentar Button]       │
│                             │
└─────────────────────────────┘
```

### Success State (Redirect)

```
┌─────────────────────────────┐
│                             │
│    Redirigiendo...          │
│                             │
└─────────────────────────────┘
```

## Performance Targets

- [ ] Page load time < 500ms
- [ ] API status check < 300ms
- [ ] Transition to next page < 200ms
- [ ] Total time to action < 1 second

## Security Considerations

- [ ] Validate NFC ID format server-side
- [ ] Rate limit API endpoint (10 requests/minute per IP)
- [ ] Sanitize NFC ID input
- [ ] No sensitive data in URL or localStorage
- [ ] HTTPS only in production

## Accessibility

- [ ] Loading states announced by screen readers
- [ ] Error messages readable by screen readers
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Focus management for retry button
- [ ] Touch targets ≥ 44x44px for mobile

## Definition of Done

- [ ] Code implemented and reviewed
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Manual testing completed on iOS and Android
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] TypeScript types defined
- [ ] Documentation updated
- [ ] Performance targets met
- [ ] Security review completed
- [ ] Accessibility requirements met
- [ ] Deployed to staging environment
- [ ] Product owner approval

## Notes

- Keep the page simple - this is just routing logic
- Focus on fast state detection (< 1 second)
- Mobile-first design (NFC scanning is mobile-centric)
- Use Frutero App color palette for consistency
- No authentication required at this stage
- NFC ID validation should be identical on client and server
