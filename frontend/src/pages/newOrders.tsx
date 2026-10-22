
import {
  Box as BoxIcon,
  Plus,
  Send,
  Sparkles,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { ItemEditor } from "../components/orders/ItemEditor";
import { CustomBoxForm } from "../components/orders/CustomBoxForm";
import { Card } from "../components/ui/Card";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/useAuth";

import type { BoxType, PackerItem } from "../types/domain";

import { JsonItemImporter } from "../components/orders/JsonItemImporter";

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
  const { role } = useAuth();

  // Backend RBAC roles are uppercase:
  // USER and SUPERVISOR.
  const isSupervisor =
    role?.toUpperCase() === "SUPERVISOR";

  const [orderRef, setOrderRef] = useState("");

  const [items, setItems] = useState<PackerItem[]>([
    blankItem(),
  ]);

  const [boxes, setBoxes] = useState<BoxType[]>([]);
  const [selectedBoxRefs, setSelectedBoxRefs] = useState<
    string[]
  >([]);

  const [loadingBoxes, setLoadingBoxes] = useState(true);
  const [boxError, setBoxError] = useState<string | null>(
    null
  );

  const [showCustomBoxForm, setShowCustomBoxForm] =
    useState(false);

  const [issues, setIssues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tracks whether initial carton selection has been set.
  const boxSelectionInitialized = useRef(false);

  // --------------------------------------------------
  // Load active carton catalogue from backend
  // --------------------------------------------------

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

      if (!boxSelectionInitialized.current) {
        boxSelectionInitialized.current = true;

        // Preserve previous behaviour:
        // all active cartons selected initially.
        setSelectedBoxRefs(
          active.map((box) => box.Reference)
        );
      } else {
        // On refresh, preserve user selections.
        // Remove references that became inactive.
        setSelectedBoxRefs((current) =>
          current.filter((reference) =>
            active.some(
              (box) => box.Reference === reference
            )
          )
        );
      }

      if (active.length === 0) {
        setBoxError(
          "No active carton types are configured. " +
            "Please contact a supervisor."
        );
      }
    } catch (error) {
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

  // --------------------------------------------------
  // Carton selection
  // --------------------------------------------------

  const toggleBox = (reference: string) => {
    if (submitting) return;

    setSelectedBoxRefs((current) =>
      current.includes(reference)
        ? current.filter((ref) => ref !== reference)
        : [...current, reference]
    );

    setSubmitted(false);
    setOrderRef("");
  };

  // Newly created carton is added to the local
  // catalogue and selected for this order.
  const handleCustomBoxCreated = (box: BoxType) => {
    setBoxes((current) => {
      const exists = current.some(
        (existing) =>
          existing.Reference === box.Reference
      );

      if (exists) return current;

      return [...current, box].sort((a, b) =>
        a.Reference.localeCompare(b.Reference)
      );
    });

    setSelectedBoxRefs((current) =>
      current.includes(box.Reference)
        ? current
        : [...current, box.Reference]
    );

    setShowCustomBoxForm(false);
    setBoxError(null);
    setSubmitted(false);
    setOrderRef("");
  };

  
  const [deletingBox, setDeletingBox] = useState<
    string | null
  >(null);

  const [deleteError, setDeleteError] = useState<
    string | null
  >(null);

  
  const deleteCustomBox = async (reference: string) => {
    if (
      !isSupervisor ||
      submitting ||
      deletingBox !== null ||
      loadingBoxes
    ) {
      return;
    }

    
    const systemCartons = ["SML", "MED", "LRG"];

    if (systemCartons.includes(reference.toUpperCase())) {
      return;
    }


    const confirmed = window.confirm(
      `Remove ${reference} from the shared carton catalogue?\n\n` +
      "This will make it unavailable for new orders. " +
      "Historical completed orders will be preserved."
    );

    if (!confirmed) return;

    setDeletingBox(reference);
    setDeleteError(null);

    try {
      await apiFetch<void>(
        `/box-types/${encodeURIComponent(reference)}`,
        { method: "DELETE" }
      );

      setBoxes((current) =>
        current.filter(
          (box) => box.Reference !== reference
        )
      );

      setSelectedBoxRefs((current) =>
        current.filter(
          (ref) => ref !== reference
        )
      );

      setSubmitted(false);
      setOrderRef("");
      setIssues([]);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Unable to delete custom carton."
      );
    } finally {
      setDeletingBox(null);
    }
  };



  // --------------------------------------------------
  // Item management
  // --------------------------------------------------

  const loadSamples = () => {
    setItems(
      sampleItems.map((item) => ({ ...item }))
    );

    setOrderRef("");
    setIssues([]);
    setSubmitted(false);
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      blankItem(),
    ]);

    setSubmitted(false);
    setOrderRef("");
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
    setOrderRef("");
  };

  const removeItem = (index: number) => {
    setItems((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );

    setSubmitted(false);
    setOrderRef("");
  };

  // --------------------------------------------------
  // Validation
  // --------------------------------------------------

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (items.length === 0) {
      errors.push(
        "At least one item is required."
      );
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
        item.Weight <= 0
      ) {
        errors.push(
          `Item ${number}: Weight cannot be zero or negative.`
        );
      }

      if (
        !item.Quantity ||
        !Number.isInteger(item.Quantity) ||
        item.Quantity < 1
      ) {
        errors.push(
          `Item ${number}: Quantity is mandatory and must be a whole number of at least 1.`
        );
      }
    });

    const itemCodes = items
      .map((item) =>
        item.ItemCode.trim().toUpperCase()
      )
      .filter(Boolean);

    if (
      new Set(itemCodes).size !== itemCodes.length
    ) {
      errors.push(
        "Item codes must be unique."
      );
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

    if (selectedBoxRefs.length === 0) {
      errors.push(
        "Select at least one carton type for this order."
      );
    }

    return errors;
  };

  // --------------------------------------------------
  // Submit order to FitPortal backend
  // --------------------------------------------------

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
      // 1. Create the order.
      const createdOrder = await apiFetch<{
        order_id: number;
        status: string;
        created_at: string;
      }>("/orders/", {
        method: "POST",
        body: JSON.stringify({}),
      });

      createdOrderId = createdOrder.order_id;

      // 2. Save all items.
      // Fragile and BoxGroup are preserved.
      await Promise.all(
        items.map((item) =>
          apiFetch(
            `/orders/${createdOrder.order_id}/items/`,
            {
              method: "POST",
              body: JSON.stringify({
                ItemCode:
                  item.ItemCode.trim(),
                ItemReference:
                  item.ItemReference.trim(),
                Width: item.Width,
                Length: item.Length,
                Depth: item.Depth,
                Weight: item.Weight,
                Quantity: item.Quantity,
                BoxGroup:
                  item.BoxGroup?.trim() || null,
                Fragile:
                  item.Fragile ?? false,
              }),
            }
          )
        )
      );

      // 3. Attach ONLY the selected cartons.
      // These can include newly created
      // custom catalogue cartons.
      await apiFetch(
        `/orders/${createdOrder.order_id}/box-types`,
        {
          method: "POST",
          body: JSON.stringify({
            references: selectedBoxRefs,
          }),
        }
      );

      setOrderRef(
        `ORD-${createdOrder.order_id}`
      );

      setSubmitted(true);

      console.log(
        "Order saved:",
        createdOrder.order_id
      );
    } catch (error) {
      console.error(
        "Failed to submit order:",
        error
      );

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

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <AppShell>

      <PageHeader title="New Order" backTo="/dashboard" />

      <main className="cf-page">
        {/* Order reference */}

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

        {/* Validation errors */}

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

        {/* Success message */}

        {submitted && (
          <div
            role="status"
            className="mt-4 rounded-2xl border border-[#bfe9d2] bg-[#eaf9f0] p-4 text-sm text-[#137452]"
          >
            Order saved successfully as{" "}
            <strong>{orderRef}</strong>.
          </div>
        )}

        {/* Sample data */}

        <button
          type="button"
          onClick={loadSamples}
          disabled={submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#b6d8f6] bg-[#eff7ff] px-4 py-3 text-sm font-semibold text-[#217fc7] disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Load sample data
        </button>

        {/* Items section */}

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
                onRemove={() =>
                  removeItem(index)
                }
              />
            ))}

            {items.length === 0 && (
              <Card className="p-5 text-center text-sm text-[#71849a]">
                No items added.
              </Card>
            )}
          </div>
        </section>

        {/* Carton catalogue */}

        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7187a0]">
                Available carton types
              </p>

              <p className="mt-1 text-xs text-[#70839c]">
                Select cartons for this order or
                create a reusable custom carton.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadBoxes()}
              disabled={loadingBoxes || submitting || deletingBox !== null}
              className="flex items-center gap-2 rounded-xl border border-[#d8e5f1] bg-white px-4 py-2 text-xs font-semibold text-[#217fc7] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loadingBoxes
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>
          </div>

          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#172f50]">
                {boxes.length} active carton{" "}
                {boxes.length === 1
                  ? "type"
                  : "types"}
              </p>

              <p className="text-xs text-[#71849a]">
                {selectedBoxRefs.length} selected
              </p>
            </div>

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
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                
                {boxes.map((box) => {
                  const selected = selectedBoxRefs.includes(
                    box.Reference
                  );

                  
                  const systemCartons = ["SML", "MED", "LRG"];

                  const isCustom = !systemCartons.includes(
                    box.Reference.toUpperCase()
                  );


                  return (
                    <div
                      key={box.Reference}
                      className={`rounded-xl border p-4 transition-colors ${
                        selected
                          ? "border-[#8cb8ed] bg-[#eff7ff]"
                          : "border-[#dce6ef] bg-[#f8fbff]"
                      }`}
                    >
                      <label className="flex cursor-pointer flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <BoxIcon className="h-4 w-4 shrink-0 text-[#2686d5]" />

                            <span className="truncate text-sm font-bold text-[#172f50]">
                              {box.Reference}
                            </span>
                          </div>

                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              toggleBox(box.Reference)
                            }
                            disabled={submitting || deletingBox !== null}
                            aria-label={`Select ${box.Reference}`}
                            className="h-5 w-5 shrink-0 accent-[#2686d5]"
                          />
                        </div>

                        <p className="text-xs text-[#71849a]">
                          {box.Width} × {box.Length} ×{" "}
                          {box.Depth} mm
                        </p>

                        <p className="text-xs text-[#71849a]">
                          Max weight:{" "}
                          {box.MaxWeight != null
                            ? `${box.MaxWeight} kg`
                            : "Unspecified"}
                        </p>
                      </label>

                      {isSupervisor && isCustom && (
                        <div className="mt-4 border-t border-[#dce6ef] pt-3">
                          <button
                            type="button"
                            onClick={() =>
                              void deleteCustomBox(box.Reference)
                            }
                            disabled={deletingBox !== null || submitting}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#f0c8c4] bg-white px-3 py-2 text-xs font-semibold text-[#b64641] transition-colors hover:bg-[#fff1ef] disabled:opacity-50"
                            aria-label={`Delete ${box.Reference}`}
                          >
                            {deletingBox === box.Reference ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}

                            {deletingBox === box.Reference
                              ? "Deleting..."
                              : "Delete custom box"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            )}

            <p className="mt-4 text-xs text-[#71849a]">
              Only selected cartons will be
              available to FitSolver for
              this order.
            </p>

            {/* Supervisor-only catalogue management */}

            {isSupervisor && (
              <button
                type="button"
                onClick={() =>
                  setShowCustomBoxForm(
                    (current) => !current
                  )
                }
                disabled={submitting || deletingBox !== null}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#9ec8ec] bg-[#eff7ff] px-4 py-3 text-sm font-semibold text-[#217fc7] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Create custom box
              </button>
            )}
          </Card>
          
          {deleteError && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-[#f0c8c4] bg-[#fff1ef] p-4 text-sm text-[#b64641]"
            >
              {deleteError}
            </div>
          )}


          {isSupervisor && showCustomBoxForm && (
            <CustomBoxForm
              onCreated={handleCustomBoxCreated}
              onCancel={() =>
                setShowCustomBoxForm(false)
              }
            />
          )}
        </section>

        {/* Submit order */}

        <button
          type="button"
          onClick={() => void submit()}
          
          disabled={
            submitting ||
            deletingBox !== null ||
            loadingBoxes ||
            boxes.length === 0 ||
            selectedBoxRefs.length === 0 ||
            Boolean(boxError)
          }

          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2686d5] px-5 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}

          {submitting
            ? "Submitting..."
            : "Submit Order"}
        </button>
      </main>
    </AppShell>
  );
}

export default NewOrderPage;
