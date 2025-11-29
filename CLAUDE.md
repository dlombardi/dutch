# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Evn is a Splitwise alternative for tracking group expenses and settlements. It's a Turborepo monorepo with three apps sharing a common package.

## Commands

```bash
# Development (run all apps)
npm run dev

# Run individual apps
npm run mobile        # Expo dev server
npm run mobile:ios    # iOS simulator
npm run api           # NestJS API (port 3001)
npm run web           # Vite React web app

# Build & Quality
npm run build         # Build all apps
npm run lint          # Lint all apps
npm run check-types   # TypeScript checking

# API Testing
cd apps/api && npm test              # Run all API tests
cd apps/api && npm test -- --watch   # Watch mode
cd apps/api && npm test -- auth      # Run specific test file
```

## Architecture

### Monorepo Structure

- **apps/api** - NestJS backend with WebSocket support (TypeORM, PostgreSQL, Socket.IO)
- **apps/mobile** - Expo/React Native app with expo-router
- **apps/web** - Vite React PWA
- **packages/shared** - Business logic shared across all apps (types, calculations, constants)

### Mobile State Management (TanStack Query + Zustand Hybrid)

The mobile app uses a hybrid approach:
- **TanStack React Query** (`hooks/queries/`, `hooks/mutations/`) - Server state, caching, API calls
- **Zustand stores** (`stores/`) - Client state, auth, offline sync

Query hooks wait for auth hydration via `_hasHydrated` flag before making API calls.

### API Architecture

NestJS modules in `apps/api/src/`:
- `auth/` - Magic link + guest authentication
- `groups/` - Group CRUD + balance calculations
- `expenses/` - Expense CRUD with multi-currency support
- `settlements/` - Settlement tracking
- `currency/` - Exchange rate service
- `sync/` - WebSocket gateway for real-time updates

### Shared Package

`@evn/shared` exports:
- `types/` - TypeScript interfaces for all entities
- `calculations/` - Expense splitting algorithms, debt simplification
- `currencies.ts` - Currency formatting utilities
- `constants.ts` - App-wide constants

### Auth Flow

The mobile app uses a token getter pattern to avoid circular dependencies:
```typescript
// stores/authStore.ts registers a getter
registerTokenGetter(() => useAuthStore.getState().accessToken);

// lib/api.ts reads token through the getter
const accessToken = getAccessToken?.() ?? null;
```

### Real-time Sync

WebSocket gateway (`sync/sync.gateway.ts`) broadcasts events to group rooms. Clients join rooms via `joinGroup` message.
