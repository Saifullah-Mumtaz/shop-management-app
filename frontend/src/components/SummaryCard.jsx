import { memo } from "react";

const SummaryCard = ({ label, value, accent = "brand", subtext }) => {
  const accentClasses = {
    brand: "bg-brand-50 text-brand-600",
    debt: "bg-red-50 text-debt",
    credit: "bg-emerald-50 text-credit",
    chill: "bg-chill-100 text-chill-500",
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-tile flex flex-col gap-1 min-w-0">
      <span className="text-xs font-medium text-ink-400 uppercase tracking-wide truncate">
        {label}
      </span>
      <span className="font-display text-2xl font-bold text-ink-900 truncate">{value}</span>
      {subtext && (
        <span
          className={`self-start mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${accentClasses[accent]}`}
        >
          {subtext}
        </span>
      )}
    </div>
  );
};

export default memo(SummaryCard);