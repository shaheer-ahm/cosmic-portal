import { MenuDrawer } from "./MenuDrawer";

export function BrandHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-[#242730] px-6 py-5">
      <div className="flex items-center justify-between gap-4">
          {/* Menu Drawer placed on the far left */}
          <div className="flex items-center gap-3">
          <MenuDrawer />

          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#6675ff] text-sm font-bold text-white">
            CF
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.23em] text-[#747b98]">
              Cosmic Fit
            </p>

            <h1 className="text-2xl font-bold text-white">
              {title}
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-[#383b44] bg-[#23252b] px-4 py-2 text-xs text-[#d3d4db] sm:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          Warehouse User
        </div>
      </div>
    </header>
  );
}