import { Routes, Route } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Dashboard from "./pages/Dashboard";
import ColdDrinks from "./pages/ColdDrinks";
import CustomersList from "./pages/CustomersList";
import CustomerDetail from "./pages/CustomerDetail";
import DailyReport from "./pages/DailyReport";
import AccountsLedger from "./pages/AccountsLedger";

const App = () => (
  <div className="min-h-screen bg-ink-50 font-body text-ink-900">
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/loans" element={<CustomersList accountType="loan" />} />
      <Route path="/advances" element={<CustomersList accountType="advance" />} />
      <Route path="/installments" element={<CustomersList accountType="installment" />} />
      <Route path="/customers/:id" element={<CustomerDetail />} />
      <Route path="/drinks" element={<ColdDrinks />} />
      <Route path="/report" element={<DailyReport />} />
      <Route path="/accounts" element={<AccountsLedger />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
    <BottomNav />
  </div>
);

export default App;