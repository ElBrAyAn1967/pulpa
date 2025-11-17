# Epic 1: Ambassador Management System

## Epic Overview

Build the complete ambassador registration, profile management, and identity system for $PULPA NFC Distribution.

## Business Value

Enable ambassadors to register their NFC stickers, create profiles with fruit emoji avatars, and track their distribution statistics. This is the foundation for the entire distribution system.

## User Stories

- **As an ambassador**, I need to scan an NFC sticker for the first time and register my wallet
- **As an ambassador**, I want to see my profile with distribution statistics
- **As an ambassador**, I want my identity represented by a fruit emoji avatar

## Technical Stack

- **Frontend**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4 (Frutero App color palette)
- **Blockchain**: Wagmi v2, Viem, RainbowKit
- **Database**: PostgreSQL with Prisma
- **Chain**: Optimism Mainnet (Chain ID: 10)

## Epic Scope

### In Scope
- NFC landing page and routing logic
- Ambassador registration form with wallet/ENS validation
- Fruit emoji avatar selection system
- Ambassador database schema and API
- Ambassador profile display component
- Real-time statistics and balance display

### Out of Scope
- Token distribution functionality (Epic 2)
- Admin dashboard (Epic 3)
- Analytics and indexing (Epic 3)

## Success Metrics

- [ ] Ambassadors can register via NFC scan in < 2 minutes
- [ ] 100% of registrations include valid wallet addresses
- [ ] Profile displays update in real-time
- [ ] Mobile-responsive design works on iOS and Android
- [ ] ENS resolution works correctly on mainnet

## Dependencies

- Existing $PULPA token contract on Optimism
- RainbowKit wallet connection
- PostgreSQL database setup
- Prisma ORM configuration

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ENS resolution slow/fails | High | Cache results, show loading states |
| NFC ID collisions | Medium | Use UUIDs, validate uniqueness |
| Wallet validation errors | Medium | Comprehensive error messages |
| Mobile compatibility issues | High | Test on multiple devices early |

## Related Tickets

- [Ticket 1.1: NFC Landing Page & Routing](./TICKET-1.1-nfc-landing-page.md)
- [Ticket 1.2: Ambassador Registration Form](./TICKET-1.2-ambassador-registration.md)
- [Ticket 1.3: Ambassador Database Schema](./TICKET-1.3-ambassador-schema.md)
- [Ticket 1.4: Ambassador Registration API](./TICKET-1.4-ambassador-api.md)
- [Ticket 1.5: Ambassador Profile Component](./TICKET-1.5-ambassador-profile.md)

## Timeline

**Total Estimated Effort**: 16-20 hours

- Week 1: Tickets 1.1, 1.2, 1.3 (Core registration flow)
- Week 2: Tickets 1.4, 1.5 (API and profile display)

## Notes

- Remove all references to Scaffold-ETH 2 (use native Wagmi/Viem)
- Use Frutero App color palette for UI consistency
- Focus on mobile-first design (NFC scanning is mobile)
- Implement proper TypeScript types throughout
