
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { MenuDrawer } from "./MenuDrawer";

type PageHeaderProps = {
  title: string;
  right?: ReactNode;
  backTo?: string;
};

export function PageHeader({
  title,
  right,
  backTo = "/dashboard",
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="cf-top-header">

      {/* =====================================
          MOBILE HEADER
          Two-row layout
      ===================================== */}
      <div className="md:hidden">

        {/* Row 1: Menu + Thomax + Cosmic Fit */}
        <div className="flex min-h-[68px] items-center justify-between gap-3 px-4 py-3">

          <div className="flex min-w-0 items-center gap-3">
            <MenuDrawer />

            <img
              src="/thomax-logo.png"
              alt="Thomax"
              className="h-8 w-auto max-w-[125px] shrink object-contain object-left"
            />
          </div>

          <span className="shrink-0 text-xs font-semibold text-[#172f50]">
            Cosmic Fit
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-[#e3ebf3]" />

        {/* Row 2: Back + Page Title + Status */}
        <div className="flex min-h-[70px] items-center justify-between gap-2 px-4 py-3">

          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(backTo)}
              aria-label="Go back"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#dfe8f1] bg-white text-[#3d6181] transition-colors hover:bg-[#eaf3fb]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <h1 className="min-w-0 truncate text-lg font-bold text-[#172f50]">
              {title}
            </h1>
          </div>

          {right && (
            <div className="shrink-0">
              {right}
            </div>
          )}
        </div>
      </div>

      {/* =====================================
          DESKTOP HEADER
          Original single-row layout
      ===================================== */}
      <div className="hidden md:block">
        <div className="cf-top-inner flex items-center justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(backTo)}
              aria-label="Go back"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#dfe8f1] bg-white text-[#3d6181] transition-colors hover:bg-[#eaf3fb]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <h1 className="cf-top-title truncate">
              {title}
            </h1>
          </div>

          {right && (
            <div className="shrink-0">
              {right}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
