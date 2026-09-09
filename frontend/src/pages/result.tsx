import {
  Box,
  Download,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { boxSlug } from "@perfect-fit/visualizer";

import { apiFetch } from "../lib/api";

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
        <main className="px-5 py-10 text-center text-sm text-[#777d92]">
          Loading order...
        </main>
      </AppShell>
    );
  }

  if (error || !realOrder) {
    return (
      <AppShell>
        <main className="px-5 py-10">
          <Card className="p-5 text-center">
            <p className="text-sm font-semibold text-red-400">
              Unable to load order
            </p>

            <p className="mt-2 text-xs text-[#777d92]">
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

      <main className="px-5 py-5 pb-24">
        {/* Order information */}
        <section>
          <h2 className="text-xl font-bold text-white">
            Order Details
          </h2>

          <p className="mt-1 text-xs text-[#777d92]">
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
            <p className="text-xs text-[#777d92]">
              Items
            </p>

            <p className="mt-3 text-3xl font-bold text-white">
              {realOrder.items.length}
            </p>

            <p className="mt-2 text-xs text-[#777d92]">
              Total
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-[#777d92]">
              Box types
            </p>

            <p className="mt-3 text-3xl font-bold text-white">
              {realOrder.box_types.length}
            </p>

            <p className="mt-2 text-xs text-[#777d92]">
              Selected
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-xs text-[#777d92]">
              Weight
            </p>

            <p className="mt-3 text-2xl font-bold text-white">
              {totalWeight.toFixed(1)}
            </p>

            <p className="mt-2 text-xs text-[#777d92]">
              kg
            </p>
          </Card>
        </section>

        {/* Items */}
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#777d98]">
            Items
          </h2>

          <div className="mt-4 space-y-3">
            {realOrder.items.length === 0 ? (
              <Card className="p-5 text-center">
                <Package className="mx-auto h-7 w-7 text-[#777d92]" />

                <p className="mt-2 text-sm text-[#777d92]">
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
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#2d3150] text-[#727eff]">
                        <Package className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-white">
                              {
                                item.ItemReference
                              }
                            </h3>

                            <p className="mt-1 font-mono text-xs text-[#777d92]">
                              {
                                item.ItemCode
                              }
                            </p>
                          </div>

                          <span className="text-xs text-[#9ba0b3]">
                            {
                              item.Weight
                            }{" "}
                            kg
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[#666c80]">
                              Width
                            </p>
                            <p className="mt-1 text-[#d9dbe2]">
                              {
                                item.Width
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-[#666c80]">
                              Length
                            </p>
                            <p className="mt-1 text-[#d9dbe2]">
                              {
                                item.Length
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-[#666c80]">
                              Depth
                            </p>
                            <p className="mt-1 text-[#d9dbe2]">
                              {
                                item.Depth
                              }
                            </p>
                          </div>
                        </div>

                        {item.BoxGroup && (
                          <p className="mt-3 text-xs text-[#777d92]">
                            Box group:{" "}
                            <span className="text-[#b2b6c4]">
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
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#777d98]">
            Selected Box Types
          </h2>

          <div className="mt-4 space-y-3">
            {realOrder.box_types.length === 0 ? (
              <Card className="p-5 text-center">
                <Box className="mx-auto h-7 w-7 text-[#777d92]" />

                <p className="mt-2 text-sm text-[#777d92]">
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
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#2d3150] text-[#727eff]">
                        <Box className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-xs text-[#777d92]">
                          Box reference
                        </p>

                        <p className="mt-1 font-semibold text-white">
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

        {/* Validation / optimisation */}
        {realOrder.status.toLowerCase() !==
          "completed" && (
          <Card className="mt-7 p-5">
            <p className="text-sm font-semibold text-white">
              Packing result not available yet
            </p>

            <p className="mt-2 text-xs leading-relaxed text-[#777d92]">
              This order is currently{" "}
              <span className="font-semibold text-[#b2b6c4]">
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
                className="mt-4 w-full rounded-xl bg-[#6675ff] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {validating
                  ? "Validating..."
                  : "Validate Order"}
              </button>
            )}

            {realOrder.status.toLowerCase() ===
              "validated" && (
              <>
                <div className="mt-4 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-300">
                  Order successfully validated
                  and ready for optimisation.
                </div>

                <button
                  type="button"
                  onClick={optimiseOrder}
                  disabled={optimising}
                  className="mt-3 w-full rounded-xl bg-[#6675ff] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
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
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#777d98]">
                  Packing Result
                </h2>

                <section className="mt-4 grid grid-cols-3 gap-3">
                  <Card className="p-4">
                    <p className="text-xs text-[#777d92]">
                      Packed
                    </p>

                    <p className="mt-3 text-3xl font-bold text-green-400">
                      {
                        packingResult
                          .result_data
                          .Summary
                          .PackedItemCount
                      }
                    </p>

                    <p className="mt-2 text-xs text-[#777d92]">
                      items
                    </p>
                  </Card>

                  <Card className="p-4">
                    <p className="text-xs text-[#777d92]">
                      Boxes
                    </p>

                    <p className="mt-3 text-3xl font-bold text-white">
                      {
                        packingResult
                          .result_data
                          .Summary
                          .BoxCount
                      }
                    </p>

                    <p className="mt-2 text-xs text-[#777d92]">
                      used
                    </p>
                  </Card>

                  <Card className="p-4">
                    <p className="text-xs text-[#777d92]">
                      Unpacked
                    </p>

                    <p className="mt-3 text-3xl font-bold text-white">
                      {
                        packingResult
                          .result_data
                          .Summary
                          .UnpackedItemCount
                      }
                    </p>

                    <p className="mt-2 text-xs text-[#777d92]">
                      items
                    </p>
                  </Card>
                </section>

                <Card className="mt-4 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#777d92]">
                        Packed weight
                      </p>

                      <p className="mt-2 text-xl font-bold text-white">
                        {packingResult.result_data.Summary.TotalWeight.toFixed(
                          2,
                        )}{" "}
                        kg
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-[#777d92]">
                        Overall utilisation
                      </p>

                      <p className="mt-2 text-xl font-bold text-[#8c95ff]">
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
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#777d98]">
                  Packing Plan
                </h2>

                <div className="mt-4 space-y-4">
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
                        <Card className="p-4 transition-colors hover:border-[#727eff]">
                          <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#2d3150] text-[#727eff]">
                              <Box className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="font-semibold text-white">
                                    Box{" "}
                                    {box.BoxIndex +
                                      1}
                                  </h3>

                                  <p className="mt-1 text-xs text-[#8c95ff]">
                                    {
                                      box.Reference
                                    }
                                  </p>

                                  {box.BoxGroup && (
                                    <p className="mt-1 text-xs text-[#777d92]">
                                      Group:{" "}
                                      {
                                        box.BoxGroup
                                      }
                                    </p>
                                  )}
                                </div>

                                <span className="rounded-full bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-300">
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
                                  <p className="text-[#666c80]">
                                    Weight
                                  </p>

                                  <p className="mt-1 text-[#d9dbe2]">
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
                                  <p className="text-[#666c80]">
                                    Utilisation
                                  </p>

                                  <p className="mt-1 text-[#d9dbe2]">
                                    {utilisationPercent.toFixed(
                                      1,
                                    )}
                                    %
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                                <div>
                                  <p className="text-[#666c80]">
                                    Width
                                  </p>

                                  <p className="mt-1 text-[#d9dbe2]">
                                    {
                                      box
                                        .Dimensions
                                        .Width
                                    }
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[#666c80]">
                                    Length
                                  </p>

                                  <p className="mt-1 text-[#d9dbe2]">
                                    {
                                      box
                                        .Dimensions
                                        .Length
                                    }
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[#666c80]">
                                    Depth
                                  </p>

                                  <p className="mt-1 text-[#d9dbe2]">
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
                                <div className="h-2 overflow-hidden rounded-full bg-[#343842]">
                                  <div
                                    className="h-full rounded-full bg-[#6675ff]"
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
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#777d98]">
                                  Packed Items
                                </p>

                                <div className="mt-3 space-y-2">
                                  {box.Items.map(
                                    (item) => (
                                      <div
                                        key={
                                          item.InstanceId
                                        }
                                        className="rounded-xl border border-[#303440] bg-[#1b1e27] p-3"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="text-sm font-semibold text-white">
                                              {
                                                item.ItemReference
                                              }
                                            </p>

                                            <p className="mt-1 font-mono text-xs text-[#777d92]">
                                              {
                                                item.ItemCode
                                              }
                                            </p>
                                          </div>

                                          <span className="text-xs text-[#9ba0b3]">
                                            {
                                              item.Weight
                                            }{" "}
                                            kg
                                          </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                          <div>
                                            <p className="text-[#666c80]">
                                              Position
                                            </p>

                                            <p className="mt-1 text-[#d9dbe2]">
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
                                            <p className="text-[#666c80]">
                                              Orientation
                                            </p>

                                            <p className="mt-1 text-[#d9dbe2]">
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
                                            <p className="text-[#666c80]">
                                              W
                                            </p>

                                            <p className="mt-1 text-[#d9dbe2]">
                                              {
                                                item
                                                  .Dimensions
                                                  .Width
                                              }
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-[#666c80]">
                                              L
                                            </p>

                                            <p className="mt-1 text-[#d9dbe2]">
                                              {
                                                item
                                                  .Dimensions
                                                  .Length
                                              }
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-[#666c80]">
                                              D
                                            </p>

                                            <p className="mt-1 text-[#d9dbe2]">
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
              <p className="text-sm text-[#777d92]">
                Loading packing result...
              </p>
            </Card>
          )}

        <button
          type="button"
          onClick={exportOrder}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#383c49] bg-[#252831] px-5 py-4 text-sm font-semibold text-white"
        >
          <Download className="h-4 w-4" />
          Export order
        </button>
      </main>
    </AppShell>
  );
}

export default ResultPage;