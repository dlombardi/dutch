# Evn Mobile E2E Tests (Maestro)

End-to-end tests for the Evn mobile app using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

### Install Maestro

```bash
# macOS
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

### iOS Simulator or Android Emulator

- **iOS**: Xcode with iOS Simulator installed
- **Android**: Android Studio with an emulator configured

### Running the Expo App

Make sure the Expo development server and API are running:

```bash
# From project root
npm run dev

# Or run mobile app specifically
npm run mobile
```

## Test Structure

```
.maestro/
├── config.yaml                 # Maestro configuration
├── README.md                   # This file
├── subflows/                   # Reusable test components
│   ├── login-as-guest.yaml
│   ├── create-group.yaml
│   ├── add-expense.yaml
│   ├── navigate-to-settings.yaml
│   └── logout.yaml
└── flows/                      # Test flows organized by feature
    ├── auth/
    │   ├── 01-guest-login-flow.yaml
    │   ├── 02-magic-link-request-flow.yaml
    │   ├── 03-logout-flow.yaml
    │   └── 04-session-persistence-flow.yaml
    ├── groups/
    │   ├── 01-create-group-flow.yaml
    │   ├── 02-create-group-with-currency-flow.yaml
    │   ├── 03-view-groups-list-flow.yaml
    │   ├── 04-view-group-detail-flow.yaml
    │   ├── 05-join-group-by-code-flow.yaml
    │   └── 06-share-invite-link-flow.yaml
    ├── expenses/
    │   ├── 01-create-basic-expense-flow.yaml
    │   ├── 02-create-expense-with-currency-flow.yaml
    │   ├── 03-view-expense-list-flow.yaml
    │   ├── 04-view-expense-detail-flow.yaml
    │   ├── 05-edit-expense-flow.yaml
    │   ├── 06-delete-expense-flow.yaml
    │   └── 07-expense-split-flow.yaml
    ├── balances/
    │   ├── 01-view-balances-flow.yaml
    │   ├── 02-settle-up-flow.yaml
    │   └── 03-balance-update-on-expense-flow.yaml
    ├── sync/
    │   ├── 01-websocket-connection-flow.yaml
    │   └── 02-data-refresh-flow.yaml
    └── offline/
        ├── 01-offline-data-view-flow.yaml
        ├── 02-offline-expense-queue-flow.yaml
        └── 03-data-persistence-flow.yaml
```

## Running Tests

### Run All Tests

```bash
# From the mobile app directory
cd apps/mobile

# Run all flows
maestro test .maestro/flows/
```

### Run Specific Test Suite

```bash
# Run auth tests only
maestro test .maestro/flows/auth/

# Run group tests only
maestro test .maestro/flows/groups/

# Run expense tests only
maestro test .maestro/flows/expenses/

# Run balance tests only
maestro test .maestro/flows/balances/

# Run sync tests only
maestro test .maestro/flows/sync/

# Run offline tests only
maestro test .maestro/flows/offline/
```

### Run Single Test

```bash
# Run specific test file
maestro test .maestro/flows/auth/01-guest-login-flow.yaml
```

### Run Tests with Recording

```bash
# Record test execution (useful for debugging)
maestro record .maestro/flows/auth/01-guest-login-flow.yaml
```

### Run Tests in CI Mode

```bash
# No screenshots, faster execution
maestro test --no-ansi .maestro/flows/
```

## Test Tags

Tests are tagged for easy filtering:

| Tag           | Description               |
| ------------- | ------------------------- |
| `auth`        | Authentication flows      |
| `guest`       | Guest user flows          |
| `magic-link`  | Magic link authentication |
| `logout`      | Logout flows              |
| `groups`      | Group management          |
| `create`      | Creation flows            |
| `join`        | Join flows                |
| `invite`      | Invite/share flows        |
| `expenses`    | Expense management        |
| `edit`        | Edit flows                |
| `delete`      | Delete flows              |
| `split`       | Expense splitting         |
| `currency`    | Multi-currency            |
| `balances`    | Balance calculations      |
| `settlements` | Settlement recording      |
| `sync`        | Real-time sync            |
| `websocket`   | WebSocket connection      |
| `offline`     | Offline functionality     |
| `persistence` | Data persistence          |
| `queue`       | Offline queue             |

## Environment Variables

Set these in `config.yaml` or pass via CLI:

```yaml
env:
  API_URL: http://localhost:3001
  TEST_EMAIL: test@example.com
  TEST_GUEST_NAME: Test User
```

Override via CLI:

```bash
maestro test --env API_URL=https://api.evn.app .maestro/flows/
```

## Writing New Tests

### Test File Structure

```yaml
# Test: [Test Name]
# Description: [What this test verifies]
# Tags: [comma-separated tags]

appId: com.evn.mobile

---
# Test steps
- launchApp:
    clearState: true # Start fresh

- assertVisible: "Expected text"

- tapOn: "Button text"

- inputText: "Text to type"

- extendedWaitUntil:
    visible: "Element to wait for"
    timeout: 10000
```

### Using Subflows

```yaml
# Call a reusable subflow
- runFlow:
    file: ../subflows/login-as-guest.yaml
    env:
      guestName: "My Custom Name"
```

### Best Practices

1. **Start fresh**: Use `clearState: true` when launching for isolated tests
2. **Wait for async**: Use `extendedWaitUntil` for network operations
3. **Be specific**: Use unique text or test IDs to identify elements
4. **Clean up**: Reset state at end of tests that modify global data
5. **Document**: Add comments explaining complex sequences

## Troubleshooting

### Tests Timing Out

Increase timeouts in wait commands:

```yaml
- extendedWaitUntil:
    visible: "Element"
    timeout: 15000 # 15 seconds
```

### Element Not Found

1. Check if element is visible on screen
2. Try scrolling to find the element:
   ```yaml
   - scrollUntilVisible:
       element: "Hidden Element"
       direction: DOWN
   ```
3. Use Maestro Studio to inspect element hierarchy:
   ```bash
   maestro studio
   ```

### Flaky Tests

1. Add explicit waits between actions
2. Use `extendedWaitUntil` instead of fixed delays
3. Ensure test isolation (start with `clearState: true`)

### Offline Tests Failing

1. Ensure device/simulator supports airplane mode toggle
2. Wait for network state to propagate:
   ```yaml
   - setAirplaneMode: enabled
   - extendedWaitUntil:
       timeout: 2000
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm install

      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash

      - name: Start Expo
        run: npm run mobile &

      - name: Wait for Expo
        run: sleep 30

      - name: Run E2E tests
        run: ~/.maestro/bin/maestro test apps/mobile/.maestro/flows/
```

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/docs/)
- [Maestro CLI Reference](https://maestro.mobile.dev/cli/)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)
