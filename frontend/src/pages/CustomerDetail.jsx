import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import api from "../api/axios";
import { useCustomerActions } from "../context/AppContext";
import BottomSheet from "../components/BottomSheet";
import PageHeader from "../components/PageHeader";

const currency = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    n || 0
  );

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addTransaction } = useCustomerActions();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // "Add" sheet — creates a brand new entry
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ amount: "", note: "" });
  const [saving, setSaving] = useState(false);

  // "Edit" sheet — changes an existing entry's amount/note
  const [editTxn, setEditTxn] = useState(null);
  const [editForm, setEditForm] = useState({ amount: "", note: "" });
  const [editSaving, setEditSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isLoan = customer?.accountType === "loan";
  const entryType = isLoan ? "loan_given" : "advance_deposit";

  // Every "Add" is the same operation: a new entry that increases the
  // total. No type choice, no sign — exactly one thing this button does.
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.amount) return;
    setSaving(true);
    try {
      await addTransaction({ customer: id, type: entryType, amount: Number(addForm.amount), note: addForm.note });
      setAddForm({ amount: "", note: "" });
      setAddOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (txn) => {
    setEditTxn(txn);
    setEditForm({ amount: String(txn.amount), note: txn.note || "" });
  };

  // Changing an entry's amount adjusts the total by only the difference
  // (handled server-side) — e.g. editing a 1000 entry down to 600 reduces
  // the total by exactly 400.
  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm.amount) return;
    setEditSaving(true);
    try {
      await api.put(`/transactions/${editTxn._id}`, {
        amount: Number(editForm.amount),
        note: editForm.note,
      });
      setEditTxn(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // Removing an entry entirely subtracts its full amount from the total —
  // this is how "loan came back" is recorded: delete the entry for the
  // amount that was repaid.
  const handleDeleteTxn = async (txnId) => {
    if (!confirm("Remove this entry? The total will go down by this amount.")) return;
    try {
      await api.delete(`/transactions/${txnId}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(`Close ${customer.name}'s account permanently?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${id}`);
      navigate(isLoan ? "/loans" : "/advances");
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-4 max-w-lg mx-auto text-sm text-ink-400">Loading…</div>;
  }
  if (error || !customer) {
    return (
      <div className="p-4 max-w-lg mx-auto text-sm text-debt">
        Couldn't load customer: {error || "Not found"}
      </div>
    );
  }

  const canDelete = customer.balance === 0;

  return (
    <div className="pb-24">
      <PageHeader
        title={customer.name}
        subtitle={isLoan ? "Loan account" : "Advance account"}
        tone={isLoan ? "debt" : "credit"}
        action={
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/90 text-sm">
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <div className="px-4 -mt-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-tile mb-4">
          <p className={`font-display text-2xl font-bold ${isLoan ? "text-debt" : "text-credit"}`}>
            {currency(customer.balance)}
          </p>
          <p className="text-xs text-ink-400">{isLoan ? "Total loan" : "Remaining credit"}</p>
          {customer.phone && <p className="text-xs text-ink-400 mt-2">{customer.phone}</p>}

          {canDelete && (
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="mt-3 flex items-center gap-1 text-debt text-xs font-semibold"
            >
              <Trash2 size={14} /> {deleting ? "Closing…" : "Close this account"}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-ink-900 text-sm">History</h2>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1 text-brand-500 text-sm font-semibold">
            <Plus size={16} /> Add
          </button>
        </div>

        {customer.history?.length === 0 ? (
          <p className="text-sm text-ink-400 text-center mt-8">No entries yet.</p>
        ) : (
          <div className="space-y-2">
            {customer.history.map((txn) => (
              <div key={txn._id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-tile">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">{txn.note || "Entry"}</p>
                  <p className="text-xs text-ink-400">
                    {new Date(txn.transactionDate).toLocaleString("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <span className="font-semibold text-sm text-ink-900 mr-1">{currency(txn.amount)}</span>
                  <button onClick={() => openEdit(txn)} className="text-ink-400 p-1" aria-label="Edit entry">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDeleteTxn(txn._id)} className="text-debt p-1" aria-label="Remove entry">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add a new entry — Amount + Note only, single Save button. */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Add entry">
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            type="number"
            min="1"
            value={addForm.amount}
            onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
            placeholder="Amount"
            required
            autoFocus
            className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <input
            value={addForm.note}
            onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
            placeholder="Note (optional)"
            className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </BottomSheet>

      {/* Edit an existing entry — same shape as Add, prefilled. */}
      <BottomSheet open={!!editTxn} onClose={() => setEditTxn(null)} title="Edit entry">
        <form onSubmit={handleEditSave} className="space-y-3">
          <input
            type="number"
            min="1"
            value={editForm.amount}
            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
            placeholder="Amount"
            required
            autoFocus
            className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <input
            value={editForm.note}
            onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
            placeholder="Note (optional)"
            className="w-full rounded-xl border border-ink-100 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={editSaving}
            className="w-full bg-brand-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {editSaving ? "Saving…" : "Update"}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

export default CustomerDetail;