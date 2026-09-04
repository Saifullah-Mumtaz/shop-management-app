import { useEffect, useState, memo, useCallback } from "react";
import { RotateCcw, Plus, Minus } from "lucide-react";
import { useProducts, useProductActions } from "../context/AppContext";
import PageHeader from "../components/PageHeader";
import api from "../api/axios";

const currency = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    n || 0
  );

// Tapping the image/name area still logs a quick sale (fast path for the
// common case). The small +/- row underneath is for corrections: bump the
// count up or down by one without leaving the grid or hunting through a
// separate sales list.
const DrinkTile = memo(({ product, onAdd, onSubtract }) => {
  const [pulsing, setPulsing] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleQuickAdd = useCallback(() => {
    setPulsing(true);
    onAdd(product._id);
    setTimeout(() => setPulsing(false), 180);
  }, [onAdd, product._id]);

  const handlePlus = async (e) => {
    e.stopPropagation();
    setBusy(true);
    await onAdd(product._id);
    setBusy(false);
  };

  const handleMinus = async (e) => {
    e.stopPropagation();
    if (product.dailyCount <= 0) return;
    setBusy(true);
    await onSubtract(product._id);
    setBusy(false);
  };

  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl bg-white p-3 shadow-tile
        transition-transform duration-150 ${pulsing ? "ring-2 ring-chill-400" : ""}`}
    >
      {product.dailyCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-chill-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow">
          {product.dailyCount}
        </span>
      )}
      <button onClick={handleQuickAdd} className="flex flex-col items-center active:scale-95 transition-transform">
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

      {/* Small +/- row for corrections */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleMinus}
          disabled={busy || product.dailyCount <= 0}
          className="h-7 w-7 rounded-full bg-red-50 text-debt flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
          aria-label="Subtract one"
        >
          <Minus size={14} strokeWidth={3} />
        </button>
        <button
          onClick={handlePlus}
          disabled={busy}
          className="h-7 w-7 rounded-full bg-chill-100 text-chill-500 flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
          aria-label="Add one"
        >
          <Plus size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
});
DrinkTile.displayName = "DrinkTile";

const ColdDrinks = () => {
  const { products, loading, error } = useProducts();
  const { fetchProducts, sellProduct } = useProductActions();
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchProducts("cold_drink");
  }, [fetchProducts]);

  const handleAdd = useCallback(
    async (productId) => {
      try {
        await sellProduct(productId, 1);
      } catch (err) {
        console.error("Add failed", err);
      }
    },
    [sellProduct]
  );

  // Subtract isn't in AppContext (it's specific to this page's correction
  // flow), so it's called directly and the shared product list is
  // refetched to pick up the new count.
  const handleSubtract = useCallback(
    async (productId) => {
      try {
        await api.post(`/products/${productId}/subtract`, { quantity: 1 });
        await fetchProducts("cold_drink");
      } catch (err) {
        console.error("Subtract failed", err);
      }
    },
    [fetchProducts]
  );

  const handleResetDay = async () => {
    if (!confirm("Reset today's cold drink sales to zero? This can't be undone.")) return;
    setResetting(true);
    try {
      await api.post("/products/reset-daily");
      await fetchProducts("cold_drink");
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
        subtitle="Tap a drink, or use +/- to adjust"
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
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {products.map((product) => (
              <DrinkTile key={product._id} product={product} onAdd={handleAdd} onSubtract={handleSubtract} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ColdDrinks;