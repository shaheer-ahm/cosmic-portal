import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type PageHeaderProps = {
  title: string;
  right?: ReactNode;
};

export function PageHeader({ title, right }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-[#242730] px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 place-items-center rounded-xl text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="text-lg font-bold text-white">
            {title}
          </h1>
        </div>

        {right}
      </div>
    </header>
  );
}