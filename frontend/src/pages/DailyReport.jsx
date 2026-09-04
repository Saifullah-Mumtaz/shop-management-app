import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";

const currency = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    n || 0
  );

const ENTRY_META = {
  loan_given: { label: "Loan given", color: "text-debt" },
  loan_repaid: { label: "Payment received", color: "text-credit" },
  advance_deposit: { label: "Advance deposit", color: "text-credit" },
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const DailyReport = () => {
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [dayTransactions, setDayTransactions] = useState([]);
  const [dayLoading, setDayLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDay = useCallback(async (d) => {
    setDayLoading(true);
    try {
      const [reportRes, txnRes] = await Promise.all([
        api.get("/reports/daily", { params: { date: d } }),
        api.get("/reports/transactions", { params: { date: d } }),
      ]);
      setReport(reportRes.data);
      setDayTransactions(txnRes.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDayLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDay(date);
  }, [date, loadDay]);

  // The number the shop owner actually cares about: how much new credit
  // went out today vs how much came back. Positive net = total outstanding
  // loan grew today; negative net = it shrank (good — people are paying
  // back more than they're borrowing).
  const loanGiven = report?.summary?.loan_given?.totalAmount || 0;
  const loanRecovered = report?.summary?.loan_repaid?.totalAmount || 0;
  const netChange = loanGiven - loanRecovered;

  return (
    <div className="pb-24">
      <PageHeader
        title="Report"
        subtitle="Pick a date to see that day's activity"
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

        {dayLoading ? (
          <div className="space-y-2 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white rounded-2xl p-4 shadow-tile">
                <p className="text-xs text-ink-400 uppercase tracking-wide">Loan Given Today</p>
                <p className="font-display text-xl font-bold text-debt mt-1">{currency(loanGiven)}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-tile">
                <p className="text-xs text-ink-400 uppercase tracking-wide">Loan Recovered Today</p>
                <p className="font-display text-xl font-bold text-credit mt-1">{currency(loanRecovered)}</p>
              </div>
            </div>

            {/* Net change flips color based on direction: red when today's
                new credit outweighs what came back (outstanding loan grew),
                green when more was recovered than given out. */}
            <div
              className={`rounded-2xl p-5 mb-6 shadow-tile text-white ${
                netChange > 0 ? "bg-debt" : netChange < 0 ? "bg-credit" : "bg-ink-400"
              }`}
            >
              <p className="text-xs uppercase tracking-wide opacity-90">Net Change</p>
              <p className="font-display text-3xl font-bold mt-1">
                {netChange > 0 ? "+" : netChange < 0 ? "−" : ""} {currency(Math.abs(netChange))}
              </p>
              <p className="text-xs opacity-80 mt-1">
                {netChange > 0
                  ? "Total outstanding loan grew today"
                  : netChange < 0
                  ? "Total outstanding loan shrank today"
                  : "No net change today"}
              </p>
            </div>
          </>
        )}

        <h2 className="font-semibold text-ink-900 text-sm mb-2">Loan / Advance entries on this date</h2>
        {dayLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : dayTransactions.length === 0 ? (
          <p className="text-sm text-ink-400 text-center mt-4">No loan/advance activity on this date.</p>
        ) : (
          <div className="space-y-2">
            {dayTransactions.map((txn) => {
              const meta = ENTRY_META[txn.type] || { label: txn.type, color: "text-ink-900" };
              return (
                <div key={txn._id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-tile">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {txn.customer?.name || "Unknown customer"}
                    </p>
                    <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
                    <p className="text-xs text-ink-400">
                      {new Date(txn.transactionDate).toLocaleTimeString("en-PK", { timeStyle: "short" })}
                    </p>
                    {txn.note && <p className="text-xs text-ink-400 truncate">{txn.note}</p>}
                  </div>
                  <span className={`font-semibold text-sm shrink-0 ml-3 ${meta.color}`}>
                    {currency(txn.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReport;