---
paths:
  - 'src/**/*.{tsx,css}'
---

# Styling

- No raw hex/rgb values in JSX or class names (`bg-[#2563eb]`). Add a token to the `@theme`
  block in `src/index.css` (`--color-brand` → `bg-brand`, `text-brand`) and use the class.
- No inline `style={{ }}` (ArchGuard `reusability/no-hardcoded-styles`). Exception: values that
  are truly dynamic at runtime (computed positions, sizes).
- Page frames (sidebars, sticky headers/footers, wizard shells) and scroll containers are
  built once in `src/shared/` and reused. Do not hand-roll a new one per page.
- Tailwind v4 can accept a class and silently never emit it (some `group-hover` + `!important`
  or scrollbar-hiding combinations). If a utility has no effect, check the generated CSS
  before stacking more classes. A small raw CSS rule in the shared component is acceptable.
- Class order is handled by `prettier-plugin-tailwindcss`. Do not reorder manually.
