import { memo } from "react";
import { Link } from "react-router-dom";

const currency = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(
    n || 0
  );

const CustomerCard = ({ customer }) => {
  const isDebt = customer.accountType === "loan" && customer.balance > 0;
  return (
    <Link
      to={`/customers/${customer._id}`}
      className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-tile active:scale-[0.98] transition-transform"
    >
      <div className="min-w-0">
        <p className="font-body font-semibold text-ink-900 truncate">{customer.name}</p>
        {customer.phone && <p className="text-xs text-ink-400">{customer.phone}</p>}
      </div>
      <span
        className={`font-display font-bold text-sm shrink-0 ml-3 ${
          isDebt ? "text-debt" : "text-credit"
        }`}
      >
        {currency(customer.balance)}
      </span>
    </Link>
  );
};

export default memo(CustomerCard);