import {
  Box,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Package,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../lib/api";

import { AppShell } from "../components/layout/AppShell";
import { BrandHeader } from "../components/layout/BrandHeader";
import { Card } from "../components/ui/Card";
import StatusBadge from "../components/ui/statusBadge";

interface RecentOrder {
  order_id: number;
  status: string;
  created_at: string;
}

interface DashboardSummary {
  total_orders: number;
  orders_by_status: Record<string, number>;
  recent_orders: RecentOrder[];
}

interface RecentOrderDetails {
  order_id: number;
  status: string;
  created_at: string;
  items: unknown[];
  box_types: string[];
}

interface DashboardOrder {
  id: number;
  reference: string;
  status: string;
  createdAt: string;
  itemCount: number;
  boxCount: number;
}

export function DashboardPage() {
  const navigate = useNavigate();

  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [recentOrders, setRecentOrders] =
    useState<DashboardOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        // 1. Load dashboard summary
        const data =
          await apiFetch<DashboardSummary>(
            "/dashboard/summary",
          );

        setSummary(data);

        // 2. Load details for recent orders
        const detailedOrders =
          await Promise.all(
            data.recent_orders.map(
              async (order) => {
                const details =
                  await apiFetch<RecentOrderDetails>(
                    `/orders/${order.order_id}`,
                  );

                return {
                  id: order.order_id,
                  reference: `ORD-${order.order_id}`,
                  status:
                    order.status
                      .charAt(0)
                      .toUpperCase() +
                    order.status.slice(1),
                  createdAt: order.created_at,
                  itemCount:
                    details.items.length,
                  boxCount:
                    details.box_types.length,
                };
              },
            ),
          );

        setRecentOrders(detailedOrders);
      } catch (err) {
        console.error(
          "Failed to load dashboard:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <BrandHeader title="Packing overview" />

        <main className="px-5 py-10 text-center text-sm text-[#6a7f99]">
          Loading dashboard...
        </main>
      </AppShell>
    );
  }

  if (error || !summary) {
    return (
      <AppShell>
        <BrandHeader title="Packing overview" />

        <main className="cf-page">
          <Card className="p-5 text-center">
            <p className="text-sm font-semibold text-[#b64641]">
              Unable to load dashboard
            </p>

            <p className="mt-2 text-xs text-[#6a7f99]">
              {error}
            </p>
          </Card>
        </main>
      </AppShell>
    );
  }

  const completed =
    summary.orders_by_status.completed ?? 0;

  const invalid =
    summary.orders_by_status.invalid ?? 0;

  const completedRate =
    summary.total_orders > 0
      ? Math.round(
          (completed /
            summary.total_orders) *
            100,
        )
      : 0;

  const invalidRate =
    summary.total_orders > 0
      ? Math.round(
          (invalid /
            summary.total_orders) *
            100,
        )
      : 0;

  return (
    <AppShell>
      <BrandHeader title="Packing overview" />

      <main className="cf-page">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
          Live portal data
        </p>

        {/* Total orders */}
        <Card className="mt-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-[#7187a0]">
                Total orders
              </p>

              <p className="mt-3 text-5xl font-bold text-[#172f50]">
                {summary.total_orders}
              </p>
            </div>

            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e7f3ff] text-[#2582ce]">
              <ClipboardList className="h-8 w-8" />
            </div>
          </div>
        </Card>

        {/* Status summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 cf-dashboard-secondary">
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-[#7187a0]">
                  Completed
                </p>

                <p className="mt-4 text-4xl font-bold text-[#15845f]">
                  {completed}
                </p>
              </div>

              <CheckCircle2 className="h-5 w-5 text-[#15845f]" />
            </div>

            <p className="mt-4 font-mono text-xs text-[#7187a0]">
              {completedRate}% rate
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-[#7187a0]">
                  Invalid
                </p>

                <p className="mt-4 text-4xl font-bold text-[#b64641]">
                  {invalid}
                </p>
              </div>

              <XCircle className="h-5 w-5 text-[#b64641]" />
            </div>

            <p className="mt-4 font-mono text-xs text-[#7187a0]">
              {invalidRate}% rate
            </p>
          </Card>
        </div>

        {/* Recent orders */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
              Recent Orders
            </h2>

            <button
              type="button"
              onClick={() =>
                navigate("/orders")
              }
              className="font-mono text-sm text-[#1b75bc]"
            >
              View all →
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <Card className="p-6 text-center text-sm text-[#6a7f99]">
                No orders yet.
              </Card>
            ) : (
              recentOrders.map((order) => {
                const createdAt =
                  new Date(
                    order.createdAt,
                  );

                return (
                  <Card
                    key={order.id}
                    className="cursor-pointer p-4 transition-colors hover:border-[#b4d4ee]"
                    onClick={() =>
                      navigate(
                        `/orders/${order.id}`,
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-[#172f50]">
                          {order.reference}
                        </h3>

                        <StatusBadge
                          status={order.status}
                        />
                      </div>

                      <ChevronRight className="h-5 w-5 text-[#6a7f99]" />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-[#6a7f99]">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          {order.itemCount}{" "}
                          {order.itemCount === 1
                            ? "item"
                            : "items"}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Box className="h-3.5 w-3.5" />
                          {order.boxCount}{" "}
                          {order.boxCount === 1
                            ? "box"
                            : "boxes"}
                        </span>
                      </div>

                      <span className="font-mono text-[11px]">
                        {createdAt.toLocaleDateString(
                          [],
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                        ,{" "}
                        {createdAt.toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute:
                              "2-digit",
                          },
                        )}
                      </span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

export default DashboardPage;