# Mobile App Conventions

This document details the coding conventions and architectural patterns used in the Evn mobile app. Follow these guidelines when contributing to ensure consistency across the codebase.

## Directory Structure

```
src/
├── app/                          # Expo Router routes ONLY
│   ├── _layout.tsx
│   ├── (auth)/                   # Auth group (login, signup)
│   ├── (tabs)/                   # Main tab navigator
│   └── [route]/                  # Dynamic routes
│
├── modules/                      # Feature modules
│   ├── auth/
│   │   ├── components/           # Auth-specific components
│   │   ├── hooks/                # Auth-specific hooks
│   │   ├── services/             # Auth API calls
│   │   ├── store/                # Auth zustand store
│   │   ├── types.ts              # Shared types within module
│   │   └── index.ts              # Barrel export
│   ├── expenses/
│   ├── groups/
│   └── settlements/
│
├── components/                   # Shared UI primitives
│   └── ui/
│       ├── button/
│       │   ├── button.tsx
│       │   ├── button.styles.ts
│       │   ├── button.types.ts
│       │   └── index.ts
│       └── ...
│
├── lib/                          # Core utilities
│   ├── api-client/               # HTTP client
│   ├── utils/                    # Formatters, validators, logger
│   └── query-client.ts           # React Query setup
│
├── store/                        # Global zustand stores
│   ├── network-store.ts
│   └── offline-queue-store.ts
│
├── constants/                    # App-wide constants
│   └── theme.ts
│
├── types/                        # Global types only
│   └── index.ts
│
└── test/                         # Test utilities
    ├── setup.ts
    ├── test-utils.tsx
    └── mocks/fixtures/
```

## File Naming Conventions

| File Type  | Pattern              | Example                    |
|------------|----------------------|----------------------------|
| Component  | `{name}.tsx`         | `expense-card.tsx`         |
| Styles     | `{name}.styles.ts`   | `expense-card.styles.ts`   |
| Types      | `{name}.types.ts`    | `expense-card.types.ts`    |
| Tests      | `{name}.test.tsx`    | `expense-card.test.tsx`    |
| Hook       | `use-{name}.ts`      | `use-expenses.ts`          |
| Service    | `{name}-service.ts`  | `expense-service.ts`       |
| Store      | `{name}-store.ts`    | `auth-store.ts`            |
| Barrel     | `index.ts`           | `index.ts`                 |

## Import Aliases

Use the `@/` alias for imports from the `src/` directory:

```typescript
// Good
import { useAuth } from '@/modules/auth';
import { PrimaryButton } from '@/components/ui';
import { api } from '@/lib/api-client';

// Avoid
import { useAuth } from '../../../modules/auth';
```

## Module Structure

Each feature module should follow this structure:

```
modules/{feature}/
├── components/           # Feature-specific components
│   └── {component}/
│       ├── {component}.tsx
│       ├── {component}.styles.ts   # Only if using cva variants
│       ├── {component}.types.ts
│       └── index.ts
├── hooks/
│   ├── use-{feature}.ts           # React Query query hooks
│   ├── use-{feature}-mutations.ts # React Query mutation hooks
│   └── index.ts
├── services/
│   ├── {feature}-service.ts       # API calls
│   └── index.ts
├── store/                          # Only if module needs local state
│   ├── {feature}-store.ts
│   └── index.ts
├── types.ts                        # Shared types within module
└── index.ts                        # Barrel export
```

## Component Colocation

### When to Create Separate Files

- **Types**: Create `{component}.types.ts` when props have more than 3 properties or include complex types
- **Styles**: Create `{component}.styles.ts` when using `cva` or `tailwind-variants` for multiple variants
- **Tests**: Always colocate test files as `{component}.test.tsx`

### Example Component Structure

```
expense-card/
├── expense-card.tsx          # Component implementation
├── expense-card.styles.ts    # cva variants (only if complex)
├── expense-card.types.ts     # Props and internal types
├── expense-card.test.tsx     # Unit tests
└── index.ts                  # export { ExpenseCard } from './expense-card'
```

## Type Promotion Hierarchy

Apply the "least privilege" principle for types:

1. **Inline** - Types used by ONE file only
2. **Component folder** - Types shared within a component → `{component}.types.ts`
3. **Module** - Types shared within a module → `modules/{module}/types.ts`
4. **Global** - Types shared across modules → `src/types/`

## State Management

### Hybrid Approach: React Query + Zustand

| Data Type      | Tool         | Location                        |
|----------------|--------------|----------------------------------|
| Server state   | React Query  | `modules/{module}/hooks/`        |
| Auth/Session   | Zustand      | `modules/auth/store/`            |
| UI state       | Zustand      | `src/store/`                     |
| Network status | Zustand      | `src/store/network-store.ts`     |
| Offline queue  | Zustand      | `src/store/offline-queue-store.ts` |

### React Query Hooks Pattern

```typescript
// Query hook (use-{feature}.ts)
export function useGroupExpenses(groupId: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: queryKeys.expenses.byGroup(groupId ?? ''),
    queryFn: async () => {
      if (!groupId) throw new Error('Group ID is required');
      const response = await expenseService.getGroupExpenses(groupId);
      return validateExpenses(response.expenses);
    },
    enabled: !!groupId && hasHydrated && isAuthenticated,
  });
}
```

### Zustand Store Pattern

```typescript
// Store with persistence
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        useAuthStore.getState().setHasHydrated(true);
      },
    }
  )
);
```

## Styling with NativeWind

### Simple Components

For components with few classes, use inline className strings:

```tsx
<View className="flex-1 p-4 bg-dark-bg">
  <Text className="text-lg font-semibold text-white">Hello</Text>
</View>
```

### Complex Variants

Use `class-variance-authority` (cva) for components with multiple variants:

```typescript
// button.styles.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'items-center justify-center flex-row rounded-xl',
  {
    variants: {
      size: {
        sm: 'py-2 px-4',
        md: 'py-3 px-4',
        lg: 'py-4 px-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type ButtonStyleVariants = VariantProps<typeof buttonVariants>;
```

### Theme Colors

Use the predefined theme classes from `tailwind.config.js`:

```
Dark mode: bg-dark-bg, text-dark-text-primary, border-dark-border
Light mode: bg-light-bg, text-light-text-primary, border-light-border
Brand: text-dutch-orange, bg-dutch-green, border-dutch-red
```

## API Service Pattern

Services handle all API communication and should be in `modules/{module}/services/`:

```typescript
// expense-service.ts
import { api } from '@/lib/api-client';
import type { CreateExpenseInput, ExpenseApiResponse } from '../types';

export async function createExpense(input: CreateExpenseInput): Promise<ExpenseApiResponse> {
  return api.createExpense(
    input.groupId,
    input.amount,
    input.description,
    // ...
  );
}

export const expenseService = {
  createExpense,
  getExpense,
  getGroupExpenses,
  updateExpense,
  deleteExpense,
};
```

## Testing Conventions

### Test File Location

Tests are colocated with their source files:

```
expense-card/
├── expense-card.tsx
└── expense-card.test.tsx
```

### Test Utilities

Use the custom render function that includes providers:

```typescript
import { render, screen, fireEvent } from '@/test/test-utils';
import { ExpenseCard } from './expense-card';
import { mockExpense } from '@/test/mocks/fixtures/expenses';

describe('ExpenseCard', () => {
  it('renders expense details', () => {
    render(<ExpenseCard expense={mockExpense} />);

    expect(screen.getByText('Dinner at Olive Garden')).toBeOnTheScreen();
    expect(screen.getByText('$85.50')).toBeOnTheScreen();
  });
});
```

### Mock Data

Use fixtures from `src/test/mocks/fixtures/`:

```typescript
import { mockExpense, mockExpenses } from '@/test/mocks/fixtures/expenses';
import { mockUser, mockGuestUser } from '@/test/mocks/fixtures/users';
```

## Error Handling

### API Errors

The API client throws typed errors:

```typescript
import { ApiError, NetworkError, RequestTimeoutError, isApiError } from '@/lib/api-client';

try {
  await api.createExpense(...);
} catch (error) {
  if (isApiError(error)) {
    if (error.isAuthError()) {
      // Handle auth error
    }
    if (error.isValidationError()) {
      // Handle validation error
    }
  }
}
```

### User-Friendly Messages

Use `getErrorMessage()` for displaying errors:

```typescript
import { getErrorMessage } from '@/lib/api-client';

catch (error) {
  const message = getErrorMessage(error);
  // Show message to user
}
```

## Barrel Exports

Each directory should have an `index.ts` that exports its public API:

```typescript
// modules/expenses/index.ts
export * from './types';
export * from './hooks';
export * from './services';
// Don't export internal implementation details
```

## Code Quality Checklist

Before submitting code, ensure:

- [ ] All files follow naming conventions
- [ ] Types are at the appropriate level (inline → component → module → global)
- [ ] Tests are colocated with source files
- [ ] Imports use the `@/` alias
- [ ] Components use NativeWind for styling
- [ ] API calls go through service files
- [ ] React Query is used for server state
- [ ] Zustand is used for client state only
- [ ] No circular dependencies between modules
- [ ] Barrel exports are updated for new files
