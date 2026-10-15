import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { MenuDrawer } from "./MenuDrawer";
import { useNavigate } from "react-router-dom";

type PageHeaderProps = {
  title: string;
  right?: ReactNode;
};

export function PageHeader({ title, right }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="cf-top-header">
      <div className="cf-top-inner flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MenuDrawer />
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#dfe8f1] bg-white text-[#3d6181] transition-colors hover:bg-[#eaf3fb]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="cf-top-title">
            {title}
          </h1>
        </div>

        {right}
      </div>
    </header>
  );
}