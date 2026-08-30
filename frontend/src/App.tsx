import { Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/dashboard";
import NewOrderPage from "./pages/newOrders";
import ResultPage from "./pages/result";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/orders/new" element={<NewOrderPage />} />
      <Route path="/results/:orderId" element={<ResultPage />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}