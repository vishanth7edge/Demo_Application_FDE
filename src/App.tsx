import { useState } from 'react'

const checks = [
  { name: 'TypeScript', detail: 'strict mode with extra safety flags' },
  { name: 'ESLint', detail: 'typescript-eslint strict + React rules' },
  { name: 'Prettier', detail: 'formats on save and on every commit' },
  { name: 'Tailwind CSS', detail: 'v4 through the Vite plugin' },
] as const

export default function App(): React.JSX.Element {
  const [count, setCount] = useState(0)

  const handleIncrement = (): void => {
    setCount((current) => current + 1)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16 font-sans text-slate-800">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Your React app is ready</h1>
        <p className="text-slate-600">
          Edit <code className="rounded bg-slate-100 px-1.5 py-0.5">src/App.tsx</code> to start.
          Every commit is linted, type-checked and formatted automatically.
        </p>
      </header>

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
        {checks.map((check) => (
          <li key={check.name} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <span className="font-medium">{check.name}</span>
            <span className="text-right text-sm text-slate-500">{check.detail}</span>
          </li>
        ))}
      </ul>

      <div>
        <button
          type="button"
          onClick={handleIncrement}
          className="rounded-md bg-brand px-4 py-2 font-medium text-brand-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Clicked {count} {count === 1 ? 'time' : 'times'}
        </button>
      </div>
    </main>
  )
}
