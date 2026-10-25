import { getActiveShare, getFirstName } from '../application/index.ts'
import { formatCurrency, formatNumber } from '../../../shared/format/format.ts'
import { IconBox } from '../../../shared/ui/Icons.tsx'
import { IconCheck, IconCurrency, IconWarning } from '../../../shared/ui/StatusIcons.tsx'
import { PageHeader } from '../../../shared/ui/PageHeader.tsx'
import { RetryAlert } from '../../../shared/ui/RetryAlert.tsx'
import { FullPageSpinner } from '../../../shared/ui/Spinner.tsx'
import { RecentProductsCard } from './RecentProductsCard.tsx'
import { SummaryCard } from './SummaryCard.tsx'
import { useDashboardSummary } from './useDashboardSummary.ts'

export interface DashboardPageProps {
  userName: string
}

export function DashboardPage({ userName }: DashboardPageProps): React.JSX.Element {
  const { state, reload } = useDashboardSummary()

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${getFirstName(userName)}. Here's how the catalogue looks today.`}
      />

      {state.status === 'loading' ? <FullPageSpinner label="Loading dashboard" /> : null}

      {state.status === 'error' ? (
        <RetryAlert
          title="We couldn't load the dashboard."
          message={state.message}
          onRetry={reload}
        />
      ) : null}

      {state.status === 'ready' ? (
        <div className="space-y-6">
          <section
            aria-label="Catalogue summary"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <SummaryCard
              label="Total products"
              value={formatNumber(state.summary.totalProducts)}
              caption="Every product in the catalogue"
              icon={<IconBox />}
              tone="brand"
            />
            <SummaryCard
              label="Active products"
              value={formatNumber(state.summary.activeProducts)}
              caption={`${String(getActiveShare(state.summary))}% of the catalogue is active`}
              icon={<IconCheck />}
              tone="success"
            />
            <SummaryCard
              label="Low stock"
              value={formatNumber(state.summary.lowStockProducts)}
              caption="10 or fewer units in stock, including sold out"
              icon={<IconWarning />}
              tone="warning"
            />
            <SummaryCard
              label="Inventory value"
              value={formatCurrency(state.summary.inventoryValue)}
              caption="Price × quantity across all products"
              icon={<IconCurrency />}
              tone="info"
            />
          </section>
          <RecentProductsCard products={state.summary.recentProducts} />
        </div>
      ) : null}
    </>
  )
}
