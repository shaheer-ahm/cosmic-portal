import {
  Box,
  Download,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { boxSlug } from "@comp4050-fiv/visualizer";

import { apiFetch } from "../lib/api";
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
  MaxWeight: number;
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

interface PackingResultData {
  Success: boolean;
  Summary: PackingSummary;
  Boxes: PackedBox[];
  UnpackedItems: unknown[];
}

interface PackingResultResponse {
  order_id: number;
  result_data: PackingResultData;
  created_at: string;
}

export function ResultPage() {
  const { orderId } = useParams();
  
  const { role } = useAuth();

  const [realOrder, setRealOrder] =
    useState<OrderDetails | null>(null);

  const [packingResult, setPackingResult] =
    useState<PackingResultResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [validating, setValidating] =
    useState(false);

  const [optimising, setOptimising] =
    useState(false);

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

        const data =
          await apiFetch<OrderDetails>(
            `/orders/${orderId}`,
          );

        setRealOrder(data);

        if (
          data.status.toLowerCase() ===
          "completed"
        ) {
          const result =
            await apiFetch<PackingResultResponse>(
              `/orders/${data.order_id}/results`,
            );

          setPackingResult(result);
        } else {
          setPackingResult(null);
        }
      } catch (err) {
        console.error(
          "Failed to load order:",
          err,
        );

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

  const orderRef =
    `ORD-${realOrder.order_id}`;

  const displayStatus =
    realOrder.status
      .charAt(0)
      .toUpperCase() +
    realOrder.status.slice(1);

  const createdAt =
    new Date(realOrder.created_at);

  const totalWeight =
    realOrder.items.reduce(
      (total, item) =>
        total +
        item.Weight *
          (item.Quantity ?? 1),
      0,
    );

  const refreshOrder = async () => {
    const updatedOrder =
      await apiFetch<OrderDetails>(
        `/orders/${realOrder.order_id}`,
      );

    setRealOrder(updatedOrder);

    return updatedOrder;
  };

  const validateOrder = async () => {
    try {
      setValidating(true);

      const result =
        await apiFetch<ValidateResponse>(
          `/orders/${realOrder.order_id}/validate`,
          {
            method: "POST",
          },
        );

      if (!result.valid) {
        alert(
          result.issues
            .map(
              (issue) =>
                issue.message,
            )
            .join("\n"),
        );
      }

      await refreshOrder();
    } catch (err) {
      console.error(
        "Failed to validate order:",
        err,
      );

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

      const result =
        await apiFetch<OptimiseResponse>(
          `/orders/${realOrder.order_id}/optimise`,
          {
            method: "POST",
          },
        );

      const updatedOrder =
        await refreshOrder();

      if (
        updatedOrder.status.toLowerCase() ===
        "completed"
      ) {
        const packingData =
          await apiFetch<PackingResultResponse>(
            `/orders/${realOrder.order_id}/results`,
          );

        setPackingResult(packingData);
      }

      alert(result.message);
    } catch (err) {
      console.error(
        "Optimisation failed:",
        err,
      );

      alert(
        err instanceof Error
          ? err.message
          : "Optimisation failed.",
      );
    } finally {
      setOptimising(false);
    }
  };

  const exportOrder = () => {
    const exportData = {
      order: realOrder,
      packingResult,
    };

    const blob = new Blob(
      [
        JSON.stringify(
          exportData,
          null,
          2,
        ),
      ],
      {
        type: "application/json",
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `${orderRef}.json`;

    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        title={orderRef}
        right={
          <StatusBadge
            status={displayStatus}
          />
        }
      />

      <main className="cf-page">
        {/* Order information */}
        <section>
          <h2 className="text-xl font-bold text-[#172f50]">
            Order Details
          </h2>

          <p className="mt-1 text-xs text-[#6a7f99]">
            Created{" "}
            {createdAt.toLocaleDateString(
              [],
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            )}
            {" • "}
            {createdAt.toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            )}
          </p>
        </section>

        {/* Order summary */}
        <section className="mt-5 grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-[#6a7f99]">
              Items
            </p>

            <p className="mt-3 text-3xl font-bold text-[#172f50]">
              {realOrder.items.length}
            </p>

            <p className="mt-2 text-xs text-[#6a7f99]">
              Total
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-[#6a7f99]">
              Box types
            </p>

            <p className="mt-3 text-3xl font-bold text-[#172f50]">
              {realOrder.box_types.length}
            </p>

            <p className="mt-2 text-xs text-[#6a7f99]">
              Selected
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-[#6a7f99]">
              Weight
            </p>

            <p className="mt-3 text-2xl font-bold text-[#172f50]">
              {totalWeight.toFixed(1)}
            </p>

            <p className="mt-2 text-xs text-[#6a7f99]">
              kg
            </p>
          </Card>
        </section>

        {/* Items */}
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
            Items
          </h2>

          <div className="mt-4 space-y-3">
            {realOrder.items.length === 0 ? (
              <Card className="p-5 text-center">
                <Package className="mx-auto h-7 w-7 text-[#6a7f99]" />

                <p className="mt-2 text-sm text-[#6a7f99]">
                  No items added to this order.
                </p>
              </Card>
            ) : (
              realOrder.items.map(
                (item, index) => (
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
                          <div>
                            <h3 className="font-semibold text-[#172f50]">
                              {
                                item.ItemReference
                              }
                            </h3>

                            <p className="mt-1 font-mono text-xs text-[#6a7f99]">
                              {
                                item.ItemCode
                              }
                            </p>
                          </div>

                          <span className="text-xs text-[#71849a]">
                            {
                              item.Weight
                            }{" "}
                            kg
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[#70839c]">
                              Width
                            </p>
                            <p className="mt-1 text-[#283f5b]">
                              {
                                item.Width
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-[#70839c]">
                              Length
                            </p>
                            <p className="mt-1 text-[#283f5b]">
                              {
                                item.Length
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-[#70839c]">
                              Depth
                            </p>
                            <p className="mt-1 text-[#283f5b]">
                              {
                                item.Depth
                              }
                            </p>
                          </div>
                        </div>

                        {item.BoxGroup && (
                          <p className="mt-3 text-xs text-[#6a7f99]">
                            Box group:{" "}
                            <span className="text-[#506782]">
                              {
                                item.BoxGroup
                              }
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ),
              )
            )}
          </div>
        </section>

        {/* Selected box types */}
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
            Selected Box Types
          </h2>

          <div className="mt-4 space-y-3">
            {realOrder.box_types.length === 0 ? (
              <Card className="p-5 text-center">
                <Box className="mx-auto h-7 w-7 text-[#6a7f99]" />

                <p className="mt-2 text-sm text-[#6a7f99]">
                  No box types selected.
                </p>
              </Card>
            ) : (
              realOrder.box_types.map(
                (reference) => (
                  <Card
                    key={reference}
                    className="p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e7f3ff] text-[#2582ce]">
                        <Box className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-xs text-[#6a7f99]">
                          Box reference
                        </p>

                        <p className="mt-1 font-semibold text-[#172f50]">
                          {reference}
                        </p>
                      </div>
                    </div>
                  </Card>
                ),
              )
            )}
          </div>
        </section>

        {/* Supervisor-only Validation / optimisation */}
        {role === "supervisor" &&
          realOrder.status.toLowerCase() !==
          "completed" && (
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

            {realOrder.status.toLowerCase() !==
              "validated" && (
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

            {realOrder.status.toLowerCase() ===
              "validated" && (
              <>
                <div className="mt-4 rounded-xl border border-[#c8e9d7] bg-[#eaf9f0] px-4 py-3 text-sm text-[#137452]">
                  Order successfully validated
                  and ready for optimisation.
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

        {/* Real packing result summary */}
        {realOrder.status.toLowerCase() ===
          "completed" &&
          packingResult && (
            <>
              <section className="mt-8">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
                  Packing Result
                </h2>

                <section className="mt-4 grid grid-cols-3 gap-3">
                  <Card className="p-4">
                    <p className="text-xs text-[#6a7f99]">
                      Packed
                    </p>

                    <p className="mt-3 text-3xl font-bold text-[#15845f]">
                      {
                        packingResult
                          .result_data
                          .Summary
                          .PackedItemCount
                      }
                    </p>

                    <p className="mt-2 text-xs text-[#6a7f99]">
                      items
                    </p>
                  </Card>

                  <Card className="p-4">
                    <p className="text-xs text-[#6a7f99]">
                      Boxes
                    </p>

                    <p className="mt-3 text-3xl font-bold text-[#172f50]">
                      {
                        packingResult
                          .result_data
                          .Summary
                          .BoxCount
                      }
                    </p>

                    <p className="mt-2 text-xs text-[#6a7f99]">
                      used
                    </p>
                  </Card>

                  <Card className="p-4">
                    <p className="text-xs text-[#6a7f99]">
                      Unpacked
                    </p>

                    <p className="mt-3 text-3xl font-bold text-[#172f50]">
                      {
                        packingResult
                          .result_data
                          .Summary
                          .UnpackedItemCount
                      }
                    </p>

                    <p className="mt-2 text-xs text-[#6a7f99]">
                      items
                    </p>
                  </Card>
                </section>

                <Card className="mt-4 p-5">
                  <div className="flex items-center justify-between">
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

                    <div className="text-right">
                      <p className="text-xs text-[#6a7f99]">
                        Overall utilisation
                      </p>

                      <p className="mt-2 text-xl font-bold text-[#236eaf]">
                        {(
                          packingResult
                            .result_data
                            .Summary
                            .OverallVolumeUtilisation *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Real packing plan */}
              <section className="mt-8">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
                  Packing Plan
                </h2>

                <div className="mt-4 space-y-4 cf-result-cartons">
                  {packingResult.result_data.Boxes.map(
                    (box) => {
                      const utilisationPercent =
                        box.VolumeUtilisation *
                        100;

                      return (
                        <Link
                          key={box.BoxIndex}
                          to={`/orders/${realOrder.order_id}/boxes/${boxSlug(box.BoxIndex)}`}
                          className="block"
                        >
                        <Card className="p-4 transition-colors hover:border-[#86bde8]">
                          <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f3ff] text-[#2582ce]">
                              <Box className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="font-semibold text-[#172f50]">
                                    Box{" "}
                                    {box.BoxIndex +
                                      1}
                                  </h3>

                                  <p className="mt-1 text-xs text-[#236eaf]">
                                    {
                                      box.Reference
                                    }
                                  </p>

                                  {box.BoxGroup && (
                                    <p className="mt-1 text-xs text-[#6a7f99]">
                                      Group:{" "}
                                      {
                                        box.BoxGroup
                                      }
                                    </p>
                                  )}
                                </div>

                                <span className="rounded-full bg-[#eaf9f0] px-3 py-1 text-xs font-semibold text-[#137452]">
                                  {
                                    box.ItemCount
                                  }{" "}
                                  {box.ItemCount ===
                                  1
                                    ? "item"
                                    : "items"}
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <p className="text-[#70839c]">
                                    Weight
                                  </p>

                                  <p className="mt-1 text-[#283f5b]">
                                    {box.TotalWeight.toFixed(
                                      2,
                                    )}{" "}
                                    /{" "}
                                    {box.MaxWeight.toFixed(
                                      2,
                                    )}{" "}
                                    kg
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[#70839c]">
                                    Utilisation
                                  </p>

                                  <p className="mt-1 text-[#283f5b]">
                                    {utilisationPercent.toFixed(
                                      1,
                                    )}
                                    %
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                                <div>
                                  <p className="text-[#70839c]">
                                    Width
                                  </p>

                                  <p className="mt-1 text-[#283f5b]">
                                    {
                                      box
                                        .Dimensions
                                        .Width
                                    }
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[#70839c]">
                                    Length
                                  </p>

                                  <p className="mt-1 text-[#283f5b]">
                                    {
                                      box
                                        .Dimensions
                                        .Length
                                    }
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[#70839c]">
                                    Depth
                                  </p>

                                  <p className="mt-1 text-[#283f5b]">
                                    {
                                      box
                                        .Dimensions
                                        .Depth
                                    }
                                  </p>
                                </div>
                              </div>

                              {/* Utilisation bar */}
                              <div className="mt-4">
                                <div className="h-2 overflow-hidden rounded-full bg-[#e7eef6]">
                                  <div
                                    className="h-full rounded-full bg-[#2686d5]"
                                    style={{
                                      width: `${Math.min(
                                        utilisationPercent,
                                        100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Packed items */}
                              <div className="mt-5">
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#7187a0]">
                                  Packed Items
                                </p>

                                <div className="mt-3 space-y-2">
                                  {box.Items.map(
                                    (item) => (
                                      <div
                                        key={
                                          item.InstanceId
                                        }
                                        className="rounded-xl border border-[#dfe7f1] bg-white p-3"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="text-sm font-semibold text-[#172f50]">
                                              {
                                                item.ItemReference
                                              }
                                            </p>

                                            <p className="mt-1 font-mono text-xs text-[#6a7f99]">
                                              {
                                                item.ItemCode
                                              }
                                            </p>
                                          </div>

                                          <span className="text-xs text-[#71849a]">
                                            {
                                              item.Weight
                                            }{" "}
                                            kg
                                          </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                          <div>
                                            <p className="text-[#70839c]">
                                              Position
                                            </p>

                                            <p className="mt-1 text-[#283f5b]">
                                              X{" "}
                                              {
                                                item
                                                  .Position
                                                  .X
                                              }
                                              , Y{" "}
                                              {
                                                item
                                                  .Position
                                                  .Y
                                              }
                                              , Z{" "}
                                              {
                                                item
                                                  .Position
                                                  .Z
                                              }
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-[#70839c]">
                                              Orientation
                                            </p>

                                            <p className="mt-1 text-[#283f5b]">
                                              {
                                                item
                                                  .Orientation
                                                  .Code
                                              }
                                            </p>
                                          </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                          <div>
                                            <p className="text-[#70839c]">
                                              W
                                            </p>

                                            <p className="mt-1 text-[#283f5b]">
                                              {
                                                item
                                                  .Dimensions
                                                  .Width
                                              }
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-[#70839c]">
                                              L
                                            </p>

                                            <p className="mt-1 text-[#283f5b]">
                                              {
                                                item
                                                  .Dimensions
                                                  .Length
                                              }
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-[#70839c]">
                                              D
                                            </p>

                                            <p className="mt-1 text-[#283f5b]">
                                              {
                                                item
                                                  .Dimensions
                                                  .Depth
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                        </Link>
                      );
                    },
                  )}
                </div>
              </section>
            </>
          )}

        {/* Result loading fallback */}
        {realOrder.status.toLowerCase() ===
          "completed" &&
          !packingResult && (
            <Card className="mt-7 p-5">
              <p className="text-sm text-[#6a7f99]">
                Loading packing result...
              </p>
            </Card>
          )}

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