import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";

const currency = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    n || 0
  );

const TXN_LABELS = {
  loan_given: "Loans given",
  loan_repaid: "Repayments received",
  advance_deposit: "Advance deposits",
  advance_used: "Advance used",
  cold_drink_sale: "Cold drink sales",
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const DailyReport = () => {
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (d) => {
    setLoading(true);
    try {
      const res = await api.get("/reports/daily", { params: { date: d } });
      setReport(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  return (
    <div className="pb-24">
      <PageHeader
        title="Daily Report"
        subtitle="Night-time close-out"
        tone="brand"
        action={
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl bg-white/20 text-white text-sm px-3 py-2 outline-none [color-scheme:dark]"
          />
        }
      />

      <div className="px-4 -mt-6 max-w-lg mx-auto">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 text-debt text-sm p-3 shadow-tile">
            Couldn't load report: {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-5 mb-4 shadow-tile">
              <p className="text-xs uppercase tracking-wide text-ink-400">Grand total moved today</p>
              <p className="font-display text-3xl font-bold mt-1 text-ink-900">{currency(report?.grandTotal)}</p>
              <p className="text-xs text-ink-400 mt-1">{report?.transactionCount || 0} transactions</p>
            </div>

            <div className="space-y-2">
              {Object.entries(report?.summary || {}).length === 0 ? (
                <p className="text-sm text-ink-400 text-center mt-8">No activity recorded for this day.</p>
              ) : (
                Object.entries(report.summary).map(([type, row]) => (
                  <div key={type} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-tile">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{TXN_LABELS[type] || type}</p>
                      <p className="text-xs text-ink-400">{row.count} entries</p>
                    </div>
                    <span className="font-semibold text-sm text-ink-900">{currency(row.totalAmount)}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyReport;