import { Box, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { StoredOrder } from "../../types/domain";
import StatusBadge from "../ui/statusBadge";

type OrderCardProps = {
  order: StoredOrder;
};

export function OrderCard({ order }: OrderCardProps) {
  const time = new Date(order.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      to={`/results/${order.id}`}
      className="block rounded-[24px] border border-[#30343f] bg-[#22252c] p-5 transition hover:border-[#6677ff]/50"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-mono text-lg font-bold text-white">
              {order.orderRef}
            </h3>

            <StatusBadge status={order.status} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-xs text-[#707792]">
            <span className="flex items-center gap-1.5">
              <Box className="h-4 w-4" />
              {order.itemCount} items
            </span>

            <span>{order.boxCount} boxes</span>

            <span>{time}</span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-[#555962]" />
      </div>
    </Link>
  );
}