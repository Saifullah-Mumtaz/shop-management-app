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
      {/* Shop name as the header, same colorful gradient style used across
          every other page — this is the app's front door, so it gets the
          brand tone rather than a plain white top. */}
      <PageHeader title="Bahadur Photostate" subtitle="Shop Ledger" tone="brand" />

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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;