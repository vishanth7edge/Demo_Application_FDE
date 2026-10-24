> **Note:** No longer an independently-triggered Claude Code skill. It's read and executed by `/mobile-qa-agent` when the user picks **automation** from its menu — the full procedure below still applies exactly as written.

# Mobile MCP + MobileWright — Command & Tool Reference

> Load this file once at Phase 0 (Environment + Device Discovery). Do not reload later in
> the run — reference tools/commands by name from context, same discipline as the web
> `automation` skill applies to `LOCATOR_PATTERNS.md`.

## Two tool surfaces — know which one to reach for

| Surface | Role | When to use |
|---|---|---|
| **Mobile MCP** (`mobile-next/mobile-mcp`) | Live device control — the mobile equivalent of Playwright MCP. Drives the actual simulator/emulator/real device during authoring and self-heal. | Discovering devices/apps, inspecting the current screen, tapping/typing/swiping to explore a flow before writing a locator, re-inspecting on self-heal |
| **MobileWright** (`mobilewright` CLI + `@mobilewright/test`) | The authored test framework — what the generated Gherkin/step-defs/POM actually run against. | Writing the real test code, running the real suite, generating reports |

Generated tests never call Mobile MCP tools directly. Mobile MCP is this skill's
authoring/inspection tool — exactly how Playwright MCP is used by the web `automation`
skill, never referenced from inside the `.feature`/step-def/POM files it produces.

## Mobile MCP — Tool Catalog

From `mobile-next/mobile-mcp`. Verify exact names **and parameters** against whatever server
is actually connected before relying on them — MCP servers version-drift like anything else;
if a tool listed here doesn't exist, or takes different arguments than assumed, treat the
connected server as the current truth, not this table. In particular: when Phase 0c resolves
more than one connected device, check whether each tool call below needs an explicit device
identifier passed alongside it — don't assume every call implicitly targets "the" device
once more than one is available.

### Device Management
| Tool | Purpose |
|---|---|
| `mobile_list_available_devices` | Lists simulators, emulators, and connected real devices |
| `mobile_get_screen_size` | Screen dimensions in pixels — needed before any coordinate-based tap |
| `mobile_get_orientation` / `mobile_set_orientation` | Read / change portrait ↔ landscape |

### App Management
| Tool | Purpose |
|---|---|
| `mobile_list_apps` | Installed apps on the device |
| `mobile_launch_app` | Start an app by package/bundle ID |
| `mobile_terminate_app` | Stop a running app — cold-start on next launch (distinct from HOME — see `LOCATOR_PATTERNS.md` §10) |
| `mobile_install_app` | Deploy `.apk` / `.ipa` / `.app` / `.zip` |
| `mobile_uninstall_app` | Remove by bundle ID / package name |

### Screen Interaction & UI Inspection
| Tool | Purpose | Token cost |
|---|---|---|
| `mobile_list_elements_on_screen` | Reads the real accessibility tree — coordinates + properties **including `resource-id` and accessibility-id fields**. Mobile equivalent of `browser_snapshot()` / DOM inspection. | Expensive — full tree. Once per new/changed screen, never per interaction |
| `mobile_take_screenshot` | Captures current screen, returned inline | Expensive if not saved |
| `mobile_save_screenshot` | Persists screenshot straight to a file | Cheap — zero response tokens, use for all evidence capture |
| `mobile_click_on_screen_at_coordinates` | Tap at x,y | Last-resort locator method only |
| `mobile_double_tap_on_screen` | Double-tap at x,y | — |
| `mobile_long_press_on_screen_at_coordinates` | Long-press at x,y | — |
| `mobile_swipe_on_screen` | Directional swipe (up/down/left/right) | — |

### Input & Navigation
| Tool | Purpose |
|---|---|
| `mobile_type_keys` | Enter text, optional submit |
| `mobile_press_button` | `HOME` / `BACK` (Android only) / `VOLUME_UP` / `VOLUME_DOWN` / `ENTER` |
| `mobile_open_url` | Open a URL in the device browser — deep-link entry points |

### Recording & Diagnostics
| Tool | Purpose |
|---|---|
| `mobile_start_screen_recording` / `mobile_stop_screen_recording` | Video capture across a multi-step flow |
| `mobile_list_crashes` / `mobile_get_crash` | Retrieve crash reports — pull the crash report into a bug candidate's Description when a self-heal assertion failure coincides with a crash |

## Token Discipline

Mirrors the web `automation`/`manual-testing` skills' Playwright rules — same principle, different tool names:

| Operation | Use | Avoid | Why |
|---|---|---|---|
| Screen inspection | `mobile_list_elements_on_screen` once per new/changed screen | Calling it after every single tap | Full accessibility tree — same cost profile as `browser_snapshot()` |
| Evidence capture | `mobile_save_screenshot` | `mobile_take_screenshot` without saving | Inline image return burns response tokens |
| Repeated screens | Fingerprint check (below) before re-inspecting | Re-dumping a screen whose resource-ids haven't moved | Same principle as the web skill's DOM fingerprint cache |

## Resource-ID / Accessibility-ID Detection ("is there a testid on this screen")

Before writing any locator, dump the current screen and check whether the target element
carries a stable identifier:

```
mobile_list_elements_on_screen()
```

For each element in the result, check in this order:
1. **`resource-id`** (Android) or **`accessibility-id`** (iOS) — if present, this is the
   mobile equivalent of a web `data-testid` and maps directly to MobileWright's
   `screen.getByTestId(...)`. Check both field names — they aren't interchangeable across
   platforms (see `LOCATOR_PATTERNS.md` §1).
2. If absent, check for an accessibility label/role (`getByLabel` / `getByRole`).
3. If neither, fall through to the Locator Priority table in `LOCATOR_PATTERNS.md`.

If `npx mobilewright --help` (checked once at Phase 0) reveals a dedicated UI-dump command in
the installed version, prefer it for authoring convenience — but `mobile_list_elements_on_screen`
stays the source of truth during self-heal since it reflects the live device, not a static
dump. Don't assume a specific dump subcommand name beyond what `--help`/`doctor` actually shows
for the installed version.

## MobileWright — Setup & Environment Commands

```bash
npx mobilewright doctor                          # environment health check (Xcode, ADB, simulators)
npx mobilewright doctor --json                   # machine-readable, for logging without narrating to chat
npx mobilewright doctor --category ios|android|system
npx mobilewright devices                         # list connected devices/simulators/emulators
npm init mobilewright@latest                     # scaffold config + example test (skips existing files)
```

`mobilecli` (the device server) must already be running in a separate terminal —
`mobilecli start`. If any MCP tool call or `doctor` reports no device / connection refused,
stop and ask the user to confirm `mobilecli` is running before proceeding — same pattern as
the web skill's Playwright MCP pre-flight check.

## MobileWright — Config Reference

`mobilewright.config.ts` (or `.js`) at the project root. Config values are defaults —
options passed directly to a launch call always win.

```typescript
import { defineConfig } from 'mobilewright';

export default defineConfig({
  platform:    'android',          // 'ios' | 'android'
  bundleId:    'com.example.app',
  deviceName:  /Pixel 7/,
  installApps: './builds/app.apk',
  timeout:     10_000,
  retries:     1,
  reporter:    'html',
});
```

Multi-platform matrix:
```typescript
export default defineConfig({
  projects: [
    { name: 'iOS',     platform: 'ios',     bundleId: 'com.app.ios' },
    { name: 'Android', platform: 'android', bundleId: 'com.app.android' },
  ],
});
```

## MobileWright — Test-Writing API (what generated POM/step defs call)

```typescript
import { test, expect } from '@mobilewright/test';

// Finding elements — priority order matches LOCATOR_PATTERNS.md
screen.getByTestId('submit-button');            // 1st — maps to resource-id/accessibility-id
screen.getByRole('button', { name: 'Submit' });  // 2nd
screen.getByLabel('Username');                   // 2nd (accessibility label)
screen.getByText('Sign In');                      // 3rd — fragile across locales
screen.getByType('TextField');                    // 4th — broad, last resort before coordinates

// Actions
await screen.getByText('Sign In').tap();
await screen.getByRole('button', { name: 'Submit' }).doubleTap();
await screen.getByText('Options').longPress();
await screen.getByLabel('Email').fill('user@example.com');
await screen.swipe('up');
await screen.swipe('down', { distance: 300 });
await screen.pressButton('HOME');
await screen.pressButton('BACK'); // Android only

// Assertions
await expect(screen.getByText('Welcome')).toBeVisible();
await expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
await expect(screen.getByTestId('greeting')).toHaveText('Hello, World');
await expect(screen.getByText('Error')).not.toBeVisible();
```

## MobileWright — Running Tests

Native runner:
```bash
npx mobilewright test                       # all tests
npx mobilewright test tests/login.test.ts   # one file
npx mobilewright test --grep "sign in"
npx mobilewright test --project=ios
npx mobilewright test --list                # list without running
```

BDD/Cucumber profile — this skill's default output shape, matching the pack's existing
reuse-first Gherkin approach:
```bash
npm test                        # all features, default profile
npm run test:android            # PLATFORM=android
npm run test:ios                # PLATFORM=ios
npm run test:dry                # validate steps without touching a device — mobile
                                 # equivalent of `cucumber-js --dry-run`
npx cucumber-js test/features/Auth/login.feature
npx cucumber-js --tags @smoke
```

Reports:
```bash
npx mobilewright show-report
npx mobilewright show-report --host 0.0.0.0 --port 8080
npm run report:open              # BDD profile's cucumber-report.html
```

## MobileWright — Project Structure (BDD/Cucumber profile)

Discover this at Phase 0 — never impose it if the repo already has its own layout, same rule
the web `automation` skill follows for its tree (including preserving any existing typos):

```
test/
  app/                    # .apk / .ipa binaries
  features/               # Gherkin .feature files
  Pages/                  # Page Object Model classes
  step_definitions/       # Cucumber step implementations (Driver.js = World + hooks)
  TestData/                # Faker-based test data generators
  Utils/BasePage.js        # Base class for all page objects
cucumber.js                # Cucumber profile config
mobilewright.config.js
.env.example / .env
```

## Debugging

```bash
DEBUG=mw:* npx mobilewright test        # verbose logging
MWDEBUGIMPL=1 npx mobilewright test     # verbose driver output
```

| Issue | Fix |
|---|---|
| `mobilecli: command not found` | `npm install -g mobilecli@latest` |
| No devices found / connection refused | `adb kill-server && adb start-server && adb devices`, or confirm `mobilecli start` is running |
| Tests time out immediately | Confirm `mobilecli` running, device ID matches `mobilewright devices`, raise timeout |
| iOS not running on Linux/Windows | iOS requires macOS + Xcode — use `platform: 'android'` elsewhere |
