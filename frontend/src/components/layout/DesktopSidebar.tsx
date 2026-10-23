
import { NavLink } from "react-router-dom";
import {
  motion,
  useReducedMotion,
} from "motion/react";

import { RoleGuard } from "../RoleGuard";
import { useAuth } from "../../lib/useAuth";

import { PortalBrand } from "./PortalBrand";
import {
  portalNavigation,
  supervisorNavigation,
} from "./portalNavigation";

export function DesktopSidebar() {
  const { role } = useAuth();
  const reduceMotion = useReducedMotion();

  const SupervisorIcon = supervisorNavigation.icon;

  const navItem = (
    to: string,
    label: string,
    Icon: typeof SupervisorIcon,
  ) => (
    <NavLink
      key={to}
      to={to}
      end={to === "/orders" || to === "/dashboard"}
      className={({ isActive }) =>
        `group relative flex min-h-[45px] items-center gap-3 rounded-lg px-3.5 py-3 text-[13px] font-semibold transition-colors duration-200 ${
          isActive
            ? "text-[#2379c2]"
            : "text-[#4b617d] hover:bg-[#f1f7fc] hover:text-[#1d76bb]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Animated active background */}
          {isActive && (
            <motion.span
              layoutId="desktop-active-background"
              className="absolute inset-0 rounded-lg bg-[#e7f3ff]"
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 350,
                      damping: 32,
                    }
              }
              aria-hidden="true"
            />
          )}

          {/* Animated left indicator */}
          {isActive && (
            <motion.span
              layoutId="desktop-active-indicator"
              className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-[#4a86d4]"
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 350,
                      damping: 32,
                    }
              }
              aria-hidden="true"
            />
          )}

          {/* Hover movement for icon and label */}
          <motion.span
            whileHover={
              reduceMotion
                ? undefined
                : { x: 6 }
            }
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="relative z-10 flex min-w-0 items-center gap-3"
          >
            <motion.span
              whileHover={
                reduceMotion
                  ? undefined
                  : { scale: 1.15, rotate: -5 }
              }
              transition={{
                duration: 0.2,
              }}
              className="flex shrink-0 items-center justify-center"
            >
              <Icon
                size={19}
                strokeWidth={1.8}
              />
            </motion.span>

            <span>{label}</span>
          </motion.span>
        </>
      )}
    </NavLink>
  );

  return (
    <aside
      className="cf-sidebar"
      aria-label="Primary navigation"
    >
      {/* Existing Thomax / Cosmic Fit branding */}
      <div className="cf-brand">
        <PortalBrand />
      </div>

      <div className="cf-sidebar-label">
        WORKSPACE
      </div>

      <nav className="cf-sidebar-links">
        {portalNavigation.map(
          ({ to, label, icon }) =>
            navItem(to, label, icon),
        )}

        <RoleGuard
          currentRole={role}
          allowedRoles={["supervisor", "admin"]}
        >
          {navItem(
            supervisorNavigation.to,
            supervisorNavigation.label,
            SupervisorIcon,
          )}
        </RoleGuard>
      </nav>

      {/* Existing sidebar footer */}
      <div className="cf-sidebar-foot">
        <span className="cf-foot-dot" />
        {" "}FitPortal / Project Perfect Fit

        <div className="cf-foot-note">
          Warehouse operations workspace
        </div>
      </div>
    </aside>
  );
}
