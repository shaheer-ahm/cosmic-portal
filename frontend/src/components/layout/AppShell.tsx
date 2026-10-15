import type { PropsWithChildren } from "react";
import BottomNav from "../portal/bottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

type AppShellProps = PropsWithChildren<{
  showBottomNav?: boolean;
}>;

export function AppShell({ children, showBottomNav = true }: AppShellProps) {
  return (
    <div className="cf-app-shell">
      <DesktopSidebar />
      <div className="cf-app-main">
        <div className={showBottomNav ? "cf-app-content cf-with-mobile-nav" : "cf-app-content"}>
          {children}
        </div>
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
