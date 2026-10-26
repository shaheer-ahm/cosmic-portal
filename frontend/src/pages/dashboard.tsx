import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, Box, CheckCircle2, ChevronRight,
  ClipboardCheck, ClipboardList, Clock3, LoaderCircle,
  Package, PackageCheck, PackagePlus, Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { AnimatedNumber } from "../components/motion/AnimatedNumber";
import { AppShell } from "../components/layout/AppShell";
import { BrandHeader } from "../components/layout/BrandHeader";
import { Card } from "../components/ui/Card";
import StatusBadge from "../components/ui/statusBadge";
import { apiFetch } from "../lib/api";


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

interface ItemInput {
  Quantity?: number;
}

interface PackingResultData {
  Summary?: {
    BoxCount?: number;
    PackedItemCount?: number;
  };
}

interface RecentOrderDetails {
  order_id: number;
  status: string;
  created_at: string;
  items: ItemInput[];
  box_types: string[];
  packingResult?: {
    result_data?: PackingResultData;
  };
}
interface DashboardOrder {
  id: number;
  reference: string;
  status: string;
  createdAt: string;
  itemCount: number;
  boxCount: number;
}

type Stage = {
  key: string;
  label: string;
  description: string;
  icon: typeof ClipboardList;
  color: string;
};

const stages: Stage[] = [
  { key: "draft", label: "Awaiting Validation", description: "Draft orders awaiting validation", icon: ClipboardList, color: "#aa762b"},
  { key: "validated", label: "Validated", description: "Validated orders ready for optimisation", icon: ClipboardCheck, color: "#2582CE" },
  { key: "completed", label: "Completed", description: "Packing results ready for inspection", icon: PackageCheck, color: "#518D68" },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [selectedStage, setSelectedStage] = useState("draft");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const data = await apiFetch<DashboardSummary>("/dashboard/summary");
        if (!active) return;
        setSummary(data);
        // Fetch order details and compute physical items & actual boxes used
        const details = await Promise.allSettled(
          data.recent_orders.map(async (order): Promise<DashboardOrder> => {
            const info = await apiFetch<RecentOrderDetails>(`/orders/${order.order_id}`);
            // 1. Total physical items (sum of quantities or fallback to length)
            const physicalItemsCount = info.items
              ? info.items.reduce((sum, item) => sum + (item.Quantity ?? 1), 0)
              : 0;

            // 2. Actual physical boxes used from solver summary (fallback to candidate boxes if draft/unpacked)
            const actualBoxesUsed =
              info.packingResult?.result_data?.Summary?.BoxCount ??
              info.box_types.length;
            return {
              id: order.order_id,
              reference: `ORD-${order.order_id}`,
              status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
              createdAt: order.created_at,
              itemCount: physicalItemsCount,
              boxCount: actualBoxesUsed,
            };
          }),
        );
        if (active) setRecentOrders(details.flatMap((result) => result.status === "fulfilled" ? [result.value] : []));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDashboard();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <AppShell>
        <BrandHeader title="Dashboard" />
        <main className="cf-page text-sm text-[#7187a0]">Loading warehouse overview...</main>
      </AppShell>
    );
  }
  if (error || !summary) {
    return (
      <AppShell>
        <BrandHeader title="Warehouse overview" />
        <main className="cf-page"><Card className="p-5 text-sm text-[#b64641]">Unable to load dashboard: {error || "No data available"}</Card></main>
      </AppShell>
    );
  }

  const count = (key: string) => summary.orders_by_status[key] ?? summary.orders_by_status[key.toUpperCase()] ?? 0;
  const completed = count("completed");
  const draft = count("draft");
  const completionPercent = summary.total_orders > 0 ? Math.round((completed / summary.total_orders) * 100) : 0;
  const activeStage = stages.find((stage) => stage.key === selectedStage) ?? stages[0];
  const activeCount = count(activeStage.key);
  const activeStageIcon = activeStage.icon;
  const StageIcon = activeStageIcon;
  const metrics = [
    { title: "Total Orders", value: summary.total_orders, note: "Explore all orders", to: "/orders", icon: ClipboardList, tint: "blue", valueColor: "#172f50" },
    { title: "Completed", value: completed, note: `${completionPercent}% of all orders`, to: "/orders?status=completed", icon: CheckCircle2, tint: "green", valueColor: "#39835d" },
    { title: "Awaiting Validation", value: draft, note: "Draft orders to review", to: "/orders?status=draft", icon: Clock3, tint: "amber", valueColor: "#aa762b" },
  ] as const;
  const distribution = stages.map((stage) => ({ ...stage, value: count(stage.key) }));

  return (
    <AppShell>
      <BrandHeader title="Warehouse overview" />
      <main className="cf-page space-y-8">


        {/* Main metrics */}
        <section>
          <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-[#7187a0]">Operations at a glance</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              const hoverTone = metric.tint === "green" ? "hover:border-[#9acdb1] hover:bg-[#effaf3]" : metric.tint === "amber" ? "hover:border-[#e7c58b] hover:bg-[#fff8ed]" : "hover:border-[#9fc6ed] hover:bg-[#f0f7ff]";
              return (
                <motion.div key={metric.title} initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.09, duration: 0.35 }} whileHover={reduceMotion ? undefined : { y: -5 }} whileTap={reduceMotion ? undefined : { scale: 0.96 }} className="group min-w-0">
                  <Link to={metric.to} className={`block h-full rounded-2xl border border-[#dce5ee] bg-white p-4 shadow-sm transition-[background-color,border-color,box-shadow] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#508bd2] sm:p-5 ${hoverTone}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-[#7187a0] sm:text-sm">{metric.title}</p>
                      <Icon className="h-5 w-5 shrink-0" style={{ color: metric.valueColor }} />
                    </div>
                    <div className="mt-4 text-4xl font-bold tabular-nums sm:text-5xl" style={{ color: metric.valueColor }}><AnimatedNumber value={metric.value} /></div>
                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[#70839c]">
                      <span>{metric.note}</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Order pipeline distribution */}
        <section className="rounded-2xl border border-[#dce5ee] bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-[#172f50]">Order workflow distribution</h3>
            <p className="text-xs text-[#7187a0]">Based on live order statuses</p>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-[#edf1f6]" aria-label="Proportions of draft, validated, processing, and completed orders">
            {distribution.map((stage, index) => (
              <motion.div key={stage.key} initial={reduceMotion ? false : { flexGrow: 0 }} animate={{ flexGrow: stage.value }} transition={{ delay: reduceMotion ? 0 : 0.15 + index * 0.1, duration: reduceMotion ? 0 : 0.65 }} style={{ backgroundColor: stage.color, flexBasis: 0, minWidth: 0 }} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {distribution.map((stage) => (
              <Link to={`/orders?status=${stage.key}`} key={stage.key} className="inline-flex items-center gap-2 text-xs text-[#60748f] hover:text-[#247fc5]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />{stage.label} <strong>{stage.value}</strong>
              </Link>
            ))}
          </div>
          {summary.total_orders > distribution.reduce((sum, stage) => sum + stage.value, 0) && (
            <p className="mt-3 text-xs text-[#7187a0]">Other statuses, including orders needing correction, are not shown in this workflow bar.</p>
          )}
        </section>

        {/* Interactive journey */}
        <section className="rounded-2xl border border-[#dce5ee] bg-white p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#7187a0]">Interactive order journey</p><h3 className="mt-1 text-lg font-bold text-[#172f50]">From order to optimised carton</h3></div>
            <Sparkles className="h-5 w-5 text-[#508bd2]" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {stages.map((stage) => {
              const Icon = stage.icon;
              const active = selectedStage === stage.key;
              return (
                <button type="button" key={stage.key} onClick={() => setSelectedStage(stage.key)} aria-pressed={active}  className={`relative flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl px-1 py-4 text-center transition-colors hover:bg-[#f0f7ff] focus-visible:outline-2 focus-visible:outline-[#508bd2] sm:min-h-[130px] sm:gap-3 sm:p-4 ${active ? "text-[#2678bf]" : "text-[#6a7f99]"}`}>
                  {active && <motion.span layoutId="active-journey-stage" className="absolute inset-0 rounded-xl bg-[#eaf3ff]" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 30 }} />}
                  <span className="relative z-10 grid h-9 w-9 place-items-center rounded-lg bg-white shadow-sm sm:h-12 sm:w-12"><Icon className="h-5 w-5 sm:h-6 sm:w-6" /></span>
                  <span className="relative z-10 text-[11px] font-semibold sm:text-sm">{stage.label}</span>
                </button>
              );
            })}
          </div>
          <motion.div key={activeStage.key} initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.23 }} className="mt-4 flex flex-col items-stretch gap-3 rounded-xl bg-[#f4f8fd] p-4 sm:flex-row sm:items-center">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-[#447abc]"><StageIcon className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1"><p className="font-semibold text-[#172f50]">{activeStage.label} · {activeCount} orders</p><p className="mt-1 text-xs text-[#7187a0]">{activeStage.description}</p></div>
            <Link to={`/orders?status=${activeStage.key}`} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-xs font-semibold text-[#3578bf] transition-colors hover:bg-[#e5f0ff] sm:w-auto">View orders <ArrowRight className="h-4 w-4" /></Link>
          </motion.div>
        </section>

        {/* Shortcuts */}
        <section>
          <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-[#7187a0]">Quick actions</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { title: "Create New Order", description: "Enter items and allowed cartons", to: "/orders/new", icon: PackagePlus },
              
              {title: "View My Orders",description: "Track the orders you created", to: "/orders?status=your%20orders",icon: ClipboardList,},

              { title: "View Packing Results", description: `${completed} completed orders`, to: "/orders?status=completed", icon: PackageCheck },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <motion.div key={action.title} whileHover={reduceMotion ? undefined : { y: -4 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }}>
                  <Link to={action.to} className="group flex h-full items-center gap-3 rounded-xl border border-[#dce5ee] bg-white p-4 transition-colors hover:border-[#a4c8e9] hover:bg-[#f0f7ff]">
                    <span className="rounded-lg bg-[#e7f3ff] p-2 text-[#357fc4]"><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#172f50]">{action.title}</span><span className="mt-1 block text-xs text-[#7187a0]">{action.description}</span></span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#7e94ac] transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Recent orders */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-[#7187a0]">Recent Orders</h3>
            <Link to="/orders" className="text-sm font-semibold text-[#367dc4] hover:text-[#245f9a]">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <Card className="p-5 text-sm text-[#6a7f99]">No recent orders available.</Card>
            ) : recentOrders.map((order, index) => (
              <motion.div key={order.id} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: reduceMotion ? 0 : Math.min(index, 6) * 0.07 }} whileHover={reduceMotion ? undefined : { y: -3 }} whileTap={reduceMotion ? undefined : { scale: 0.985 }}>
                <Card className="cursor-pointer p-4 transition-colors hover:border-[#9dc2e4] hover:bg-[#f4f9ff]" onClick={() => navigate(`/orders/${order.id}`)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3"><h4 className="text-base font-bold text-[#172f50]">{order.reference}</h4><StatusBadge status={order.status} /></div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[#7187a0]" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6a7f99]">
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      <span className="inline-flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Box className="h-3.5 w-3.5" />
                        {order.boxCount} {order.boxCount === 1 ? "box" : "boxes"}
                      </span>
                    </div>
                    <span className="font-mono text-[11px]">{new Date(order.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

export default DashboardPage;
