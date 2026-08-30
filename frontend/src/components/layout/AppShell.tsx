import type { PropsWithChildren } from "react";
import BottomNav from "../portal/bottomNav";

type AppShellProps = PropsWithChildren<{
  showBottomNav?: boolean;
}>;

export function AppShell({
  children,
  showBottomNav = true,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#090b10] text-white">
      <div className="mx-auto min-h-screen w-full max-w-[520px] bg-[#0d0f14]">
        <div className={showBottomNav ? "pb-28" : "pb-8"}>
          {children}
        </div>

        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}