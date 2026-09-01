import {
  CheckCircle2,
  ClipboardList,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { BrandHeader } from "../components/layout/BrandHeader";
import { OrderCard } from "../components/orders/OrderCard";
import { Card } from "../components/ui/Card";
import type { StoredOrder } from "../types/domain";

const emptyRequest = {
  items: [],
  boxes: [],
};

const recentOrders: StoredOrder[] = [
  {
    id: "ORD-2847",
    orderRef: "ORD-2847",
    status: "completed",
    itemCount: 12,
    boxCount: 3,
    createdAt: "2026-08-17T09:42:00",
    completedAt: "2026-08-17T09:42:01",
    durationMs: 1340,
    request: emptyRequest,
  },
  {
    id: "ORD-2846",
    orderRef: "ORD-2846",
    status: "processing",
    itemCount: 8,
    boxCount: 2,
    createdAt: "2026-08-17T09:15:00",
    request: emptyRequest,
  },
  {
    id: "ORD-2845",
    orderRef: "ORD-2845",
    status: "invalid",
    itemCount: 5,
    boxCount: 0,
    createdAt: "2026-08-17T08:58:00",
    request: emptyRequest,
  },
  {
    id: "ORD-2844",
    orderRef: "ORD-2844",
    status: "completed",
    itemCount: 24,
    boxCount: 6,
    createdAt: "2026-08-17T08:31:00",
    request: emptyRequest,
  },
  {
    id: "ORD-2843",
    orderRef: "ORD-2843",
    status: "completed",
    itemCount: 16,
    boxCount: 4,
    createdAt: "2026-08-17T08:12:00",
    request: emptyRequest,
  },
];

export function DashboardPage() {
  return (
    <AppShell>
      <BrandHeader title="Dashboard" />

      <main className="px-5 py-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#777d98]">
          Today — Aug 17
        </p>

        <Card className="mt-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-[#777d98]">
                Orders today
              </p>

              <p className="mt-3 text-5xl font-bold text-white">
                47
              </p>
            </div>

            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#303654] text-[#7180ff]">
              <ClipboardList className="h-8 w-8" />
            </div>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-[#777d98]">
                  Completed
                </p>

                <p className="mt-4 text-4xl font-bold text-green-400">
                  39
                </p>
              </div>

              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>

            <p className="mt-4 font-mono text-xs text-[#777d98]">
              83% rate
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-[#777d98]">
                  Invalid
                </p>

                <p className="mt-4 text-4xl font-bold text-red-400">
                  3
                </p>
              </div>

              <XCircle className="h-5 w-5 text-red-400" />
            </div>

            <p className="mt-4 font-mono text-xs text-[#777d98]">
              6% rate
            </p>
          </Card>
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#777d98]">
              Recent Orders
            </h2>

            <Link
              to="/orders"
              className="font-mono text-sm text-[#7b86ff]"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
              />
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

export default DashboardPage;