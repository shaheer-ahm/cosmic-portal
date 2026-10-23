import { useEffect, useState } from "react";
import { Search, ChevronRight, Package, Box, Filter, Trash2 } from "lucide-react";
import { useAuth } from "../lib/useAuth";
import { MotionCard } from "../components/motion/MotionCard";

import { apiFetch } from "../lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import StatusBadge from "../components/ui/statusBadge";

interface OrderSummary {
  id: string;
  reference: string;
  status: string;
  createdBy?: string | null;
  itemsCount: number;
  boxesCount: number;
  time: string;
  date: string;
}



export function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, user } = useAuth();
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const availableFilters = [
    "All", "Your Orders", "Draft", "Validated", "Completed", "Processing", "Invalid",
  ];
  const requestedStatus = searchParams.get("status")?.toLowerCase() ?? "all";
  const statusFilter = availableFilters.find(
    (filter) => filter.toLowerCase() === requestedStatus,
  ) ?? "All";

  const changeStatusFilter = (filter: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (filter === "All") {
        next.delete("status");
      } else {
        next.set("status", filter.toLowerCase());
      }
      return next;
    });
  };
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
            created_by?: string | null;
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
            createdBy: order.created_by,
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

    // Search by order reference
    const matchesSearch = order.reference
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());

    // Filter by order status
    const matchesStatus =
      statusFilter === "All" ||
      statusFilter === "Your Orders" ||
      order.status.toLowerCase() === statusFilter.toLowerCase();

    // Identify orders belonging to the logged-in user
    const matchesOwner =
      statusFilter !== "Your Orders" ||
      (
        Boolean(user?.id) &&
        Boolean(order.createdBy) &&
        user!.id.toLowerCase() === order.createdBy!.toLowerCase()
      );

    return matchesSearch && matchesStatus && matchesOwner;
  });

  const canSelectOrder = (order: OrderSummary) => {
    const status = order.status.toLowerCase();

    if (status === "processing") {
      return false;
    }

    if (role === "supervisor") {
      return true;
    }

    const isOwner =
      Boolean(user?.id) &&
      Boolean(order.createdBy) &&
      user!.id.toLowerCase() === order.createdBy!.toLowerCase();

    return (
      isOwner && ["draft", "invalid"].includes(status)
    );
  };

  const selectableVisibleOrders = filteredOrders.filter(canSelectOrder);

  const allVisibleSelected =
    selectableVisibleOrders.length > 0 &&
    selectableVisibleOrders.every((order) =>
      selectedOrderIds.has(order.id),
  );

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((current) => {
      const updated = new Set(current);
      if (updated.has(orderId)) {
        updated.delete(orderId);
      } else {
        updated.add(orderId);
      }
      return updated;
    });
  };

  const toggleAllVisible = () => {
    setSelectedOrderIds((current) => {
      const updated = new Set(current);
      if (allVisibleSelected) {
        selectableVisibleOrders.forEach(order => updated.delete(order.id));
      } else {
        selectableVisibleOrders.forEach(order => updated.add(order.id));
      }

      return updated;
    });
  };

  const clearSelection = () => setSelectedOrderIds(new Set());

  const deleteSelectedOrders = async () => {
    const selectedCount = selectedOrderIds.size;

    if (selectedCount === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete ${selectedCount} selected ${
        selectedCount === 1 ? "order" : "orders"
      } and all associated data?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSelected(true);

      const result = await apiFetch<{
        deleted_order_ids: number[];
        deleted_count: number;
      }>("/orders/bulk-delete", {
        method: "POST",
        body: JSON.stringify({
          order_ids: Array.from(
            selectedOrderIds,
            Number,
          ),
        }),
      });

      const deletedIds = new Set(result.deleted_order_ids.map(String));

      setOrders(current => current.filter(order => !deletedIds.has(order.id)));
      clearSelection();

    } catch (error) {
      console.error("Failed to delete selected orders:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete selected orders.",
      );
    } finally {
      setDeletingSelected(false);
    }
  };


  return (
    <AppShell>
      <PageHeader
        title="Orders Queue"
        backTo="/dashboard"
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
            {availableFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => changeStatusFilter(filter)}
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

          {(
            selectableVisibleOrders.length > 0 || selectedOrderIds.size > 0
          ) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce5ee] bg-white px-4 py-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#49637e]">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  disabled={
                    selectableVisibleOrders.length == 0 ||
                    deletingSelected
                  }
                  className="h-4 w-4 rounded border-[#b8c8d8] accent-[#2686d5]"
                />
                Select all visible
                <span className="text-[#7187a0]">
                  ({selectableVisibleOrders.length})
                </span>
              </label>

              {selectedOrderIds.size > 0 && (
                <div className="flex items-centre gap-2">
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={deletingSelected}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-[#607791] hover:bg-[#f4f7fb] disabled:opacity-50"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={deleteSelectedOrders}
                    disabled={deletingSelected}
                    className="flex items-center gap-2 rounded-lg border border-[#d99894] bg-white px-3 py-2 text-xs font-semibold text-[#b64641] hover:bg-[#fff1f0] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingSelected
                      ? "Deleting..."
                      : `Delete selected (${selectedOrderIds.size})`}
                  </button>
                </div>
              )}
            </div>
          )}
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
                {statusFilter === "Your Orders"
                  ? "You haven't created any orders matching your search."
                  : "Try adjusting your search query or status filter."}
              </p>
            </Card>
          ) : (
            filteredOrders.map((order,index) => (
              <MotionCard key={order.id} index={index}>
                <Card
                  className="p-4 hover:border-[#b4d4ee] transition-colors cursor-pointer group"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {canSelectOrder(order) && (
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.has(order.id)}
                          onClick={event => event.stopPropagation()}
                          onChange={() => toggleOrderSelection(order.id)}
                          disabled={deletingSelected}
                          aria-label={`Select ${order.reference}`}
                          className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#b8c8d8] accent-[#2686d5]"
                        />
                      )}

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
              </MotionCard>
            ))
          )}
        </section>
      </main>
    </AppShell>
  );
}

export default OrdersPage;