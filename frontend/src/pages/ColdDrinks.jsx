import { useEffect, useState, memo, useCallback } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { useProducts, useProductActions } from "../context/AppContext";
import PageHeader from "../components/PageHeader";
import api from "../api/axios";

const currency = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    n || 0
  );

const DrinkTile = memo(({ product, onSell }) => {
  const [pulsing, setPulsing] = useState(false);

  const handleTap = useCallback(() => {
    setPulsing(true);
    onSell(product._id);
    setTimeout(() => setPulsing(false), 180);
  }, [onSell, product._id]);

  return (
    <button
      onClick={handleTap}
      className={`relative flex flex-col items-center rounded-2xl bg-white p-3 shadow-tile
        active:scale-95 transition-transform duration-150 touch-manipulation
        ${pulsing ? "ring-2 ring-chill-400" : ""}`}
    >
      {product.dailyCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-chill-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow">
          {product.dailyCount}
        </span>
      )}
      <img
        src={product.imageUrl}
        alt={`${product.name} ${product.variant}`}
        loading="lazy"
        className="h-20 w-20 object-contain mb-2"
      />
      <span className="font-body text-sm font-semibold text-ink-900 text-center leading-tight">
        {product.name}
      </span>
      <span className="text-xs text-ink-400 mb-1">{product.variant}</span>
      <span className="font-display text-sm font-bold text-brand-600">{currency(product.price)}</span>
    </button>
  );
});
DrinkTile.displayName = "DrinkTile";

const ColdDrinks = () => {
  const { products, loading, error } = useProducts();
  const { fetchProducts, sellProduct } = useProductActions();
  const [resetting, setResetting] = useState(false);

  // Recent sales log — kept separate from the Products context since it's
  // its own list with its own loading state, only used on this page.
  const [recentSales, setRecentSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [undoingId, setUndoingId] = useState(null);

  useEffect(() => {
    fetchProducts("cold_drink");
  }, [fetchProducts]);

  const loadRecentSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      const res = await api.get("/products/sales/recent");
      setRecentSales(res.data);
    } catch (err) {
      console.error("Couldn't load recent sales", err);
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentSales();
  }, [loadRecentSales]);

  const handleSell = useCallback(
    (productId) => {
      sellProduct(productId, 1)
        .then(() => loadRecentSales()) // refresh the log so the new tap shows up immediately
        .catch(() => {
          console.error("Sale failed — will be out of sync until next refresh");
        });
    },
    [sellProduct, loadRecentSales]
  );

  // Fully reverses a mis-tap or an exchanged bottle: removes it from both
  // the product's running counter and the sales log, then re-fetches both
  // so the grid's count badge and this list stay in sync.
  const handleUndo = async (saleId) => {
    if (!confirm("Undo this sale?")) return;
    setUndoingId(saleId);
    try {
      await api.delete(`/products/sales/${saleId}`);
      await Promise.all([fetchProducts("cold_drink"), loadRecentSales()]);
    } catch (err) {
      alert(err.message);
    } finally {
      setUndoingId(null);
    }
  };

  const handleResetDay = async () => {
    if (!confirm("Reset today's cold drink sales to zero? This can't be undone.")) return;
    setResetting(true);
    try {
      await api.post("/products/reset-daily");
      await Promise.all([fetchProducts("cold_drink"), loadRecentSales()]);
    } catch (err) {
      alert(err.message);
    } finally {
      setResetting(false);
    }
  };

  const todayTotal = products.reduce((sum, p) => sum + (p.dailyRevenue || 0), 0);
  const todayUnits = products.reduce((sum, p) => sum + (p.dailyCount || 0), 0);
  const todayProfit = products.reduce((sum, p) => sum + (p.dailyCount || 0) * (p.profit || 0), 0);

  return (
    <div className="pb-24">
      <PageHeader
        title="Cold Drinks"
        subtitle="Tap a drink to log a sale"
        tone="chill"
        action={
          <div className="text-right shrink-0">
            <p className="font-display text-lg font-bold">{currency(todayTotal)}</p>
            <p className="text-xs text-white/80">{todayUnits} sold today</p>
          </div>
        }
      />

      <div className="px-4 -mt-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4 bg-white rounded-xl p-3 shadow-tile">
          <div>
            <p className="text-xs text-ink-400">Estimated profit today</p>
            <p className="font-semibold text-credit">{currency(todayProfit)}</p>
          </div>
          <button
            onClick={handleResetDay}
            disabled={resetting}
            className="flex items-center gap-1 text-debt text-xs font-semibold border border-red-100 rounded-lg px-3 py-2"
          >
            <RotateCcw size={14} /> {resetting ? "Resetting…" : "Reset day"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 text-debt text-sm p-3 shadow-tile">
            Couldn't load drinks: {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {products.map((product) => (
              <DrinkTile key={product._id} product={product} onSell={handleSell} />
            ))}
          </div>
        )}

        {/* Undo a mis-tap or a bottle the customer wants to exchange — tap
            the trash-with-arrow icon on the exact sale that needs reversing. */}
        <h2 className="font-semibold text-ink-900 text-sm mb-2">Recent Sales</h2>
        {salesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : recentSales.length === 0 ? (
          <p className="text-sm text-ink-400 text-center mt-4">No sales yet.</p>
        ) : (
          <div className="space-y-2">
            {recentSales.map((sale) => (
              <div key={sale._id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-tile">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">
                    {sale.product?.name} {sale.product?.variant}
                    {sale.quantity > 1 ? ` × ${sale.quantity}` : ""}
                  </p>
                  <p className="text-xs text-ink-400">
                    {new Date(sale.transactionDate).toLocaleTimeString("en-PK", { timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="font-semibold text-sm text-ink-900">{currency(sale.amount)}</span>
                  <button
                    onClick={() => handleUndo(sale._id)}
                    disabled={undoingId === sale._id}
                    className="text-debt p-1 disabled:opacity-40"
                    aria-label="Undo sale"
                  >
                    <Undo2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ColdDrinks;