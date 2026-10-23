
import { useEffect, useRef, useState } from "react";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

import { NavLink } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";

import { RoleGuard } from "../RoleGuard";
import { useAuth } from "../../lib/useAuth";
import { supabase } from "../../lib/supabase";

import {
  portalNavigation,
  supervisorNavigation,
} from "./portalNavigation";

export function MenuDrawer() {
  const reduceMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const { role, user } = useAuth();

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
      return;
    }

    window.location.href = "/";
  };

  const SupervisorIcon = supervisorNavigation.icon;

  const navClass = (isActive: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-[#e7f3ff] text-[#2379c2]"
        : "text-[#4b617d] hover:bg-[#f1f7fc] hover:text-[#1d76bb]"
    }`;

  return (
    <div
      ref={menuRef}
      className="cf-mobile-menu relative shrink-0"
    >
      {/* Animated hamburger button */}
      <motion.div
        whileTap={
          reduceMotion ? undefined : { scale: 0.92 }
        }
        transition={{ duration: 0.15 }}
      >
        <button
          type="button"
          onClick={() =>
            setIsOpen((current) => !current)
          }
          aria-label={
            isOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={isOpen}
          aria-controls="mobile-navigation-panel"
          className="grid h-10 w-10 place-items-center rounded-lg border border-[#dbe5ee] bg-white text-[#28415e] transition-colors hover:bg-[#edf4fb]"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </motion.div>

      {/* Animated navigation dropdown */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="mobile-navigation-panel"
            key="mobile-navigation"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    x: -20,
                    scale: 0.97,
                  }
            }
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    x: -14,
                    scale: 0.98,
                  }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.24,
              ease: "easeOut",
            }}
            className="absolute left-0 top-full z-50 mt-2 w-[min(290px,calc(100vw-32px))] origin-top-left overflow-hidden rounded-xl border border-[#dbe5ee] bg-white shadow-xl"
          >
            {/* Workspace navigation */}
            <div className="px-3 pt-4 pb-2">
              <p className="px-3 pb-2 text-[10px] font-extrabold tracking-[0.16em] text-[#8599af]">
                WORKSPACE
              </p>

              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-1"
              >
                {portalNavigation.map(
                  ({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/orders"}
                      onClick={() =>
                        setIsOpen(false)
                      }
                      className={({ isActive }) =>
                        navClass(isActive)
                      }
                    >
                      <Icon
                        size={19}
                        strokeWidth={1.8}
                      />
                      <span>{label}</span>
                    </NavLink>
                  ),
                )}

                {/* Supervisor-only navigation */}
                <RoleGuard
                  currentRole={role}
                  allowedRoles={[
                    "supervisor",
                    "admin",
                  ]}
                >
                  <NavLink
                    to={supervisorNavigation.to}
                    onClick={() =>
                      setIsOpen(false)
                    }
                    className={({ isActive }) =>
                      navClass(isActive)
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
            </div>

            {/* User information and logout */}
            <div className="border-t border-[#e3ebf3] px-3 py-3">
              {user?.email && (
                <p
                  title={user.email}
                  className="truncate px-3 py-2 text-xs text-[#6a7f99]"
                >
                  Signed in as {user.email}
                </p>
              )}

              <button
                type="button"
                disabled={loggingOut}
                onClick={() =>
                  void handleLogout()
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#b64641] hover:bg-[#fff1ef] disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />

                {loggingOut
                  ? "Logging out..."
                  : "Log out"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
