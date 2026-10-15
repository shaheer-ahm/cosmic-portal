import { ClipboardList, LayoutDashboard, PackagePlus, Plug, ShieldCheck, Boxes } from "lucide-react";
import { NavLink } from "react-router-dom";
import { RoleGuard } from "../RoleGuard";
import { useAuth } from "../../lib/useAuth";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Orders", icon: ClipboardList, end: true },
  { to: "/orders/new", label: "New order", icon: PackagePlus, end: true },
  { to: "/integration", label: "Integration", icon: Plug, end: true },
];

export function DesktopSidebar() {
  const { role } = useAuth();

  return (
    <aside className="cf-sidebar" aria-label="Primary navigation">
      <div className="cf-brand">
        <div className="cf-brand-mark"><Boxes size={25} strokeWidth={1.75} /></div>
        <div>
          <div className="cf-brand-title">COSMIC FIT</div>
          <div className="cf-brand-subtitle">Carton optimisation</div>
        </div>
      </div>
      <div className="cf-sidebar-label">WORKSPACE</div>
      <nav className="cf-sidebar-links">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({isActive}) => `cf-sidebar-link${isActive ? " cf-sidebar-active" : ""}`}>
            <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
          </NavLink>
        ))}
        <RoleGuard currentRole={role} allowedRoles={["supervisor", "admin"]}>
          <NavLink to="/profiles" className={({isActive}) => `cf-sidebar-link${isActive ? " cf-sidebar-active" : ""}`}>
            <ShieldCheck size={19} strokeWidth={1.8} /><span>Profiles Management</span>
          </NavLink>
        </RoleGuard>
      </nav>
      <div className="cf-sidebar-foot">
        <span className="cf-foot-dot" /> FitPortal / Project Perfect Fit
        <div className="cf-foot-note">Warehouse operations workspace</div>
      </div>
    </aside>
  );
}
