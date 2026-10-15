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
      className="block rounded-[24px] border border-[#dee7f0] bg-white p-5 transition hover:border-[#9fc9eb]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-mono text-lg font-bold text-[#172f50]">
              {order.orderRef}
            </h3>

            <StatusBadge status={order.status} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-xs text-[#71849c]">
            <span className="flex items-center gap-1.5">
              <Box className="h-4 w-4" />
              {order.itemCount} items
            </span>

            <span>{order.boxCount} boxes</span>

            <span>{time}</span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-[#7b8fa5]" />
      </div>
    </Link>
  );
}