import { useState } from "react";
import { Search, ChevronRight, Package, Box, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import StatusBadge from "../components/ui/statusBadge";

interface OrderSummary {
  id: string;
  reference: string;
  status: "Completed" | "Processing" | "Invalid";
  itemsCount: number;
  boxesCount: number;
  time: string;
  date: string;
}

const mockOrders: OrderSummary[] = [
  {
    id: "1",
    reference: "ORD-2847",
    status: "Completed",
    itemsCount: 12,
    boxesCount: 3,
    time: "09:42 AM",
    date: "Aug 17",
  },
  {
    id: "2",
    reference: "ORD-2846",
    status: "Processing",
    itemsCount: 8,
    boxesCount: 2,
    time: "09:15 AM",
    date: "Aug 17",
  },
  {
    id: "3",
    reference: "ORD-2845",
    status: "Invalid",
    itemsCount: 15,
    boxesCount: 0,
    time: "08:50 AM",
    date: "Aug 17",
  },
  {
    id: "4",
    reference: "ORD-2844",
    status: "Completed",
    itemsCount: 6,
    boxesCount: 1,
    time: "04:30 PM",
    date: "Aug 16",
  },
  {
    id: "5",
    reference: "ORD-2843",
    status: "Completed",
    itemsCount: 22,
    boxesCount: 5,
    time: "02:10 PM",
    date: "Aug 16",
  },
];

export function OrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filteredOrders = mockOrders.filter((order) => {
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
          <span className="bg-[#1C1F26] border border-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            {mockOrders.length} Total
          </span>
        }
      />

      <main className="px-5 py-5 pb-24">
        {/* Search & Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#777d92]" />
            <input
              type="text"
              placeholder="Search by order reference (e.g. ORD-2847)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[#2b2f3d] bg-[#1a1d27] pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#777d92] focus:border-[#4F75FF] focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="h-3.5 w-3.5 text-[#777d92] shrink-0 mr-1" />
            {["All", "Completed", "Processing", "Invalid"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === filter
                    ? "bg-[#343760] text-[#8c95ff] border border-[#4F75FF]/40"
                    : "bg-[#1d202a] text-[#777d92] hover:bg-[#252834]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Queue List */}
        <section className="mt-6 space-y-3">
          {filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-8 w-8 text-[#777d92] mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No orders found</p>
              <p className="text-xs text-[#777d92] mt-1">
                Try adjusting your search query or status filter.
              </p>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="p-4 hover:border-[#383d52] transition-colors cursor-pointer group"
                onClick={() => navigate(`/orders/${order.reference}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-white group-hover:text-[#8c95ff] transition-colors">
                      {order.reference}
                    </h3>
                    <StatusBadge status={order.status} />
                  </div>

                  <ChevronRight className="h-5 w-5 text-[#777d92] group-hover:text-white transition-colors" />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[#777d92]">
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