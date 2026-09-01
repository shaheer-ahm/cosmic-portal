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
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[520px] -translate-x-1/2 items-center justify-around border-t border-[#292c34] bg-[#181a20] px-4 py-3">
      <Link
        to="/dashboard"
        className={`flex flex-col items-center gap-1 text-[11px] ${
          dashboardActive
            ? "text-[#7180ff]"
            : "text-[#666a75]"
        }`}
      >
        <LayoutGrid className="h-6 w-6" />
        <span>Dashboard</span>
      </Link>

      <Link
        to="/orders"
        className={`flex flex-col items-center gap-1 text-[11px] ${
          ordersActive
            ? "text-[#7180ff]"
            : "text-[#666a75]"
        }`}
       
      >
        <ClipboardList className="h-6 w-6" />
        <span>Orders</span>
      </Link>

      <Link
        to="/orders/new"
        aria-label="Create new order"
        className="grid h-16 w-16 -translate-y-4 place-items-center rounded-full bg-[#6675ff] text-white shadow-[0_0_30px_rgba(102,117,255,0.35)]"
      >
        <Plus className="h-8 w-8" />
      </Link>

      <Link
        to="/integration"
        className={`flex flex-col items-center gap-1 text-[11px] ${
          integrationActive
            ? "text-[#7180ff]"
            : "text-[#666a75]"
        }`}
      >
        <Zap className="h-6 w-6" />
        <span>Integr.</span>
      </Link>
    </nav>
  );
}