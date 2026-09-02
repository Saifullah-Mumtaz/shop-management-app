import { useEffect, useState, useCallback } from "react";
import { Plus, Wallet, Trash2 } from "lucide-react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import BottomSheet from "../components/BottomSheet";

const currency = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    n || 0
  );

const AccountsLedger = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: "", balance: "" });
  const [saving, setSaving] = useState(false);

  const [editTarget, setEditTarget] = useState(null); // account being edited
  const [editBalance, setEditBalance] = useState("");
  const [saving2, setSaving2] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/fund-accounts");
      setAccounts(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newAccount.name.trim()) return;
    setSaving(true);
    try {
      await api.post("/fund-accounts", { name: newAccount.name, balance: Number(newAccount.balance) || 0 });
      setNewAccount({ name: "", balance: "" });
      setAddSheetOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Opens the edit sheet with the CURRENT balance pre-filled, so the owner
  // can just retype the real number and save — a plain overwrite, not an
  // add/subtract calculation.
  const openEdit = (acc) => {
    setEditTarget(acc);
    setEditBalance(String(acc.balance));
  };

  const handleSaveBalance = async (e) => {
    e.preventDefault();
    if (editBalance === "" || isNaN(Number(editBalance))) return;
    setSaving2(true);
    try {
      await api.put(`/fund-accounts/${editTarget._id}`, { balance: Number(editBalance) });
      setEditTarget(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving2(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(`Remove ${editTarget.name}?`)) return;
    setSaving2(true);
    try {
      await api.delete(`/fund-accounts/${editTarget._id}`);
      setEditTarget(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving2(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="pb-24">
      <PageHeader
        title="Accounts"
        subtitle="Mobile wallets, bank, Easy Load"
        tone="brand"
        action={
          <button
            onClick={() => setAddSheetOpen(true)}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-2 rounded-xl shrink-0"
          >
            <Plus size={16} /> New
          </button>
        }
      />

      <div className="px-4 -mt-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-tile mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-400">Total across all accounts</span>
          <span className="font-display text-lg font-bold text-ink-900">{currency(totalBalance)}</span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 text-debt text-sm p-3 shadow-tile">
            Couldn't load accounts: {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center mt-10 bg-white rounded-2xl p-6 shadow-tile">
            <Wallet className="mx-auto mb-2 text-ink-400" size={28} />
            <p className="text-sm text-ink-400 mb-3">No accounts yet — add your first one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => (
              <button
                key={acc._id}
                onClick={() => openEdit(acc)}
                className="w-full flex items-center justify-between bg-white rounded-2xl p-4 shadow-tile active:scale-[0.98] transition-transform"
              >
                <span className="font-medium text-ink-900">{acc.name}</span>
                <span className="font-display font-bold text-brand-600">{currency(acc.balance)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} title="New account">
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            value={newAccount.name}
            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
            placeholder="Account name (e.g. Easypaisa, HBL Bank)"
            required
            className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <input
            type="number"
            value={newAccount.balance}
            onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
            placeholder="Starting balance (optional)"
            className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create account"}
          </button>
        </form>
      </BottomSheet>

      {/* Tap an account -> just retype the real balance -> Save. No
          add/subtract math, exactly what was asked for. */}
      <BottomSheet open={!!editTarget} onClose={() => setEditTarget(null)} title={editTarget?.name}>
        {editTarget && (
          <form onSubmit={handleSaveBalance} className="space-y-3">
            <input
              type="number"
              value={editBalance}
              onChange={(e) => setEditBalance(e.target.value)}
              placeholder="Balance"
              required
              autoFocus
              className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
            />
            <button
              type="submit"
              disabled={saving2}
              className="w-full bg-brand-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
            >
              {saving2 ? "Saving…" : "Save balance"}
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={saving2}
              className="w-full flex items-center justify-center gap-1 text-debt text-sm font-semibold py-2"
            >
              <Trash2 size={14} /> Remove account
            </button>
          </form>
        )}
      </BottomSheet>
    </div>
  );
};

export default AccountsLedger;