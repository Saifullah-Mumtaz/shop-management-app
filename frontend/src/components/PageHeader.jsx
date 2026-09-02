const TONES = {
  brand: "bg-gradient-to-br from-brand-500 to-brand-700",
  debt: "bg-gradient-to-br from-[#E07A63] to-debt",
  credit: "bg-gradient-to-br from-[#4CAE7B] to-credit",
  chill: "bg-gradient-to-br from-chill-400 to-chill-500",
};

// Colored header bar with rounded bottom — cards from the page below
// overlap it slightly (negative margin) for a layered, "financial app" feel
// instead of a flat white page.
const PageHeader = ({ title, subtitle, action, tone = "brand" }) => (
  <div className={`${TONES[tone]} text-white px-4 pt-6 pb-10 rounded-b-3xl shadow-tile`}>
    <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-bold truncate">{title}</h1>
        {subtitle && <p className="text-sm text-white/80 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {action}
    </div>
  </div>
);

export default PageHeader;