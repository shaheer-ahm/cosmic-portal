import { Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/dashboard";
import { OrdersPage } from "./pages/orders";
import NewOrderPage from "./pages/newOrders";
import ResultPage from "./pages/result";
import Integration from './pages/integration';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/orders/new" element={<NewOrderPage />} />
      <Route path="/results/:orderId" element={<ResultPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:orderId" element={<ResultPage />} />
      <Route path="/integration" element={<Integration />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}