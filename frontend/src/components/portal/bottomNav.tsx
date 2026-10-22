
import {
  ClipboardList,
  LayoutGrid,
  Plus,
} from "lucide-react";

import {
  Link,
  useLocation,
} from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();

  const dashboardActive =
    location.pathname === "/dashboard";

  const newOrderActive =
    location.pathname === "/orders/new";

  const ordersActive =
    location.pathname.startsWith("/orders") &&
    !newOrderActive;

  const navClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
      active
        ? "text-[#2582ce]"
        : "text-[#6e8199]"
    }`;

  return (
    <nav className="cf-bottom-nav">
      {/* Dashboard */}
      <Link
        to="/dashboard"
        className={navClass(dashboardActive)}
      >
        <LayoutGrid className="h-6 w-6" />
        <span>Dashboard</span>
      </Link>

      {/* New Order - Middle */}
      <Link
        to="/orders/new"
        aria-label="Create new order"
        className={navClass(newOrderActive)}
      >
        <Plus className="h-6 w-6" />
        <span>New order</span>
      </Link>

      {/* Orders */}
      <Link
        to="/orders"
        className={navClass(ordersActive)}
      >
        <ClipboardList className="h-6 w-6" />
        <span>Orders</span>
      </Link>
    </nav>
  );
}
