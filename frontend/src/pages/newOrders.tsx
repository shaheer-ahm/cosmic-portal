
import {
  Box as BoxIcon,
  Plus,
  Send,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { ItemEditor } from "../components/orders/ItemEditor";
import { Card } from "../components/ui/Card";
import { apiFetch } from "../lib/api";

import type { BoxType, PackerItem } from "../types/domain";

const blankItem = (): PackerItem => ({
  ItemCode: "",
  ItemReference: "",
  Width: 0,
  Length: 0,
  Depth: 0,
  Weight: 0,
  Quantity: 1,
  BoxGroup: "",
  Fragile: false,
});

const sampleItems: PackerItem[] = [
  {
    ItemCode: "ITM-001",
    ItemReference: "Widget A",
    Width: 100,
    Length: 200,
    Depth: 50,
    Weight: 1,
    Quantity: 1,
    BoxGroup: "GROUP-A",
    Fragile: false,
  },
  {
    ItemCode: "ITM-002",
    ItemReference: "Widget B",
    Width: 300,
    Length: 150,
    Depth: 75,
    Weight: 2.8,
    Quantity: 1,
    Fragile: false,
  },
  {
    ItemCode: "ITM-003",
    ItemReference: "Fragile Glassware",
    Width: 80,
    Length: 80,
    Depth: 120,
    Weight: 0.82,
    Quantity: 1,
    BoxGroup: "GROUP-B",
    Fragile: true,
  },
];

export function NewOrderPage() {
  const [orderRef, setOrderRef] = useState("");
  const [items, setItems] = useState<PackerItem[]>([
    blankItem(),
  ]);

  const [boxes, setBoxes] = useState<BoxType[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(true);
  const [boxError, setBoxError] = useState<string | null>(
    null
  );

  const [issues, setIssues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get the current carton catalogue from FitPortal.
  // No carton dimensions are hardcoded in the frontend.
  const loadBoxes = useCallback(async () => {
    setLoadingBoxes(true);
    setBoxError(null);

    try {
      const available = await apiFetch<BoxType[]>(
        "/box-types/"
      );

      const active = available.filter(
        (box) => box.Active !== false
      );

      setBoxes(active);

      if (active.length === 0) {
        setBoxError(
          "No active carton types are configured. " +
            "Please contact a supervisor."
        );
      }
    } catch (error) {
      setBoxes([]);
      setBoxError(
        error instanceof Error
          ? error.message
          : "Unable to load available carton types."
      );
    } finally {
      setLoadingBoxes(false);
    }
  }, []);

  useEffect(() => {
    void loadBoxes();
  }, [loadBoxes]);

  const loadSamples = () => {
    setItems(sampleItems.map((item) => ({ ...item })));
    setOrderRef("");
    setIssues([]);
    setSubmitted(false);
  };

  const addItem = () => {
    setItems((current) => [...current, blankItem()]);
    setSubmitted(false);
  };

  const updateItem = (
    index: number,
    updatedItem: PackerItem
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? updatedItem : item
      )
    );

    setSubmitted(false);
  };

  const removeItem = (index: number) => {
    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );

    setSubmitted(false);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (items.length === 0) {
      errors.push("At least one item is required.");
    }

    items.forEach((item, index) => {
      const number = index + 1;

      if (!item.ItemCode.trim()) {
        errors.push(
          `Item ${number}: Item code is required.`
        );
      }

      if (!item.ItemReference.trim()) {
        errors.push(
          `Item ${number}: Item reference is required.`
        );
      }

      if (
        !Number.isInteger(item.Width) ||
        item.Width <= 0
      ) {
        errors.push(
          `Item ${number}: Width must be a positive whole number.`
        );
      }

      if (
        !Number.isInteger(item.Length) ||
        item.Length <= 0
      ) {
        errors.push(
          `Item ${number}: Length must be a positive whole number.`
        );
      }

      if (
        !Number.isInteger(item.Depth) ||
        item.Depth <= 0
      ) {
        errors.push(
          `Item ${number}: Depth must be a positive whole number.`
        );
      }

      if (
        !Number.isFinite(item.Weight) ||
        item.Weight < 0
      ) {
        errors.push(
          `Item ${number}: Weight cannot be negative.`
        );
      }

      if (
        !Number.isInteger(item.Quantity) ||
        item.Quantity < 1
      ) {
        errors.push(
          `Item ${number}: Quantity must be a whole number of at least 1.`
        );
      }
    });

    const itemCodes = items
      .map((item) => item.ItemCode.trim().toUpperCase())
      .filter(Boolean);

    if (new Set(itemCodes).size !== itemCodes.length) {
      errors.push("Item codes must be unique.");
    }

    if (loadingBoxes) {
      errors.push(
        "Wait for available carton types to load."
      );
    } else if (boxError) {
      errors.push(
        "Available carton types could not be loaded."
      );
    } else if (boxes.length === 0) {
      errors.push(
        "At least one active carton type is required."
      );
    }

    return errors;
  };

  const submit = async () => {
    if (submitting) return;

    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      setIssues(validationErrors);
      setSubmitted(false);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    setIssues([]);
    setSubmitting(true);
    setSubmitted(false);

    let createdOrderId: number | null = null;

    try {
      // 1. Create an empty order.
      const createdOrder = await apiFetch<{
        order_id: number;
        status: string;
        created_at: string;
      }>("/orders/", {
        method: "POST",
        body: JSON.stringify({}),
      });

      createdOrderId = createdOrder.order_id;

      // 2. Add every item, including Fragile metadata.
      await Promise.all(
        items.map((item) =>
          apiFetch(
            `/orders/${createdOrder.order_id}/items/`,
            {
              method: "POST",
              body: JSON.stringify({
                ItemCode: item.ItemCode.trim(),
                ItemReference: item.ItemReference.trim(),
                Width: item.Width,
                Length: item.Length,
                Depth: item.Depth,
                Weight: item.Weight,
                Quantity: item.Quantity,
                BoxGroup:
                  item.BoxGroup?.trim() || null,
                Fragile: item.Fragile ?? false,
              }),
            }
          )
        )
      );

      // 3. Automatically assign all active carton
      // types using references from the database.
      await apiFetch(
        `/orders/${createdOrder.order_id}/box-types`,
        {
          method: "POST",
          body: JSON.stringify({
            references: boxes.map(
              (box) => box.Reference
            ),
          }),
        }
      );

      setOrderRef(`ORD-${createdOrder.order_id}`);
      setSubmitted(true);

      console.log(
        "ORDER + ITEMS + BOX TYPES SAVED:",
        createdOrder.order_id
      );
    } catch (error) {
      console.error("Failed to submit order:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit order.";

      setIssues([
        createdOrderId !== null
          ? `Order ${createdOrderId} was created, but saving its details failed: ${message}. Check the Orders page before retrying.`
          : message,
      ]);

      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AppShell>
      <PageHeader title="New Order" />

      <main className="cf-page">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e7f3ff] text-[#2582ce]">
              <BoxIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="orderRef"
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#758ba2]"
              >
                Order reference
              </label>

              <input
                id="orderRef"
                value={orderRef}
                readOnly
                placeholder="Generated after submission"
                className="mt-1 w-full cursor-not-allowed bg-transparent text-xl font-bold text-[#172f50] outline-none placeholder:text-[#94a5b8]"
              />

              <p className="mt-1 text-xs text-[#70839c]">
                Assigned automatically by FitPortal.
              </p>
            </div>
          </div>
        </Card>

        {issues.length > 0 && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-[#f1ccc6] bg-[#fff1ef] p-4 text-sm text-[#b64641]"
          >
            <p className="font-semibold">
              Fix these issues before submitting:
            </p>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              {issues.map((issue, index) => (
                <li key={`${issue}-${index}`}>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {submitted && (
          <div
            role="status"
            className="mt-4 rounded-2xl border border-[#bfe9d2] bg-[#eaf9f0] p-4 text-sm text-[#137452]"
          >
            Order saved successfully as {orderRef}.
          </div>
        )}

        <button
          type="button"
          onClick={loadSamples}
          disabled={submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#b6d8f6] bg-[#eff7ff] px-4 py-3 text-sm font-semibold text-[#217fc7] disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Load sample data
        </button>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
                Items
              </p>

              <p className="mt-1 text-xs text-[#70839c]">
                Add the items that need to be packed.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              disabled={submitting}
              aria-label="Add item"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7f3ff] text-[#1b75bc] disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="cf-editor-grid">
            {items.map((item, index) => (
              <ItemEditor
                key={index}
                item={item}
                index={index}
                onChange={(updatedItem) =>
                  updateItem(index, updatedItem)
                }
                onRemove={() => removeItem(index)}
              />
            ))}

            {items.length === 0 && (
              <Card className="p-5 text-center text-sm text-[#71849a]">
                No items added.
              </Card>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
                Available carton types
              </p>

              <p className="mt-1 text-xs text-[#70839c]">
                Managed by FitPortal and automatically
                assigned to new orders.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadBoxes()}
              disabled={loadingBoxes || submitting}
              className="flex items-center gap-2 rounded-xl border border-[#d8e5f1] bg-white px-3 py-2 text-xs font-semibold text-[#217fc7] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loadingBoxes ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>

          <Card className="p-5">
            {loadingBoxes ? (
              <p
                role="status"
                className="text-sm text-[#71849a]"
              >
                Loading carton types...
              </p>
            ) : boxError ? (
              <p
                role="alert"
                className="text-sm text-[#b64641]"
              >
                {boxError}
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#172f50]">
                  {boxes.length} active carton
                  {boxes.length === 1 ? "" : " types"}
                </p>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {boxes.map((box) => (
                    <div
                      key={box.Reference}
                      className="rounded-xl border border-[#dce6ef] bg-[#f8fbff] p-4"
                    >
                      <div className="flex items-center gap-2">
                        <BoxIcon className="h-4 w-4 text-[#2686d5]" />

                        <p className="text-sm font-bold text-[#172f50]">
                          {box.Reference}
                        </p>
                      </div>

                      <p className="mt-2 text-xs text-[#71849a]">
                        {box.Width} × {box.Length} ×{" "}
                        {box.Depth} mm
                      </p>

                      {box.MaxWeight != null && (
                        <p className="mt-1 text-xs text-[#71849a]">
                          Max weight: {box.MaxWeight} kg
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[#71849a]">
                  Carton sizes are configured centrally.
                  No manual box dimensions are required.
                </p>
              </div>
            )}
          </Card>
        </section>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={
            submitting ||
            loadingBoxes ||
            boxes.length === 0 ||
            Boolean(boxError)
          }
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2686d5] px-5 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}

          {submitting ? "Submitting..." : "Submit Order"}
        </button>
      </main>
    </AppShell>
  );
}

export default NewOrderPage;
