import { useEffect } from "react";
import { useDashboard } from "../context/AppContext";
import SummaryCard from "../components/SummaryCard";
import PageHeader from "../components/PageHeader";

const currency = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    n || 0
  );

const Dashboard = () => {
  const { summary, loading, error, fetchDashboard } = useDashboard();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="pb-24">
      <PageHeader title="Shop Ledger" subtitle="Today at a glance" tone="brand" />

      <div className="px-4 -mt-6 max-w-lg mx-auto">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 text-debt text-sm p-3 shadow-tile">
            Couldn't load the dashboard: {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="Total Loans"
            value={loading ? "…" : currency(summary?.totalLoans)}
            accent="debt"
            subtext="Outstanding"
          />
          <SummaryCard
            label="Total Advance"
            value={loading ? "…" : currency(summary?.totalAdvance)}
            accent="credit"
            subtext="Prepaid credit"
          />
          <SummaryCard
            label="Cold Drinks"
            value={loading ? "…" : currency(summary?.coldDrinkSalesToday?.revenue)}
            accent="chill"
            subtext={`${summary?.coldDrinkSalesToday?.units || 0} sold today`}
          />
          <SummaryCard
            label="Total Accounts"
            value={loading ? "…" : summary?.totalAccounts ?? 0}
            accent="brand"
            subtext="Active"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;