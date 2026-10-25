import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { FileJson, Upload, X } from "lucide-react";
import type { PackerItem } from "../../types/domain";

type Props = {
  onItemsImported: (items: PackerItem[]) => void;
  disabled?: boolean;
};

function parseItems(text: string): PackerItem[] {
  const parsed: unknown = JSON.parse(text);

  let rawList: unknown[] = [];

  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    "items" in parsed &&
    Array.isArray((parsed as Record<string, unknown>).items)
  ) {
    rawList = (parsed as Record<string, unknown>).items as unknown[];
  } else if (
    parsed &&
    typeof parsed === "object" &&
    "Items" in parsed &&
    Array.isArray((parsed as Record<string, unknown>).Items)
  ) {
    rawList = (parsed as Record<string, unknown>).Items as unknown[];
  } else {
    throw new Error(
      "The JSON must be an array of items or contain an 'items' array."
    );
  }
  if (rawList.length === 0) {
      throw new Error("The JSON must be a non-empty array of items.");
  }

  const seen = new Set<string>();


  return rawList.map(
    (entry: unknown, index: number): PackerItem => {
      if (
        !entry ||
        typeof entry !== "object" ||
        Array.isArray(entry)
      ) {
        throw new Error(
          `Item ${index + 1} must be an object.`
        );
      }

      const obj = entry as Record<string, unknown>;

      const code =
        typeof obj.ItemCode === "string"
          ? obj.ItemCode.trim()
          : "";

      const reference =
        typeof obj.ItemReference === "string"
          ? obj.ItemReference.trim()
          : code;

      if (!code || !reference) {
        throw new Error(
          `Item ${index + 1} needs an ItemCode and ItemReference.`
        );
      }

      if (seen.has(code.toUpperCase())) {
        throw new Error(
          `Duplicate ItemCode: ${code}`
        );
      }

      seen.add(code.toUpperCase());

      const positiveInteger = (key: string) => {
        const value = Number(obj[key]);

        if (
          obj[key] == null ||
          !Number.isInteger(value) ||
          value <= 0
        ) {
          throw new Error(
            `Item ${index + 1}: ${key} must be a positive whole number.`
          );
        }

        return value;
      };

      const weight = Number(obj.Weight);

      if (
        obj.Weight == null ||
        !Number.isFinite(weight) ||
        weight <= 0
      ) {
        throw new Error(
          `Item ${index + 1}: Weight must be greater than zero.`
        );
      }

      if (
        obj.Fragile != null &&
        typeof obj.Fragile !== "boolean"
      ) {
        throw new Error(
          `Item ${index + 1}: Fragile must be true or false.`
        );
      }

      return {
        ItemCode: code,
        ItemReference: reference,
        Width: positiveInteger("Width"),
        Length: positiveInteger("Length"),
        Depth: positiveInteger("Depth"),
        Weight: weight,
        Quantity:
          obj.Quantity == null
            ? 1
            : positiveInteger("Quantity"),
        BoxGroup:
          typeof obj.BoxGroup === "string"
            ? obj.BoxGroup.trim()
            : "",
        Fragile: obj.Fragile === true,
      };
    }
  );
}

export function JsonItemImporter({
  onItemsImported,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const fileInput = useRef<HTMLInputElement>(null);

  const chooseFile = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    try {
      if (!file.name.toLowerCase().endsWith(".json")) {
        throw new Error("Select a .json file.");
      }

      if (file.size > 1024 * 1024) {
        throw new Error(
          "JSON files must be 1 MB or smaller."
        );
      }

      setText(await file.text());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to read file."
      );
    } finally {
      event.target.value = "";
    }
  };

  const importItems = () => {
    try {
      setError("");

      const parsed = parseItems(text);

      onItemsImported(parsed);

      setText("");
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid JSON."
      );
    }
  };

  return (
    <>
      {/* Import JSON button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#b6d8f6] bg-[#eff7ff] px-3 text-xs font-semibold text-[#217fc7] transition-colors hover:bg-[#e1f0fc] disabled:opacity-50"
      >
        <FileJson className="h-4 w-4" />
        Import JSON
      </button>

      {/* Import dialog */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-json-heading"
            className="w-full max-w-lg rounded-2xl border border-[#dce6ef] bg-white p-5 shadow-2xl"
          >
            {/* Dialog header */}
            <div className="flex items-center justify-between gap-3">
              <h2
                id="import-json-heading"
                className="text-lg font-bold text-[#172f50]"
              >
                Import order items
              </h2>

              <button
                type="button"
                aria-label="Close importer"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-[#71849a] hover:bg-[#f1f7fc]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-[#70839c]">
              Choose a JSON file or paste an array of
              items. Importing replaces the current item
              entries; nothing is sent to the backend
              until you submit the order.
            </p>

            {/* File input */}
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) =>
                void chooseFile(event)
              }
            />

            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#b6d8f6] bg-[#eff7ff] px-4 py-2 text-sm font-semibold text-[#217fc7] hover:bg-[#e1f0fc]"
            >
              <Upload className="h-4 w-4" />
              Choose JSON file
            </button>

            {/* JSON text area */}
            <textarea
              aria-label="Paste JSON items"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setError("");
              }}
              rows={10}
              placeholder={`[
  {
    "ItemCode": "ITM-001",
    "ItemReference": "Widget A",
    "Width": 100,
    "Length": 200,
    "Depth": 50,
    "Weight": 1,
    "Quantity": 3,
    "Fragile": false
  }
]`}
              className="mt-3 w-full rounded-xl border border-[#dce6ef] bg-[#f8fbff] p-3 font-mono text-xs text-[#172f50] focus:border-[#2686d5] focus:outline-none"
            />

            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="mt-2 text-xs font-semibold text-[#b64641]"
              >
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm text-[#71849a] hover:bg-[#f4f7fb]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={importItems}
                className="rounded-xl bg-[#2686d5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f77be]"
              >
                Import items
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}