# Distribution History API

API endpoint for querying ambassador distribution history with pagination.

## Endpoint

```
GET /api/ambassadors/[id]/history
```

## Parameters

### Path Parameters

- `id` (string, required): Ambassador ID (cuid format)

### Query Parameters

- `page` (number, optional): Page number (default: 1, min: 1)
- `limit` (number, optional): Items per page (default: 10, min: 1, max: 100)

## Response

### Success Response (200 OK)

```typescript
{
  distributions: Array<{
    id: string;
    recipientAddress: `0x${string}`;
    amounts: {
      ambassador: string;  // e.g., "1" (1 $PULPA)
      recipient: string;   // e.g., "5" (5 $PULPA)
    };
    transactionHash: string | null;
    status: string;  // "pending" | "success" | "failed"
    createdAt: string;  // ISO 8601 timestamp
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  ambassador: {
    id: string;
    walletAddress: string;
    displayName: string;
  };
}
```

### Error Responses

**400 Bad Request** - Invalid ambassador ID format
```json
{
  "error": "Invalid ambassador ID"
}
```

**404 Not Found** - Ambassador not found
```json
{
  "error": "Ambassador not found"
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Failed to fetch distribution history",
  "details": "Error message"
}
```

## Examples

### Basic Request

```bash
curl http://localhost:3000/api/ambassadors/clx123abc/history
```

### With Pagination

```bash
curl "http://localhost:3000/api/ambassadors/clx123abc/history?page=2&limit=20"
```

### Example Response

```json
{
  "distributions": [
    {
      "id": "clx456def",
      "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "amounts": {
        "ambassador": "1",
        "recipient": "5"
      },
      "transactionHash": "0xabc123...",
      "status": "success",
      "createdAt": "2025-01-20T10:30:00.000Z"
    },
    {
      "id": "clx789ghi",
      "recipientAddress": "0x1234567890123456789012345678901234567890",
      "amounts": {
        "ambassador": "1",
        "recipient": "5"
      },
      "transactionHash": null,
      "status": "pending",
      "createdAt": "2025-01-20T09:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "ambassador": {
    "id": "clx123abc",
    "walletAddress": "0xAmbassadorAddress...",
    "displayName": "El Frutero 🍎"
  }
}
```

## Client-Side Usage

### TypeScript Fetch Function

```typescript
import { fetchDistributionHistory } from '@/lib/api/distribution-history';

async function loadHistory(ambassadorId: string) {
  try {
    const data = await fetchDistributionHistory(ambassadorId, {
      page: 1,
      limit: 10,
    });

    console.log(`Loaded ${data.distributions.length} distributions`);
    console.log(`Total: ${data.pagination.total}`);
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}
```

### React Component

```typescript
import DistributionHistory from '@/components/ambassador/DistributionHistory';

export default function AmbassadorPage({ ambassadorId }: { ambassadorId: string }) {
  return (
    <div>
      <h1>Ambassador Dashboard</h1>
      <DistributionHistory
        ambassadorId={ambassadorId}
        itemsPerPage={10}
      />
    </div>
  );
}
```

## Features

✅ **Pagination**: Efficient pagination with configurable page size
✅ **Sorting**: Automatically sorted by date (newest first)
✅ **Type-Safe**: Full TypeScript support with type definitions
✅ **Performance**: Optimized database queries with indexes
✅ **Validation**: Input validation and error handling
✅ **Ambassador Info**: Includes ambassador details in response

## Database Query

The endpoint uses Prisma with the following optimizations:

- **Indexed queries**: Uses `ambassadorId` index for fast lookups
- **Limited fields**: Only selects necessary fields
- **Efficient counting**: Separate count query for pagination
- **Date sorting**: Uses database-level sorting

## Testing

Run the test script to verify the endpoint:

```bash
npm run test:distribution-history
```

The test script verifies:
- API availability and response format
- Pagination functionality
- Date sorting (newest first)
- Response schema validation
- Error handling (404 for invalid IDs)

## Performance Considerations

- **Default limit**: 10 items per page (configurable)
- **Maximum limit**: 100 items per page (prevents overload)
- **Database indexes**: Fast queries even with large datasets
- **Count optimization**: Total count cached per query

## Related Files

- **API Route**: `app/api/ambassadors/[id]/history/route.ts`
- **Types**: `lib/types/distribution-history.ts`
- **Client API**: `lib/api/distribution-history.ts`
- **Component**: `components/ambassador/DistributionHistory.tsx`
- **Test Script**: `scripts/test-distribution-history.ts`

## Future Enhancements

Potential improvements for future tickets:

- [ ] Filter by date range
- [ ] Filter by status (success/pending/failed)
- [ ] Filter by recipient address
- [ ] Export to CSV
- [ ] Real-time updates via WebSocket
- [ ] Caching with Redis
