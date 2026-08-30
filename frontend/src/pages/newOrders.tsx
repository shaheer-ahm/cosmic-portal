import { Box as BoxIcon, Plus, Send, Sparkles } from "lucide-react";
import { useState } from "react";

import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { BoxEditor } from "../components/orders/BoxEditor";
import { ItemEditor } from "../components/orders/ItemEditor";
import { Card } from "../components/ui/Card";

import type { BoxType, PackerItem } from "../types/domain";

const blankItem = (): PackerItem => ({
  ItemCode: "",
  ItemReference: "",
  Width: 0,
  Length: 0,
  Depth: 0,
  Weight: 0,
  BoxGroup: "",
});

const blankBox = (): BoxType => ({
  Reference: "",
  Width: 0,
  Length: 0,
  Depth: 0,
  MaxWeight: undefined,
  BoxWeight: undefined,
  Active: true,
  MaximumBoxes: undefined,
});

const newOrderReference = () =>
  `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

const sampleItems: PackerItem[] = [
  {
    ItemCode: "ITM-001",
    ItemReference: "Widget A",
    Width: 100,
    Length: 200,
    Depth: 50,
    Weight: 1,
    BoxGroup: "GROUP-A",
  },
  {
    ItemCode: "ITM-002",
    ItemReference: "Widget B",
    Width: 300,
    Length: 150,
    Depth: 75,
    Weight: 2.8,
  },
  {
    ItemCode: "ITM-003",
    ItemReference: "Fragile Glassware",
    Width: 80,
    Length: 80,
    Depth: 120,
    Weight: 0.82,
    BoxGroup: "GROUP-B",
  },
];

const sampleBoxes: BoxType[] = [
  {
    Reference: "SML",
    Width: 150,
    Length: 150,
    Depth: 150,
    MaxWeight: 8.5,
    BoxWeight: 0.5,
    Active: true,
    MaximumBoxes: 100,
  },
  {
    Reference: "MED",
    Width: 400,
    Length: 400,
    Depth: 400,
    MaxWeight: 15.2,
    BoxWeight: 0.75,
    Active: true,
  },
];

export function NewOrderPage() {
  const [orderRef, setOrderRef] = useState(newOrderReference());

  const [items, setItems] = useState<PackerItem[]>([
    blankItem(),
  ]);

  const [boxes, setBoxes] = useState<BoxType[]>([
    blankBox(),
  ]);

  const [issues, setIssues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const loadSamples = () => {
    setItems(
      sampleItems.map((item) => ({
        ...item,
      })),
    );

    setBoxes(
      sampleBoxes.map((box) => ({
        ...box,
      })),
    );

    setIssues([]);
    setSubmitted(false);
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      blankItem(),
    ]);

    setSubmitted(false);
  };

  const updateItem = (
    index: number,
    updatedItem: PackerItem,
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? updatedItem : item,
      ),
    );

    setSubmitted(false);
  };

  const removeItem = (index: number) => {
    setItems((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    );

    setSubmitted(false);
  };

  const addBox = () => {
    setBoxes((current) => [
      ...current,
      blankBox(),
    ]);

    setSubmitted(false);
  };

  const updateBox = (
    index: number,
    updatedBox: BoxType,
  ) => {
    setBoxes((current) =>
      current.map((box, boxIndex) =>
        boxIndex === index ? updatedBox : box,
      ),
    );

    setSubmitted(false);
  };

  const removeBox = (index: number) => {
    setBoxes((current) =>
      current.filter(
        (_, boxIndex) => boxIndex !== index,
      ),
    );

    setSubmitted(false);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!orderRef.trim()) {
      errors.push(
        "Order reference is required.",
      );
    }

    if (items.length === 0) {
      errors.push(
        "At least one item is required.",
      );
    }

    items.forEach((item, index) => {
      const number = index + 1;

      if (!item.ItemCode.trim()) {
        errors.push(
          `Item ${number}: Item code is required.`,
        );
      }

      if (!item.ItemReference.trim()) {
        errors.push(
          `Item ${number}: Item reference is required.`,
        );
      }

      if (item.Width <= 0) {
        errors.push(
          `Item ${number}: Width must be greater than 0.`,
        );
      }

      if (item.Length <= 0) {
        errors.push(
          `Item ${number}: Length must be greater than 0.`,
        );
      }

      if (item.Depth <= 0) {
        errors.push(
          `Item ${number}: Depth must be greater than 0.`,
        );
      }

      if (item.Weight < 0) {
        errors.push(
          `Item ${number}: Weight cannot be negative.`,
        );
      }
    });

    const itemCodes = items
      .map((item) =>
        item.ItemCode.trim().toUpperCase(),
      )
      .filter(Boolean);

    if (
      new Set(itemCodes).size !==
      itemCodes.length
    ) {
      errors.push(
        "Item codes must be unique.",
      );
    }

    if (boxes.length === 0) {
      errors.push(
        "At least one box type is required.",
      );
    }

    boxes.forEach((box, index) => {
      const number = index + 1;

      if (!box.Reference.trim()) {
        errors.push(
          `Box ${number}: Reference is required.`,
        );
      }

      if (box.Width <= 0) {
        errors.push(
          `Box ${number}: Width must be greater than 0.`,
        );
      }

      if (box.Length <= 0) {
        errors.push(
          `Box ${number}: Length must be greater than 0.`,
        );
      }

      if (box.Depth <= 0) {
        errors.push(
          `Box ${number}: Depth must be greater than 0.`,
        );
      }

      if (
        box.MaxWeight !== undefined &&
        box.MaxWeight <= 0
      ) {
        errors.push(
          `Box ${number}: Maximum weight must be greater than 0.`,
        );
      }

      if (
        box.BoxWeight !== undefined &&
        box.BoxWeight < 0
      ) {
        errors.push(
          `Box ${number}: Box weight cannot be negative.`,
        );
      }

      if (
        box.MaximumBoxes !== undefined &&
        box.MaximumBoxes < 1
      ) {
        errors.push(
          `Box ${number}: Maximum boxes must be at least 1.`,
        );
      }
    });

    const boxReferences = boxes
      .map((box) =>
        box.Reference.trim().toUpperCase(),
      )
      .filter(Boolean);

    if (
      new Set(boxReferences).size !==
      boxReferences.length
    ) {
      errors.push(
        "Box references must be unique.",
      );
    }

    if (
      boxes.length > 0 &&
      !boxes.some(
        (box) => box.Active !== false,
      )
    ) {
      errors.push(
        "At least one box type must be active.",
      );
    }

    return errors;
  };

  const submit = () => {
    const validationErrors =
      validateForm();

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

    const order = {
      orderRef: orderRef
        .trim()
        .toUpperCase(),
      items,
      boxes,
    };

    // Temporary frontend-only behaviour.
    // Your teammate can replace this with the API call later.
    console.log(
      "New order ready for API:",
      order,
    );

    setSubmitted(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AppShell>
      <PageHeader title="New Order" />

      <main className="px-5 py-5">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#303654] text-[#7180ff]">
              <BoxIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="orderRef"
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#747b98]"
              >
                Order reference
              </label>

              <input
                id="orderRef"
                value={orderRef}
                onChange={(event) => {
                  setOrderRef(
                    event.target.value,
                  );
                  setSubmitted(false);
                }}
                className="mt-1 w-full bg-transparent text-xl font-bold text-white outline-none"
              />
            </div>
          </div>
        </Card>

        {issues.length > 0 && (
          <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">
            <p className="font-semibold">
              Fix these fields before
              submitting:
            </p>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              {issues.map(
                (issue, index) => (
                  <li
                    key={`${issue}-${index}`}
                  >
                    {issue}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        {submitted && (
          <div className="mt-4 rounded-2xl border border-green-400/25 bg-green-400/10 p-4 text-sm text-green-300">
            Order details are valid and
            ready to be sent to the API.
          </div>
        )}

        <button
          type="button"
          onClick={loadSamples}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#4a50a0] bg-[#2d3152] px-4 py-3 text-sm font-semibold text-[#98a0ff]"
        >
          <Sparkles className="h-4 w-4" />

          Load sample data
        </button>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#777d98]">
                Items
              </p>

              <p className="mt-1 text-xs text-[#666c80]">
                Add the items that need
                to be packed.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              aria-label="Add item"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#272b38] text-[#7b86ff]"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {items.map(
              (item, index) => (
                <ItemEditor
                  key={index}
                  item={item}
                  index={index}
                  onChange={(
                    updatedItem,
                  ) =>
                    updateItem(
                      index,
                      updatedItem,
                    )
                  }
                  onRemove={() =>
                    removeItem(index)
                  }
                />
              ),
            )}

            {items.length === 0 && (
              <Card className="p-5 text-center text-sm text-[#747b8d]">
                No items added.
              </Card>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#777d98]">
                Available box types
              </p>

              <p className="mt-1 text-xs text-[#666c80]">
                Define which cartons may
                be used for this order.
              </p>
            </div>

            <button
              type="button"
              onClick={addBox}
              aria-label="Add box type"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#272b38] text-[#7b86ff]"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {boxes.map(
              (box, index) => (
                <BoxEditor
                  key={index}
                  box={box}
                  index={index}
                  onChange={(
                    updatedBox,
                  ) =>
                    updateBox(
                      index,
                      updatedBox,
                    )
                  }
                  onRemove={() =>
                    removeBox(index)
                  }
                />
              ),
            )}

            {boxes.length === 0 && (
              <Card className="p-5 text-center text-sm text-[#747b8d]">
                No box types added.
              </Card>
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={submit}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6675ff] px-5 py-4 text-sm font-bold text-white"
        >
          <Send className="h-4 w-4" />

          Submit Order
        </button>
      </main>
    </AppShell>
  );
}

export default NewOrderPage;