# React Strict Template

React 19 + TypeScript (strict) + Vite + Tailwind CSS v4, with strict ESLint and Prettier
enforced on every commit.

## Getting started

```bash
git clone <this-repo-url> my-app
cd my-app
npm install      # installs everything AND activates the git hooks
npm run dev
```

That's it. `npm install` runs the `prepare` script, which sets up Husky, so every commit
is checked from then on. Nobody has to configure anything by hand.

Requires Node.js 20.19+ (the `.nvmrc` pins 22, so `nvm use` works).

## What happens on every commit

The `.husky/pre-commit` hook runs:

1. **lint-staged** on the files you staged: `eslint --fix` (fails on any warning) and
   `prettier --write` (also sorts Tailwind classes).
2. **`tsc -b`**: a full strict type check of the project.

If anything fails, the commit is rejected with the errors shown.

## Scripts

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start the dev server                             |
| `npm run build`        | Type check, then build for production            |
| `npm run typecheck`    | Strict TypeScript check                          |
| `npm run lint`         | ESLint, fails on any warning                     |
| `npm run lint:fix`     | ESLint with auto-fix                             |
| `npm run format`       | Format every file with Prettier                  |
| `npm run format:check` | Check formatting without changing files          |
| `npm run check`        | typecheck + lint + format:check (use this in CI) |

## What "strict" means here

**TypeScript** (`tsconfig.app.json`): `strict` plus `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitReturns`, `noImplicitOverride`,
`noPropertyAccessFromIndexSignature`, `noUnusedLocals`, `noUnusedParameters`, and more.

**ESLint** (`eslint.config.js`): typescript-eslint `strictTypeChecked` +
`stylisticTypeChecked`, `eslint-plugin-react-x` strict, `eslint-plugin-react-dom` strict,
React Hooks rules, React Refresh, plus `eqeqeq`, `curly`, explicit return types,
`type` imports, no floating promises and exhaustive `switch` checks.
`eslint-config-prettier` keeps ESLint and Prettier from fighting.

**Prettier** (`prettier.config.js`): no semicolons, single quotes, trailing commas,
100-column lines, with `prettier-plugin-tailwindcss` for class ordering.

## Tailwind

Tailwind v4 runs through `@tailwindcss/vite`, so there's no `tailwind.config.js`.
Add design tokens in `src/index.css` inside `@theme`; for example
`--color-brand` becomes the classes `bg-brand`, `text-brand`, and so on.

## Editor

Open the folder in VS Code and accept the recommended extensions (ESLint, Prettier,
Tailwind CSS IntelliSense). `.vscode/settings.json` formats on save and applies
ESLint fixes on save.
