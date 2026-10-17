import { useEffect, useState } from "react";
import { Search, ChevronRight, Package, Box, Filter } from "lucide-react";

import { apiFetch } from "../lib/api";
import { useNavigate } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import StatusBadge from "../components/ui/statusBadge";

interface OrderSummary {
  id: string;
  reference: string;
  status: string;
  itemsCount: number;
  boxesCount: number;
  time: string;
  date: string;
}



export function OrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const orderSummaries = await apiFetch<
          {
            order_id: number;
            status: string;
            created_at: string;
            items_count: number;
            boxes_count: number;
          }[]
        >("/orders/");

        const mappedOrders = orderSummaries.map((order) => {
          const createdAt = new Date(order.created_at);

          return {
            id: String(order.order_id),
            reference: `ORD-${order.order_id}`,
            status:
              order.status.charAt(0).toUpperCase() +
              order.status.slice(1),
            itemsCount: order.items_count,
            boxesCount: order.boxes_count,
            time: createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: createdAt.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            }),
          };
        });

        setOrders(mappedOrders);
      } catch (error) {
        console.error("Failed to load orders:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load orders.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [reloadKey]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.reference
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <PageHeader
        title="Orders Queue"
        right={
          <span className="bg-white border border-[#dce5ee] text-[#49637e] text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2686d5]"></span>
            {loading ? "..." : orders.length} Total
          </span>
        }
      />

      <main className="cf-page">
        {/* Search & Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6a7f99]" />
            <input
              type="text"
              placeholder="Search by order reference (e.g. ORD-2847)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[#dce5ee] bg-white pl-10 pr-4 py-2.5 text-xs text-[#172f50] placeholder-[#777d92] focus:border-[#2686d5] focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="h-3.5 w-3.5 text-[#6a7f99] shrink-0 mr-1" />
            {["All", "Draft", "Validated" , "Completed", "Processing", "Invalid"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === filter
                    ? "bg-[#e7f3ff] text-[#236eaf] border border-[#2686d5]/40"
                    : "bg-[#f4f7fb] text-[#6a7f99] hover:bg-[#eaf4ff]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Queue List */}
        <section className="mt-6 space-y-3">
          {loading ? (
            <Card className="p-8 text-center">
              <Package className="h-8 w-8 text-[#6a7f99] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#172f50]">
                Loading orders...
              </p>
            </Card>
          ) : error ? (
            <Card className="p-8 text-center">
              <Package className="h-8 w-8 text-[#b64641] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#b64641]">
                Unable to load orders
              </p>
              <p className="mt-1 text-xs text-[#6a7f99]">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="mt-4 rounded-lg bg-[#2686d5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1f77be]"
              >
                Try again
              </button>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-8 w-8 text-[#6a7f99] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#172f50]">No orders found</p>
              <p className="text-xs text-[#6a7f99] mt-1">
                Try adjusting your search query or status filter.
              </p>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="p-4 hover:border-[#b4d4ee] transition-colors cursor-pointer group"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-[#172f50] group-hover:text-[#1f77be] transition-colors">
                      {order.reference}
                    </h3>
                    <StatusBadge status={order.status} />
                  </div>

                  <ChevronRight className="h-5 w-5 text-[#6a7f99] group-hover:text-[#146fae] transition-colors" />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[#6a7f99]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />
                      {order.itemsCount} items
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Box className="h-3.5 w-3.5" />
                      {order.boxesCount} {order.boxesCount === 1 ? "box" : "boxes"}
                    </span>
                  </div>

                  <span className="font-mono text-[11px]">
                    {order.date}, {order.time}
                  </span>
                </div>
              </Card>
            ))
          )}
        </section>
      </main>
    </AppShell>
  );
}

export default OrdersPage;