# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Beads Task Management

This project uses **beads** for issue tracking. All agentic work should use beads to track tasks, progress, and completion.

### Session Start Protocol

Before starting any work:

```bash
# 1. Check for existing open issues
bd list --status open

# 2. Find work ready to start (no blockers)
bd ready

# 3. Review an issue's dependencies before starting
bd show <issue-id>
bd dep tree <issue-id>

# 4. Mark issue as in progress
bd update <issue-id> --status in_progress
```

### During Work Protocol

While working on tasks:

```bash
# Create new issues for discovered work
bd create "Issue title" --type <bug|feature|task|chore>
bd create "Issue title" --priority <0-4>  # 0 is highest

# Add dependencies when work depends on other issues
bd dep add <this-issue> <depends-on-issue>

# Update status when blocked
bd update <issue-id> --status blocked
bd comments <issue-id> "Reason for block"

# Add progress notes
bd comments <issue-id> "Progress update"
```

### Completion Protocol

When finishing work:

```bash
# 1. Close completed issues
bd close <issue-id>

# 2. Sync changes to remote
bd sync

# 3. Verify no orphaned in-progress issues
bd list --status in_progress
```

### Slash Commands Reference

| Command              | Purpose                  |
| -------------------- | ------------------------ |
| `/beads:list`        | List issues with filters |
| `/beads:create`      | Create new issue         |
| `/beads:show <id>`   | Show issue details       |
| `/beads:update <id>` | Update issue status      |
| `/beads:close <id>`  | Close issue              |
| `/beads:ready`       | Find ready work          |
| `/beads:blocked`     | Show blocked issues      |
| `/beads:dep`         | Manage dependencies      |
| `/beads:sync`        | Sync with remote         |
| `/beads:workflow`    | Show workflow guide      |

### CLI Commands Reference

| Command                            | Purpose                                            |
| ---------------------------------- | -------------------------------------------------- |
| `bd list`                          | View all issues                                    |
| `bd list --status open`            | View open issues                                   |
| `bd ready`                         | Find work with no blockers                         |
| `bd create "title"`                | Create new issue                                   |
| `bd show <id>`                     | View issue details                                 |
| `bd update <id> --status <status>` | Update status (open, in_progress, blocked, closed) |
| `bd close <id>`                    | Close completed issue                              |
| `bd dep add <from> <to>`           | Add dependency                                     |
| `bd dep tree <id>`                 | View dependency tree                               |
| `bd sync`                          | Sync with git remote                               |
| `bd blocked`                       | View blocked issues                                |
| `bd comments <id> "note"`          | Add comment to issue                               |

### When to Use Beads

- **Always use** for multi-step tasks, features, bugs, and planned work
- **Use judgment** for trivial single-step tasks (typo fixes, simple renames)
- **Always sync** after completing work sessions

---

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

### Mobile State Management

TanStack React Query + Zustand hybrid:

- `hooks/queries/`, `hooks/mutations/` - Server state, caching, API calls
- `stores/` - Client state, auth, offline sync

### API Architecture

NestJS modules in `apps/api/src/`:

- `auth/` - Magic link + guest authentication
- `groups/` - Group CRUD + balance calculations
- `expenses/` - Expense CRUD with multi-currency
- `settlements/` - Settlement tracking
- `currency/` - Exchange rate service
- `sync/` - WebSocket gateway for real-time updates

### Shared Package

`@evn/shared` exports: types, calculations, currencies, constants

### Auth Flow

Token getter pattern in mobile app:

```typescript
// stores/authStore.ts registers getter
registerTokenGetter(() => useAuthStore.getState().accessToken);
// lib/api.ts reads through getter
const accessToken = getAccessToken?.() ?? null;
```

### Real-time Sync

WebSocket gateway broadcasts to group rooms. Clients join via `joinGroup` message.
