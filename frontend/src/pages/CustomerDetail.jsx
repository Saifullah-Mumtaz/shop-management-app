import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Pencil, ArrowUpRight, ArrowDownLeft, Share2 } from "lucide-react";
import { jsPDF } from "jspdf";
import api from "../api/axios";
import { useCustomerActions } from "../context/AppContext";
import BottomSheet from "../components/BottomSheet";
import PageHeader from "../components/PageHeader";

const currency = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    n || 0
  );

const ACCOUNT_META = {
  loan: {
    subtitle: "Loan account",
    tone: "debt",
    givenType: "loan_given",
    repaidType: "loan_repaid",
    givenLabel: "Loan Given",
    repaidLabel: "Payment Received",
  },
  installment: {
    subtitle: "Installment account",
    tone: "debt",
    givenType: "installment_given",
    repaidType: "installment_repaid",
    givenLabel: "Item Given",
    repaidLabel: "Payment Received",
  },
  advance: {
    subtitle: "Advance account",
    tone: "credit",
    givenType: "advance_deposit",
    repaidType: "advance_used",
    givenLabel: "Add",
    repaidLabel: "Return",
  },
};

const TXN_META = {
  loan_given: { label: "Given", color: "text-debt", icon: ArrowUpRight, sign: "+" },
  loan_repaid: { label: "Payment received", color: "text-credit", icon: ArrowDownLeft, sign: "−" },
  installment_given: { label: "Item Given", color: "text-debt", icon: ArrowUpRight, sign: "+" },
  installment_repaid: { label: "Payment received", color: "text-credit", icon: ArrowDownLeft, sign: "−" },
  advance_deposit: { label: "Added", color: "text-credit", icon: ArrowUpRight, sign: "+" },
  advance_used: { label: "Returned", color: "text-debt", icon: ArrowDownLeft, sign: "−" },
};

// 🎨 PDF color palette
const PDF_COLORS = {
  green: [22, 163, 74],     // payment received / credit
  red: [220, 38, 38],       // loan / given
  gray: [51, 65, 85],       // neutral text
  lightGray: [100, 116, 139],
  headerBlue: [41, 128, 185],
  border: [226, 232, 240],
  bgLight: [248, 250, 252],
  dark: [15, 23, 42],
};

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addTransaction } = useCustomerActions();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ type: "", amount: "", note: "" });
  const [saving, setSaving] = useState(false);

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

  const accountType = customer?.accountType;
  const meta = ACCOUNT_META[accountType] || ACCOUNT_META.advance;
  const isDebtAccount = accountType === "loan" || accountType === "installment";

  // --- NATIVE PDF GENERATION & WHATSAPP SHARING LOGIC ---
  const handleShareWhatsAppPDF = async () => {
    if (!customer) return;

    const doc = new jsPDF();
    const shopName = "Bahadur Photostate and Communication";
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const tableWidth = pageWidth - marginX * 2;

    // ===== HEADER =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
    doc.text(shopName, marginX, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(PDF_COLORS.lightGray[0], PDF_COLORS.lightGray[1], PDF_COLORS.lightGray[2]);
    doc.text("Customer Account History", marginX, 25);

    // Generated timestamp (top-right)
    const generatedOn = new Date().toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
    doc.setFontSize(8.5);
    doc.text(`Generated: ${generatedOn}`, pageWidth - marginX, 18, { align: "right" });

    // Thin divider under header
    doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
    doc.setLineWidth(0.4);
    doc.line(marginX, 27, pageWidth - marginX, 27);

    // ===== CUSTOMER INFO BOX =====
    doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
    doc.setFillColor(PDF_COLORS.bgLight[0], PDF_COLORS.bgLight[1], PDF_COLORS.bgLight[2]);
    doc.roundedRect(marginX, 32, tableWidth, 22, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(PDF_COLORS.dark[0], PDF_COLORS.dark[1], PDF_COLORS.dark[2]);
    doc.text(`Customer: ${customer.name}`, marginX + 4, 40);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(PDF_COLORS.lightGray[0], PDF_COLORS.lightGray[1], PDF_COLORS.lightGray[2]);
    doc.text(`Phone: ${customer.phone || "N/A"}`, marginX + 4, 48);

    const balanceColor = isDebtAccount ? PDF_COLORS.red : PDF_COLORS.green;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.text(`Balance: ${currency(customer.balance)}`, pageWidth - marginX - 4, 44, { align: "right" });

    // ===== TABLE HEADER =====
    let currentY = 62;
    const drawTableHeader = (y) => {
      doc.setFillColor(PDF_COLORS.headerBlue[0], PDF_COLORS.headerBlue[1], PDF_COLORS.headerBlue[2]);
      doc.roundedRect(marginX, y, tableWidth, 9, 1.5, 1.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("Date & Time", marginX + 4, y + 6);
      doc.text("Type", marginX + 54, y + 6);
      doc.text("Note", marginX + 94, y + 6);
      doc.text("Amount", pageWidth - marginX - 4, y + 6, { align: "right" });
      return y + 9;
    };

    currentY = drawTableHeader(currentY);

    // ===== TABLE ROWS =====
    const history = customer.history || [];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let totalReceived = 0;
    let totalGiven = 0;

    history.forEach((txn, index) => {
      if (currentY > 268) {
        doc.addPage();
        currentY = 20;
        currentY = drawTableHeader(currentY);
      }

      const tMeta = TXN_META[txn.type];
      const label = tMeta?.label || txn.type;
      const sign = tMeta?.sign || "";
      const amountStr = `${sign} ${currency(txn.amount)}`;
      const isCredit = tMeta?.color === "text-credit";
      const rowColor = isCredit ? PDF_COLORS.green : PDF_COLORS.red;

      if (isCredit) totalReceived += txn.amount;
      else totalGiven += txn.amount;

      const formattedDate = new Date(txn.transactionDate).toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const rowHeight = 9;

      if (index % 2 !== 0) {
        doc.setFillColor(PDF_COLORS.bgLight[0], PDF_COLORS.bgLight[1], PDF_COLORS.bgLight[2]);
        doc.rect(marginX, currentY, tableWidth, rowHeight, "F");
      }

      doc.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
      doc.rect(marginX, currentY, 1.2, rowHeight, "F");
      doc.circle(marginX + 55, currentY + rowHeight / 2 - 0.5, 1, "F");

      doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
      doc.text(formattedDate, marginX + 4, currentY + 6);

      doc.setTextColor(rowColor[0], rowColor[1], rowColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(label, marginX + 58, currentY + 6);
      doc.setFont("helvetica", "normal");

      doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
      doc.text(txn.note || "-", marginX + 94, currentY + 6, { maxWidth: 55 });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(rowColor[0], rowColor[1], rowColor[2]);
      doc.text(amountStr, pageWidth - marginX - 4, currentY + 6, { align: "right" });
      doc.setFont("helvetica", "normal");

      currentY += rowHeight;
    });

    doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);

    // ===== SUMMARY BOX =====
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    currentY += 8;

    doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
    doc.setFillColor(PDF_COLORS.bgLight[0], PDF_COLORS.bgLight[1], PDF_COLORS.bgLight[2]);
    doc.roundedRect(marginX, currentY, tableWidth, 20, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.setTextColor(PDF_COLORS.green[0], PDF_COLORS.green[1], PDF_COLORS.green[2]);
    doc.text(`Total Received: ${currency(totalReceived)}`, marginX + 4, currentY + 8);

    doc.setTextColor(PDF_COLORS.red[0], PDF_COLORS.red[1], PDF_COLORS.red[2]);
    doc.text(`Total Given: ${currency(totalGiven)}`, marginX + 4, currentY + 15.5);

    doc.setFontSize(11);
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.text(`Net Balance: ${currency(customer.balance)}`, pageWidth - marginX - 4, currentY + 11.5, {
      align: "right",
    });

    // ===== FOOTER =====
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(PDF_COLORS.lightGray[0], PDF_COLORS.lightGray[1], PDF_COLORS.lightGray[2]);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: "center" });
      doc.text(shopName, marginX, 290);
    }

    // ===== OUTPUT PDF =====
    const pdfBlob = doc.output("blob");
    const fileName = `${customer.name.replace(/\s+/g, '_')}_Statement.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    const canFileShare =
      navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] });

    let shareFailed = false;

    if (canFileShare) {
      try {
        await navigator.share({
          title: `Ledger Statement - ${customer.name}`,
          text: `Hello ${customer.name}, here is your latest statement from ${shopName}. Remaining Balance: ${currency(customer.balance)}`,
          files: [pdfFile],
        });
        return;
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        shareFailed = true;
      }
    }

    if (isStandalone && (!canFileShare || shareFailed)) {
      const confirmOpen = window.confirm(
        "PDF share karne ke liye is app ko apne browser (Chrome) mein khulna zaroori hai. Ab open karna chahte hain?"
      );
      if (confirmOpen) {
        window.open(window.location.href, "_blank");
      }
      return;
    }

    const pdfUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = pdfUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    if (customer.phone) {
      const phoneClean = customer.phone.replace(/\D/g, "");
      const waText = encodeURIComponent(
        `Hello *${customer.name}*,\nHere is your statement from *${shopName}*.\nRemaining Balance: *${currency(customer.balance)}*\n*(PDF file downloaded to your device)*`
      );
      setTimeout(() => {
        window.open(`https://wa.me/${phoneClean}?text=${waText}`, "_blank");
      }, 500);
    }
  };

  const openAddSheet = () => {
    setAddForm({ type: "", amount: "", note: "" });
    setAddOpen(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.type || !addForm.amount) return;
    setSaving(true);
    try {
      await addTransaction({ customer: id, type: addForm.type, amount: Number(addForm.amount), note: addForm.note });
      setAddForm({ type: "", amount: "", note: "" });
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

  const handleDeleteTxn = async (txnId) => {
    if (!confirm("Remove this entry? The balance will be recalculated without it.")) return;
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
      navigate(`/${accountType}s`);
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
        subtitle={meta.subtitle}
        tone={meta.tone}
        action={
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/90 text-sm">
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <div className="px-4 -mt-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-tile mb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className={`font-display text-2xl font-bold ${isDebtAccount ? "text-debt" : "text-credit"}`}>
                {currency(customer.balance)}
              </p>
              <p className="text-xs text-ink-400">{isDebtAccount ? "Outstanding balance" : "Remaining credit"}</p>
              {customer.phone && <p className="text-xs text-ink-400 mt-2">{customer.phone}</p>}
            </div>

            <button
              onClick={handleShareWhatsAppPDF}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow transition-colors"
            >
              <Share2 size={14} /> WhatsApp PDF
            </button>
          </div>

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
          <button onClick={openAddSheet} className="flex items-center gap-1 text-brand-500 text-sm font-semibold">
            <Plus size={16} /> Add
          </button>
        </div>

        {customer.history?.length === 0 ? (
          <p className="text-sm text-ink-400 text-center mt-8">No entries yet.</p>
        ) : (
          <div className="space-y-2">
            {customer.history.map((txn) => {
              const tMeta = TXN_META[txn.type] || { label: txn.type, color: "text-ink-900", icon: ArrowUpRight, sign: "" };
              const Icon = tMeta.icon;
              return (
                <div key={txn._id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-tile">
                  <div className="flex items-start gap-2 min-w-0">
                    <Icon size={16} className={`${tMeta.color} shrink-0 mt-0.5`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${tMeta.color}`}>{tMeta.label}</p>
                      <p className="text-xs text-ink-400">
                        {new Date(txn.transactionDate).toLocaleString("en-PK", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      {txn.note && <p className="text-xs text-ink-400 truncate">{txn.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <span className={`font-semibold text-sm mr-1 ${tMeta.color}`}>
                      {tMeta.sign} {currency(txn.amount)}
                    </span>
                    <button onClick={() => openEdit(txn)} className="text-ink-400 p-1" aria-label="Edit entry">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDeleteTxn(txn._id)} className="text-debt p-1" aria-label="Remove entry">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Add entry">
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAddForm({ ...addForm, type: meta.givenType })}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                addForm.type === meta.givenType
                  ? `${isDebtAccount ? "bg-debt border-debt" : "bg-credit border-credit"} text-white`
                  : `border-ink-100 ${isDebtAccount ? "text-debt" : "text-credit"}`
              }`}
            >
              {meta.givenLabel}
            </button>
            <button
              type="button"
              onClick={() => setAddForm({ ...addForm, type: meta.repaidType })}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                addForm.type === meta.repaidType
                  ? `${isDebtAccount ? "bg-credit border-credit" : "bg-debt border-debt"} text-white`
                  : `border-ink-100 ${isDebtAccount ? "text-credit" : "text-debt"}`
              }`}
            >
              {meta.repaidLabel}
            </button>
          </div>
          <input
            type="number"
            min="1"
            value={addForm.amount}
            onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
            placeholder="Amount"
            required
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
            disabled={saving || !addForm.type}
            className="w-full bg-brand-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </BottomSheet>

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