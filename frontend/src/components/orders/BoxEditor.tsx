import { Trash2 } from "lucide-react";
import type { BoxType } from "../../types/domain";
import { Card } from "../ui/Card";
import { Field } from "./Field";

const requiredNumber = (value: string) =>
  value === "" ? 0 : Number(value);

const optionalNumber = (value: string) =>
  value === "" ? undefined : Number(value);

type BoxEditorProps = {
  box: BoxType;
  index: number;
  onChange: (box: BoxType) => void;
  onRemove: () => void;
};

export function BoxEditor({
  box,
  index,
  onChange,
  onRemove,
}: BoxEditorProps) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#707793]">
            Box type {index + 1}
          </p>

          <h3 className="mt-1 text-sm font-semibold text-white">
            {box.Reference || "New box"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-[#8c91a3]">
            <input
              type="checkbox"
              checked={box.Active !== false}
              onChange={(event) =>
                onChange({
                  ...box,
                  Active: event.target.checked,
                })
              }
            />
            Active
          </label>

          <button
            type="button"
            onClick={onRemove}
            className="grid h-9 w-9 place-items-center rounded-xl text-[#777d8c] hover:bg-red-400/10 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        <Field
          label="Reference"
          value={box.Reference}
          onChange={(event) =>
            onChange({
              ...box,
              Reference: event.target.value,
            })
          }
          placeholder="MED"
        />

        <div className="grid grid-cols-3 gap-3">
          <Field
            label="Width"
            type="number"
            min="0"
            value={box.Width || ""}
            onChange={(event) =>
              onChange({
                ...box,
                Width: requiredNumber(event.target.value),
              })
            }
            suffix="mm"
          />

          <Field
            label="Length"
            type="number"
            min="0"
            value={box.Length || ""}
            onChange={(event) =>
              onChange({
                ...box,
                Length: requiredNumber(event.target.value),
              })
            }
            suffix="mm"
          />

          <Field
            label="Depth"
            type="number"
            min="0"
            value={box.Depth || ""}
            onChange={(event) =>
              onChange({
                ...box,
                Depth: requiredNumber(event.target.value),
              })
            }
            suffix="mm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Max weight"
            type="number"
            step="0.01"
            min="0"
            value={box.MaxWeight ?? ""}
            onChange={(event) =>
              onChange({
                ...box,
                MaxWeight: optionalNumber(event.target.value),
              })
            }
            suffix="kg"
          />

          <Field
            label="Box weight"
            type="number"
            step="0.01"
            min="0"
            value={box.BoxWeight ?? ""}
            onChange={(event) =>
              onChange({
                ...box,
                BoxWeight: optionalNumber(event.target.value),
              })
            }
            suffix="kg"
          />
        </div>

        <Field
          label="Maximum boxes"
          type="number"
          min="1"
          value={box.MaximumBoxes ?? ""}
          onChange={(event) =>
            onChange({
              ...box,
              MaximumBoxes: optionalNumber(
                event.target.value
              ),
            })
          }
        />
      </div>
    </Card>
  );
}