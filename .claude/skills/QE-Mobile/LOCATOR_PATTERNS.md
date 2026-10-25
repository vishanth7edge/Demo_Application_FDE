> **Note:** No longer an independently-triggered Claude Code skill. It's read and executed by `/mobile-qa-agent` when the user picks **automation** from its menu — the full procedure below still applies exactly as written.

# Mobile Locator Patterns — Hard-Won Lessons

> Load this file before Phase 2 (Step Definitions) and Phase 3 (POM), alongside
> `BDD_TEMPLATES.md` and `MOBILE_MCP_REFERENCE.md`. Apply every rule below before writing
> any locator.

## Locator Priority (strictly enforced)

| Priority | Method | Use when |
|----------|--------|----------|
| 1 ✅ | `screen.getByTestId('...')` | Always prefer — maps to `resource-id` (Android) / `accessibility-id` (iOS). Ask for one to be added if missing rather than falling further down this table |
| 2 ✅ | `screen.getByRole(...)` | When no resource-id/accessibility-id exists |
| 3 ⚠️ | `screen.getByLabel('...')` | Accessibility label present, no role match |
| 4 ⚠️ | `screen.getByText('...')` | Visible text only — fragile across locales, use a regex where wording may vary |
| 5 ⚠️ | `screen.getByType('...')` | Element type only — broad, matches multiple elements easily |
| 6 ❌ | `mobile_click_on_screen_at_coordinates(x, y)` | Last resort only — breaks on any resolution/orientation/layout change. Comment why no better locator existed |

---

### 1. `resource-id` and `accessibility-id` are not the same field

Android exposes `resource-id`; iOS exposes `accessibility-id` (sometimes surfaced as `name`
depending on the inspection tool). `mobile_list_elements_on_screen` returns whichever field
the platform actually has — checking only one will silently miss the other platform's
elements in a cross-platform project.

```javascript
// ❌ WRONG — only checks the Android field name, misses every iOS element
const hasTestId = element['resource-id'];

// ✅ CORRECT — check both, platform-agnostic
const hasTestId = element['resource-id'] || element['accessibility-id'] || element['name'];
```

`screen.getByTestId(...)` in MobileWright abstracts this for you at the framework level —
but when reasoning from a raw `mobile_list_elements_on_screen` dump during authoring or
self-heal, check both fields yourself before concluding "no testid on this element."

---

### 2. WebView / hybrid screens don't expose native resource-ids for their content

A screen embedding a WebView (in-app browser, hybrid checkout, help center) reports the
WebView container as one native element — the HTML content inside it is invisible to
`mobile_list_elements_on_screen`.

```javascript
// ❌ WRONG — assumes the hybrid content has a resource-id, times out
this.helpArticleLink = screen.getByTestId('help-article-3');

// ✅ CORRECT — flag it, don't retry the native locator harder
// "This screen is a WebView — native resource-id inspection won't find its content.
//  Falls back to getByText() on visible text, or needs a web-style inspection strategy."
this.helpArticleLink = screen.getByText('Refund policy');
```

---

### 3. System permission dialogs interrupt the flow unpredictably

A location/camera/notification/contacts permission prompt is OS-level chrome, not app UI —
it can appear right after a navigation step and block every subsequent tap until dismissed.

```javascript
// ❌ WRONG — assumes the next screen loaded; every following action times out
await screen.getByTestId('enable-location').tap();
await screen.getByTestId('map-view').waitFor(); // times out — a permission dialog is covering it

// ✅ CORRECT — check for a system dialog before assuming the locator is wrong
const elements = await mobile_list_elements_on_screen();
if (elements.some(el => /allow|deny|while using the app/i.test(el.text))) {
  await screen.getByText(/allow|while using the app/i).tap();
}
await screen.getByTestId('map-view').waitFor();
```

If a test hits "element not found" right after a step that plausibly triggers a permission
prompt, dump the screen and check for dialog text before concluding the locator is broken.

---

### 4. Coordinate taps are resolution/DPI-relative — never hardcode across a device matrix

A coordinate captured on one simulator breaks on a different device profile, and definitely
breaks across a `projects` matrix spanning multiple device sizes.

```javascript
// ❌ WRONG — works on iPhone 15 Pro sim, wrong on every other device in the matrix
await mobile_click_on_screen_at_coordinates(187, 640);

// ✅ CORRECT — resolve locator by identifier, use coordinates only as documented last resort
await screen.getByTestId('agree-checkbox').tap();
```

---

### 5. The soft keyboard shifts layout — re-dump before any coordinate fallback

Focusing a text field can push screen content upward to make room for the keyboard. Any
coordinates recorded before that focus are now wrong.

```javascript
// ❌ WRONG — coordinate recorded before the keyboard appeared
await screen.getByLabel('Email').fill('user@example.com');
await mobile_click_on_screen_at_coordinates(200, 500); // may now hit a different element

// ✅ CORRECT — re-dump after any focus change if a coordinate fallback is unavoidable
await screen.getByLabel('Email').fill('user@example.com');
const elements = await mobile_list_elements_on_screen(); // re-dump post-keyboard
```

---

### 6. OTP autofill can race a manual `type` action

Both platforms often auto-fill an SMS OTP into the field without any typed input. A step that
types digit-by-digit can collide with the autofill and leave the field in an unexpected state.

```javascript
// ❌ WRONG — assumes typing succeeded, doesn't verify against a possible autofill race
await screen.getByTestId('otp-input').fill(otpCode);
await screen.getByTestId('verify-button').tap();

// ✅ CORRECT — verify the field's actual value before proceeding
await screen.getByTestId('otp-input').fill(otpCode);
await expect(screen.getByTestId('otp-input')).toHaveText(otpCode);
await screen.getByTestId('verify-button').tap();
```

---

### 7. Hardware BACK is Android-only

`screen.pressButton('BACK')` has no iOS equivalent — iOS uses an edge swipe gesture or an
explicit on-screen back element instead.

```javascript
// ❌ WRONG — a shared step across both platforms with no branch
When('{word} goes back', async function () {
  await this.screen.pressButton('BACK');   // does nothing meaningful on iOS
});

// ✅ CORRECT — platform-conditional step, resolved from the World/config
When('{word} goes back', async function () {
  if (this.platform === 'android') {
    await this.screen.pressButton('BACK');
  } else {
    await this.screen.getByTestId('nav-back-button').tap(); // or a swipe gesture
  }
});
```

---

### 8. Dynamic/virtualized lists — an element not in the dump may just be off-screen

Long lists (`RecyclerView`, `UICollectionView`, virtualized FlatLists) only render items near
the viewport. `mobile_list_elements_on_screen` returning no match for a list item doesn't
always mean the locator is wrong.

```javascript
// ❌ WRONG — concludes the locator is broken after one failed dump
// "getByTestId('item-42') not found — locator must be wrong"

// ✅ CORRECT — swipe toward the expected item first, then re-check
await screen.swipe('up', { distance: 400 });
const elements = await mobile_list_elements_on_screen(); // re-dump after scroll
```

---

### 9. Orientation changes re-lay the whole screen

A `resource-id`/`accessibility-id` usually survives rotation; its on-screen coordinates never
do. Any scenario that rotates mid-flow must re-dump before falling back to a coordinate
locator afterward.

```javascript
// ❌ WRONG — coordinate captured in portrait, used again after rotating to landscape
await mobile_set_orientation('landscape');
await mobile_click_on_screen_at_coordinates(300, 120); // stale — layout has changed

// ✅ CORRECT
await mobile_set_orientation('landscape');
const elements = await mobile_list_elements_on_screen(); // re-dump post-rotation
```

---

### 10. Backgrounding vs terminating are different device states

`mobile_terminate_app` forces a cold start on next launch. Pressing `HOME`
(`screen.pressButton('HOME')`) leaves the app alive in the background. A scenario testing
"resume where you left off" needs HOME + relaunch, not terminate + launch — using the wrong
one tests the wrong behavior entirely.

```javascript
// ❌ WRONG — tests cold-start behavior when the scenario is about background resume
await mobile_terminate_app(bundleId);
await mobile_launch_app(bundleId);

// ✅ CORRECT — genuine background/resume
await screen.pressButton('HOME');
await mobile_launch_app(bundleId); // brings the backgrounded app back to foreground
```
