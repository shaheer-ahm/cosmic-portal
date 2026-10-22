
import { NavLink } from "react-router-dom";

import { RoleGuard } from "../RoleGuard";
import { useAuth } from "../../lib/useAuth";
import { PortalBrand } from "./PortalBrand";
import {
  portalNavigation,
  supervisorNavigation,
} from "./portalNavigation";

export function DesktopSidebar() {
  const { role } = useAuth();

  const SupervisorIcon = supervisorNavigation.icon;

  return (
    <aside
      className="cf-sidebar"
      aria-label="Primary navigation"
    >
      {/* Shared branding */}
      <div className="cf-brand">
        <PortalBrand />
      </div>

      <div className="cf-sidebar-label">
        WORKSPACE
      </div>

      <nav className="cf-sidebar-links">
        {portalNavigation.map(
          ({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/orders"}
              className={({ isActive }) =>
                `cf-sidebar-link${
                  isActive
                    ? " cf-sidebar-active"
                    : ""
                }`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ),
        )}

        <RoleGuard
          currentRole={role}
          allowedRoles={["supervisor", "admin"]}
        >
          <NavLink
            to={supervisorNavigation.to}
            className={({ isActive }) =>
              `cf-sidebar-link${
                isActive
                  ? " cf-sidebar-active"
                  : ""
              }`
            }
          >
            <SupervisorIcon
              size={19}
              strokeWidth={1.8}
            />
            <span>
              {supervisorNavigation.label}
            </span>
          </NavLink>
        </RoleGuard>
      </nav>

      <div className="cf-sidebar-foot">
        <span className="cf-foot-dot" />
        FitPortal / Project Perfect Fit

        <div className="cf-foot-note">
          Warehouse operations workspace
        </div>
      </div>
    </aside>
  );
}
