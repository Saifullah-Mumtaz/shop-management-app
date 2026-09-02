import { NavLink } from "react-router-dom";
import { LayoutGrid, HandCoins, PiggyBank, CupSoda, ClipboardList, Wallet } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: LayoutGrid, end: true },
  { to: "/loans", label: "Loans", icon: HandCoins },
  { to: "/advances", label: "Advance", icon: PiggyBank },
  { to: "/drinks", label: "Drinks", icon: CupSoda },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/report", label: "Report", icon: ClipboardList },
];

const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-ink-100 safe-bottom">
    <div className="max-w-lg mx-auto flex justify-between px-1">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2 px-1.5 flex-1 text-[10px] font-medium transition-colors ${
              isActive ? "text-brand-500" : "text-ink-400"
            }`
          }
        >
          <Icon size={20} strokeWidth={2.25} />
          {label}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;