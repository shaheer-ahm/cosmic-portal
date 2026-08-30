import { Trash2 } from "lucide-react";
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
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#707793]">
            Item {index + 1}
          </p>

          <h3 className="mt-1 text-sm font-semibold text-white">
            {item.ItemReference || "New item"}
          </h3>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="grid h-9 w-9 place-items-center rounded-xl text-[#777d8c] hover:bg-red-400/10 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
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

        <div className="grid grid-cols-3 gap-3">
          <Field
            label="Width"
            type="number"
            min="0"
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
            min="0"
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
            min="0"
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

        <div className="grid grid-cols-2 gap-3">
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
            label="Box group"
            value={item.BoxGroup ?? ""}
            onChange={(event) =>
              onChange({
                ...item,
                BoxGroup:
                  event.target.value || undefined,
              })
            }
            placeholder="GROUP-A"
          />
        </div>
      </div>
    </Card>
  );
}