import {
  ClipboardList,
  LayoutGrid,
  Plus,
  Zap,
} from "lucide-react";
import {
  Link,
  useLocation,
} from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();

  const dashboardActive =
    location.pathname === "/dashboard";
  const ordersActive = 
    location.pathname.startsWith("/orders") && location.pathname !== "/orders/new";
  const integrationActive = 
    location.pathname === "/integration";

  return (
    <nav className="cf-bottom-nav">
      <Link
        to="/dashboard"
        className={`flex flex-col items-center gap-1 text-[11px] ${
          dashboardActive
            ? "text-[#2582ce]"
            : "text-[#6e8199]"
        }`}
      >
        <LayoutGrid className="h-6 w-6" />
        <span>Dashboard</span>
      </Link>

      <Link
        to="/orders"
        className={`flex flex-col items-center gap-1 text-[11px] ${
          ordersActive
            ? "text-[#2582ce]"
            : "text-[#6e8199]"
        }`}
       
      >
        <ClipboardList className="h-6 w-6" />
        <span>Orders</span>
      </Link>

      <Link
        to="/orders/new"
        aria-label="Create new order"
        className="grid h-16 w-16 -translate-y-4 place-items-center rounded-full bg-[#2686d5] text-white shadow-[0_8px_22px_rgba(21,113,191,0.22)]"
      >
        <Plus className="h-8 w-8" />
      </Link>

      <Link
        to="/integration"
        className={`flex flex-col items-center gap-1 text-[11px] ${
          integrationActive
            ? "text-[#2582ce]"
            : "text-[#6e8199]"
        }`}
      >
        <Zap className="h-6 w-6" />
        <span>Integr.</span>
      </Link>
    </nav>
  );
}