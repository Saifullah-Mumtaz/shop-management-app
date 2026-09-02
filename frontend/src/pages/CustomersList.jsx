import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCustomers, useCustomerActions } from "../context/AppContext";
import CustomerCard from "../components/CustomerCard";
import BottomSheet from "../components/BottomSheet";
import PageHeader from "../components/PageHeader";

const LABELS = {
  loan: { title: "Loan Accounts", cta: "Add loan customer", tone: "debt" },
  advance: { title: "Advance (ADD) Accounts", cta: "Add advance customer", tone: "credit" },
};

const CustomersList = ({ accountType }) => {
  const { customers, loading, error } = useCustomers();
  const { fetchCustomers, createCustomer } = useCustomerActions();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "", amount: "", note: "" });
  const [saving, setSaving] = useState(false);

  const isLoan = accountType === "loan";

  useEffect(() => {
    fetchCustomers(accountType);
  }, [fetchCustomers, accountType]);

  const filtered = customers.filter(
    (c) => c.accountType === accountType && c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createCustomer({ ...form, accountType });
      setForm({ name: "", phone: "", notes: "", amount: "", note: "" });
      setSheetOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const { title, cta, tone } = LABELS[accountType];

  return (
    <div className="pb-24">
      <PageHeader
        title={title}
        subtitle={`${filtered.length} account${filtered.length === 1 ? "" : "s"}`}
        tone={tone}
        action={
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-2 rounded-xl shrink-0"
          >
            <Plus size={16} /> New
          </button>
        }
      />

      <div className="px-4 -mt-6 max-w-lg mx-auto">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="w-full rounded-xl bg-white border border-ink-100 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-400 shadow-tile"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 text-debt text-sm p-3 shadow-tile">
            Couldn't load accounts: {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center mt-10 bg-white rounded-2xl p-6 shadow-tile">
            <p className="text-sm text-ink-400 mb-3">No accounts yet.</p>
            <button onClick={() => setSheetOpen(true)} className="text-brand-500 text-sm font-semibold">
              + {cta}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <CustomerCard key={c._id} customer={c} />
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={cta}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            required
            autoFocus
            className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />

          {isLoan ? (
            <>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount"
                className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
              />
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Note (optional)"
                className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
              />
            </>
          ) : (
            <>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone (optional)"
                className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
              />
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
              />
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

export default CustomersList;