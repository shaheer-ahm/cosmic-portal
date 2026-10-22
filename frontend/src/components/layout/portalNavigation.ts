
import {
  ClipboardList,
  LayoutDashboard,
  PackagePlus,
  Plug,
  ShieldCheck,
} from "lucide-react";

export const portalNavigation = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/orders",
    label: "Orders",
    icon: ClipboardList,
  },
  {
    to: "/orders/new",
    label: "New order",
    icon: PackagePlus,
  },
  {
    to: "/integration",
    label: "Integration",
    icon: Plug,
  },
];

export const supervisorNavigation = {
  to: "/profiles",
  label: "Profiles Management",
  icon: ShieldCheck,
};
