import { Box, Download, Package, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
const boxSlug = (boxIndex: number) => `box-${boxIndex + 1}`;

import { PackingPlanBox } from "../components/portal/PackingPlanBox";
import { StatMotionCard } from "../components/motion/StatMotionCard";
import { CollapsibleSection } from "../components/portal/CollapsibleSection";

import { apiFetch } from "../lib/api";
import { motion, useReducedMotion } from "motion/react";
import { useAuth } from "../lib/useAuth";
import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import StatusBadge from "../components/ui/statusBadge";

interface OrderItem {
  ItemCode: string;
  ItemReference: string;
  Width: number;
  Length: number;
  Depth: number;
  Weight: number;
  BoxGroup?: string | null;
  Quantity?: number | null;
  KeepUpright?: boolean | null;
}

interface OrderDetails {
  order_id: number;
  status: string;
  created_by?: string | null;
  created_at: string;
  items: OrderItem[];
  box_types: string[];
}

interface ValidationIssue {
  field?: string | null;
  message: string;
}

interface ValidateResponse {
  valid: boolean;
  status: string;
  issues: ValidationIssue[];
}

interface OptimiseResponse {
  order_id: number;
  status: string;
  message: string;
}

interface PackedItem {
  Sequence: number;
  InstanceId: string;
  ItemCode: string;
  ItemReference: string;
  BoxGroup?: string | null;
  Position: {
    X: number;
    Y: number;
    Z: number;
  };
  Dimensions: {
    Width: number;
    Length: number;
    Depth: number;
  };
  Orientation: {
    Code: string;
  };
  Weight: number;
}

interface PackedBox {
  BoxIndex: number;
  Reference: string;
  BoxGroup?: string | null;
  Dimensions: {
    Width: number;
    Length: number;
    Depth: number;
  };
  ItemCount: number;
  ItemsWeight: number;
  BoxWeight: number;
  TotalWeight: number;
  MaxWeight?: number | null;
  VolumeUtilisation: number;
  LoadHeight: number;
  Items: PackedItem[];
}

interface PackingSummary {
  BoxCount: number;
  BoxCounts: Record<string, number>;
  PackedItemCount: number;
  UnpackedItemCount: number;
  TotalWeight: number;
  OverallVolumeUtilisation: number;
}

interface UnpackedItem {
  InstanceId: string;
  ItemCode: string;
  ItemReference?: string | null;
  ReasonCode: string;
  Reason: string;
}

interface PackingResultData {
  Success: boolean;
  Summary: PackingSummary;
  Boxes: PackedBox[];
  UnpackedItems?: UnpackedItem[];
}

interface PackingResultResponse {
  order_id: number;
  result_data: PackingResultData;
  created_at: string;
}

export function ResultPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();

  const [realOrder, setRealOrder] = useState<OrderDetails | null>(null);
  const [packingResult, setPackingResult] =
    useState<PackingResultResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [optimising, setOptimising] = useState(false);
  const [resultError, setResultError] = useState("");
  
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const resultRequest = apiFetch<PackingResultResponse>(
          `/orders/${orderId}/results`,
        );
        resultRequest.catch(() => {
        });

        const data = await apiFetch<OrderDetails>(
          `/orders/${orderId}`,
        );

        setRealOrder(data);
        setResultError("");

        if (data.status.toLowerCase() === "completed") {
          try {
            const result = await resultRequest;
            setPackingResult(result);
          } catch (resultErr) {
            console.error("Failed to load packing result:", resultErr);
            setPackingResult(null);
            setResultError(
              resultErr instanceof Error
                ? resultErr.message
                : "Failed to load the packing result.",
            );
          }
        } else {
          setPackingResult(null);
        }
      } catch (err) {
        console.error("Failed to load order:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load order.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <AppShell>
        <main className="px-5 py-10 text-center text-sm text-[#6a7f99]">
          Loading order...
        </main>
      </AppShell>
    );
  }

  if (error || !realOrder) {
    return (
      <AppShell>
        <main className="cf-page">
          <Card className="p-5 text-center">
            <p className="text-sm font-semibold text-[#b64641]">
              Unable to load order
            </p>
            <p className="mt-2 text-xs text-[#6a7f99]">
              {error || "Order not found."}
            </p>
          </Card>
        </main>
      </AppShell>
    );
  }

  const orderRef = `ORD-${realOrder.order_id}`;

  const displayStatus =
    realOrder.status.charAt(0).toUpperCase() +
    realOrder.status.slice(1);

  const createdAt = new Date(realOrder.created_at);

  const totalWeight = realOrder.items.reduce(
    (total, item) =>
      total + item.Weight * (item.Quantity ?? 1),
    0,
  );

  const normalizedStatus = realOrder.status.toLowerCase();

  const isOrderOwner =
    Boolean(user?.id) &&
    Boolean(realOrder.created_by) &&
    user!.id.toLowerCase() ===
      realOrder.created_by!.toLowerCase();

  const canDeleteOrder =
    normalizedStatus !== "processing" &&
    (role === "supervisor" ||
      (isOrderOwner &&
        ["draft", "invalid"].includes(normalizedStatus)));

  const refreshOrder = async () => {
    const updatedOrder = await apiFetch<OrderDetails>(
      `/orders/${realOrder.order_id}`,
    );

    setRealOrder(updatedOrder);
    return updatedOrder;
  };

  const validateOrder = async () => {
    try {
      setValidating(true);

      const result = await apiFetch<ValidateResponse>(
        `/orders/${realOrder.order_id}/validate`,
        { method: "POST" },
      );

      if (!result.valid) {
        alert(
          result.issues
            .map((issue) => issue.message)
            .join("\n"),
        );
      }

      await refreshOrder();
    } catch (err) {
      console.error("Failed to validate order:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to validate order.",
      );
    } finally {
      setValidating(false);
    }
  };

  const optimiseOrder = async () => {
    try {
      setOptimising(true);

      const result = await apiFetch<OptimiseResponse>(
        `/orders/${realOrder.order_id}/optimise`,
        { method: "POST" },
      );

      const updatedOrder = await refreshOrder();

      if (updatedOrder.status.toLowerCase() === "completed") {
        const packingData =
          await apiFetch<PackingResultResponse>(
            `/orders/${realOrder.order_id}/results`,
          );

        setPackingResult(packingData);
      }

      alert(result.message);
    } catch (err) {
      console.error("Optimisation failed:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Optimisation failed.",
      );
    } finally {
      setOptimising(false);
    }
  };

  const deleteOrder = async () => {
    const confirmed = window.confirm(
      `Delete ${orderRef}? This permanently removes the order and its associated data.`,
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await apiFetch<void>(
        `/orders/${realOrder.order_id}`,
        { method: "DELETE" },
      );

      navigate("/orders", { replace: true });
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete order.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const exportOrder = () => {
    const exportData = {
      order: realOrder,
      packingResult,
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: "application/json" },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${orderRef}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        title={orderRef} 
        backTo="/orders"
        right={<StatusBadge status={displayStatus} />}
      />

      <main className="cf-page">
        {/* ========================================
            1. ORDER DETAILS
        ======================================== */}

        <section>
          <h2 className="text-xl font-bold text-[#172f50]">
            Order Details
          </h2>

          <p className="mt-1 text-xs text-[#6a7f99]">
            Created{" "}
            {createdAt.toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {" • "}
            {createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </section>

        {canDeleteOrder && (
          <section className="mt-4">
            <button
              type="button"
              onClick={deleteOrder}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d99894] bg-white px-4 py-3 text-sm font-semibold text-[#b64641] transition-colors hover:bg-[#fff1f0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting
                ? "Deleting order..."
                : "Delete Order"}
            </button>
          </section>
        )}

        {/* ========================================
            2. PACKING PLAN
        ======================================== */}

        {realOrder.status.toLowerCase() === "completed" &&
          packingResult && (
            <section className="mt-8">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
                Packing Plan
              </h2>

              <div className="mt-4 space-y-4 cf-result-cartons">
                {packingResult.result_data.Boxes.map((box) => (
                  <PackingPlanBox
                    key={box.BoxIndex}
                    box={box}
                    visualizerUrl={`/orders/${realOrder.order_id}/boxes/${boxSlug(box.BoxIndex)}`}
                  />
                ))}
              </div>
            </section>
          )}

        {/* ========================================
            3. ORDER SUMMARY CARDS
        ======================================== */}

        <section className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <StatMotionCard variant="blue">
            <p className="text-xs text-[#6a7f99]">
              Item Types
            </p>
            <p className="mt-3 text-3xl font-bold text-[#172f50]">
              {realOrder.items.length}
            </p>
            <p className="mt-2 text-xs text-[#6a7f99]">
              Total
            </p>
          </StatMotionCard>

          <StatMotionCard variant="blue">
            <p className="text-xs text-[#6a7f99]">
              Allowed Box types
            </p>
            <p className="mt-3 text-3xl font-bold text-[#172f50]">
              {realOrder.box_types.length}
            </p>
            <p className="mt-2 text-xs text-[#6a7f99]">
              Selected
            </p>
          </StatMotionCard>

          <StatMotionCard variant="blue">
            <p className="text-xs text-[#6a7f99]">
              Ordered Item Weight
            </p>
            <p className="mt-3 text-2xl font-bold text-[#172f50]">
              {totalWeight.toFixed(1)}
            </p>
            <p className="mt-2 text-xs text-[#6a7f99]">
              kg
            </p>
          </StatMotionCard>
        </section>

        {/* ========================================
            4. PACKING RESULT METRICS       
        ======================================== */}

        {realOrder.status.toLowerCase() === "completed" &&
          packingResult && (
            
              <section className="mt-8">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
                  Packing Result
                </h2>

                <section className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                  <StatMotionCard variant="green">
                    <p className="text-xs text-[#6a7f99]">
                      Packed
                    </p>
                    <p className="mt-3 text-3xl font-bold text-[#15845f]">
                      {
                        packingResult.result_data.Summary
                          .PackedItemCount
                      }
                    </p>
                    <p className="mt-2 text-xs text-[#6a7f99]">
                      items
                    </p>
                  </StatMotionCard>

                  <StatMotionCard variant="blue">
                    <p className="text-xs text-[#6a7f99]">
                      Boxes
                    </p>
                    <p className="mt-3 text-3xl font-bold text-[#172f50]">
                      {
                        packingResult.result_data.Summary
                          .BoxCount
                      }
                    </p>
                    <p className="mt-2 text-xs text-[#6a7f99]">
                      used
                    </p>
                  </StatMotionCard>

                  <StatMotionCard variant="amber">
                    <p className="text-xs text-[#6a7f99]">
                      Unpacked
                    </p>
                    <p className="mt-3 text-3xl font-bold text-[#172f50]">
                      {
                        packingResult.result_data.Summary
                          .UnpackedItemCount
                      }
                    </p>
                    <p className="mt-2 text-xs text-[#6a7f99]">
                      items
                    </p>
                  </StatMotionCard>
                </section>

                
                <StatMotionCard variant="blue" className="mt-4">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-[#6a7f99]">
                        Packed weight
                      </p>
                      <p className="mt-2 text-xl font-bold text-[#172f50]">
                        {packingResult.result_data.Summary.TotalWeight.toFixed(
                          2,
                        )}{" "}
                        kg
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xs text-[#6a7f99]">
                        Overall utilisation
                      </p>
                      <p className="mt-2 text-xl font-bold text-[#236eaf]">
                        {(
                          packingResult.result_data.Summary
                            .OverallVolumeUtilisation * 100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>
                </StatMotionCard>

                {(packingResult.result_data.UnpackedItems?.length ?? 0) > 0 && (
                  <Card className="mt-4 border border-[#f0d9b5] p-5">
                    <p className="text-sm font-semibold text-[#8a5a17]">
                      Items that could not be packed
                    </p>
                    <ul className="mt-3 space-y-2">
                      {packingResult.result_data.UnpackedItems!.map((item) => (
                        <li
                          key={item.InstanceId}
                          className="rounded-lg bg-[#fff8ee] px-3 py-2 text-xs text-[#5c4a2e]"
                        >
                          <span className="font-semibold">{item.ItemCode}</span>
                          {item.ItemReference ? ` (${item.ItemReference})` : ""}
                          {": "}
                          {item.Reason || item.ReasonCode}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </section>

          )}

        {/* ========================================
            VALIDATION AND OPTIMISATION
            For orders that are not completed
        ======================================== */}

        {role === "supervisor" &&
          realOrder.status.toLowerCase() !== "completed" && (
            <Card className="mt-7 p-5">
              <p className="text-sm font-semibold text-[#172f50]">
                Packing result not available yet
              </p>

              <p className="mt-2 text-xs leading-relaxed text-[#6a7f99]">
                This order is currently{" "}
                <span className="font-semibold text-[#506782]">
                  {displayStatus}
                </span>
                .
              </p>

              {realOrder.status.toLowerCase() !== "validated" && (
                <button
                  type="button"
                  onClick={validateOrder}
                  disabled={validating}
                  className="mt-4 w-full rounded-xl bg-[#2686d5] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {validating
                    ? "Validating..."
                    : "Validate Order"}
                </button>
              )}

              {realOrder.status.toLowerCase() === "validated" && (
                <>
                  <div className="mt-4 rounded-xl border border-[#c8e9d7] bg-[#eaf9f0] px-4 py-3 text-sm text-[#137452]">
                    Order successfully validated and ready
                    for optimisation.
                  </div>

                  <button
                    type="button"
                    onClick={optimiseOrder}
                    disabled={optimising}
                    className="mt-3 w-full rounded-xl bg-[#2686d5] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {optimising
                      ? "Running optimisation..."
                      : "Run Optimisation"}
                  </button>
                </>
              )}
            </Card>
          )}

        {/* Result loading fallback */}

        {realOrder.status.toLowerCase() === "completed" &&
          !packingResult && (
            <Card className="mt-7 p-5">
              {resultError ? (
                <p className="text-sm text-[#b64641]">
                  Couldn't load the packing result: {resultError}
                </p>
              ) : (
                <p className="text-sm text-[#6a7f99]">
                  Loading packing result...
                </p>
              )}
            </Card>
          )}

        {/* ========================================
            5. ITEMS AND SELECTED BOX TYPES
            Mobile: stacked
            Desktop: side by side
        ======================================== */}

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          
          {/* Items */}

          <CollapsibleSection
            title="Items"
            count={realOrder.items.length}
            countLabel="items"
            icon={Package}
          >

              {realOrder.items.length === 0 ? (
                <Card className="p-5 text-center">
                  <Package className="mx-auto h-7 w-7 text-[#6a7f99]" />

                  <p className="mt-2 text-sm text-[#6a7f99]">
                    No items added to this order.
                  </p>
                </Card>
              ) : (
                realOrder.items.map((item, index) => (
                  <Card
                    key={`${item.ItemCode}-${index}`}
                    className="p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f3ff] text-[#2582ce]">
                        <Package className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words font-semibold text-[#172f50]">
                              {item.ItemReference}
                            </h3>

                            <p className="mt-1 break-all font-mono text-xs text-[#6a7f99]">
                              {item.ItemCode}
                            </p>
                          </div>

                          <span className="shrink-0 text-xs text-[#71849a]">
                            {item.Weight} kg
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[#70839c]">
                              Width
                            </p>
                            <p className="mt-1 text-[#283f5b]">
                              {item.Width}
                            </p>
                          </div>

                          <div>
                            <p className="text-[#70839c]">
                              Length
                            </p>
                            <p className="mt-1 text-[#283f5b]">
                              {item.Length}
                            </p>
                          </div>

                          <div>
                            <p className="text-[#70839c]">
                              Depth
                            </p>
                            <p className="mt-1 text-[#283f5b]">
                              {item.Depth}
                            </p>
                          </div>
                        </div>

                        {item.BoxGroup && (
                          <p className="mt-3 text-xs text-[#6a7f99]">
                            Box group:{" "}
                            <span className="text-[#506782]">
                              {item.BoxGroup}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
          </CollapsibleSection>

          {/* Selected Box Types */}

          
          <CollapsibleSection
            title="Selected Box Types"
            count={realOrder.box_types.length}
            countLabel="selected"
            icon={Box}
          >

              {realOrder.box_types.length === 0 ? (
                <Card className="p-5 text-center">
                  <Box className="mx-auto h-7 w-7 text-[#6a7f99]" />

                  <p className="mt-2 text-sm text-[#6a7f99]">
                    No box types selected.
                  </p>
                </Card>
              ) : (
                realOrder.box_types.map((reference) => (
                  <Card
                    key={reference}
                    className="p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f3ff] text-[#2582ce]">
                        <Box className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-[#6a7f99]">
                          Box reference
                        </p>

                        <p className="mt-1 break-words font-semibold text-[#172f50]">
                          {reference}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
          </CollapsibleSection>
        </section>

        {/* ========================================
            6. EXPORT ORDER
        ======================================== */}

        <button
          type="button"
          onClick={exportOrder}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dfe7f1] bg-[#f1f7fc] px-5 py-4 text-sm font-semibold text-[#172f50]"
        >
          <Download className="h-4 w-4" />
          Export order
        </button>
      </main>
    </AppShell>
  );
}

export default ResultPage;