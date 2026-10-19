
import { Trash2, PackageCheck } from "lucide-react";
import type { PackerItem } from "../../types/domain";
import { Card } from "../ui/Card";
import { Field } from "./Field";

const toNumber = (value: string) =>
  value === "" ? 0 : Number(value);

type ItemEditorProps = {
  item: PackerItem;
  index: number;
  onChange: (item: PackerItem) => void;
  onRemove: () => void;
};

export function ItemEditor({
  item,
  index,
  onChange,
  onRemove,
}: ItemEditorProps) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#72879d]">
            Item {index + 1}
          </p>

          <h3 className="mt-1 text-sm font-semibold text-[#172f50]">
            {item.ItemReference || "New item"}
          </h3>
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove item ${index + 1}`}
          className="grid h-9 w-9 place-items-center rounded-xl text-[#71849a] hover:bg-[#fff1ef] hover:text-[#b64641]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Item code"
            value={item.ItemCode}
            onChange={(event) =>
              onChange({
                ...item,
                ItemCode: event.target.value,
              })
            }
            placeholder="ITM-001"
          />

          <Field
            label="Reference"
            value={item.ItemReference}
            onChange={(event) =>
              onChange({
                ...item,
                ItemReference: event.target.value,
              })
            }
            placeholder="Widget A"
          />
        </div>

        <div className="cf-measure-grid">
          <Field
            label="Width"
            type="number"
            min="1"
            step="1"
            value={item.Width || ""}
            onChange={(event) =>
              onChange({
                ...item,
                Width: toNumber(event.target.value),
              })
            }
            suffix="mm"
          />

          <Field
            label="Length"
            type="number"
            min="1"
            step="1"
            value={item.Length || ""}
            onChange={(event) =>
              onChange({
                ...item,
                Length: toNumber(event.target.value),
              })
            }
            suffix="mm"
          />

          <Field
            label="Depth"
            type="number"
            min="1"
            step="1"
            value={item.Depth || ""}
            onChange={(event) =>
              onChange({
                ...item,
                Depth: toNumber(event.target.value),
              })
            }
            suffix="mm"
          />
        </div>

        <div className="cf-measure-grid">
          <Field
            label="Weight"
            type="number"
            step="0.01"
            min="0"
            value={item.Weight || ""}
            onChange={(event) =>
              onChange({
                ...item,
                Weight: toNumber(event.target.value),
              })
            }
            suffix="kg"
          />

          <Field
            label="Quantity"
            type="number"
            step="1"
            min="1"
            value={item.Quantity}
            onChange={(event) =>
              onChange({
                ...item,
                Quantity: toNumber(event.target.value),
              })
            }
          />

          <Field
            label="Box group"
            value={item.BoxGroup ?? ""}
            onChange={(event) =>
              onChange({
                ...item,
                BoxGroup:
                  event.target.value || undefined,
              })
            }
            placeholder="Optional"
          />
        </div>

        <label
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${
            item.Fragile
              ? "border-[#ecc8a0] bg-[#fff8ee]"
              : "border-[#dce6ef] bg-[#f8fbff]"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                item.Fragile
                  ? "bg-[#ffecd3] text-[#ab6b27]"
                  : "bg-[#e7f3ff] text-[#2582ce]"
              }`}
            >
              <PackageCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#172f50]">
                Fragile item
              </p>
              <p className="mt-1 text-xs text-[#71849a]">
                Mark this item as requiring careful handling.
              </p>
            </div>
          </div>

          <input
            type="checkbox"
            checked={item.Fragile ?? false}
            onChange={(event) =>
              onChange({
                ...item,
                Fragile: event.target.checked,
              })
            }
            className="h-5 w-5 shrink-0 cursor-pointer accent-[#2686d5]"
            aria-label={`Fragile item ${index + 1}`}
          />
        </label>
      </div>
    </Card>
  );
}
