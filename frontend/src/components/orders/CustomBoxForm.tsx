
import { useState } from "react";
import { PackagePlus, X } from "lucide-react";

import type { BoxType } from "../../types/domain";
import { apiFetch } from "../../lib/api";
import { Card } from "../ui/Card";

type Props = {
  onCreated: (box: BoxType) => void;
  onCancel: () => void;
};

type FormState = {
  Reference: string;
  Width: string;
  Length: string;
  Depth: string;
  MaxWeight: string;
  BoxWeight: string;
  MaximumBoxes: string;
};

const initialForm: FormState = {
  Reference: "",
  Width: "",
  Length: "",
  Depth: "",
  MaxWeight: "",
  BoxWeight: "",
  MaximumBoxes: "",
};

export function CustomBoxForm({
  onCreated,
  onCancel,
}: Props) {
  const [form, setForm] = useState<FormState>(
    initialForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setError("");
  };

  const save = async () => {
    if (saving) return;

    const reference = form.Reference.trim().toUpperCase();

    // Preserve existing reference validation.
    if (!reference) {
      setError("A box reference is required.");
      return;
    }

    if (!reference.startsWith("CUSTOM-")) {
      setError(
        "Custom box references must start with CUSTOM-. " +
          "For example: CUSTOM-001."
      );
      return;
    }

    // Required dimensions: 1–2000 mm.
    const dimensionFields = [
      { name: "Width", value: form.Width },
      { name: "Length", value: form.Length },
      { name: "Depth", value: form.Depth },
    ];

    for (const field of dimensionFields) {
      const number = Number(field.value);

      if (
        !field.value.trim() ||
        !Number.isFinite(number) ||
        number < 1 ||
        number > 2000
      ) {
        setError(
          `${field.name} must be between 1 and 2000 mm.`
        );
        return;
      }
    }

    const dimensions = dimensionFields.map((field) =>
      Number(field.value)
    );

    // Optional fields remain null when blank.
    const optionalNumber = (
      value: string
    ): number | null => {
      return value.trim() === ""
        ? null
        : Number(value);
    };

    const maxWeightVal = optionalNumber(form.MaxWeight);
    const boxWeightVal = optionalNumber(form.BoxWeight);
    const maxBoxesVal = optionalNumber(form.MaximumBoxes);

    // Optional maximum weight: 0.1–100 kg.
    if (
      maxWeightVal !== null &&
      (!Number.isFinite(maxWeightVal) ||
        maxWeightVal < 0.1 ||
        maxWeightVal > 100)
    ) {
      setError(
        "Maximum weight must be between 0.1 and 100 kg."
      );
      return;
    }

    // Optional box weight: 0–30 kg.
    if (
      boxWeightVal !== null &&
      (!Number.isFinite(boxWeightVal) ||
        boxWeightVal < 0 ||
        boxWeightVal > 30)
    ) {
      setError(
        "Box weight must be between 0 and 30 kg."
      );
      return;
    }

    // Optional carton quantity: integer 1–1000.
    if (
      maxBoxesVal !== null &&
      (!Number.isInteger(maxBoxesVal) ||
        maxBoxesVal < 1 ||
        maxBoxesVal > 1000)
    ) {
      setError(
        "Maximum boxes must be a whole number from 1 to 1000."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const created = await apiFetch<BoxType>(
        "/box-types/",
        {
          method: "POST",
          body: JSON.stringify({
            Reference: reference,
            Width: dimensions[0],
            Length: dimensions[1],
            Depth: dimensions[2],
            MaxWeight: maxWeightVal,
            BoxWeight: boxWeightVal,
            MaximumBoxes: maxBoxesVal,
          }),
        }
      );

      onCreated(created);
      setForm({ ...initialForm });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save custom box."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4 border border-[#c5dced] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PackagePlus className="h-5 w-5 text-[#2686d5]" />
          <h3 className="text-base font-bold text-[#172f50]">
            Create custom carton
          </h3>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="Close custom carton form"
          className="rounded-lg p-2 text-[#71849a] hover:bg-[#eff5fb]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-4 text-xs text-[#71849a]">
        Save a carton to the shared catalogue for future orders.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Box reference"
          value={form.Reference}
          onChange={(v) => update("Reference", v)}
          placeholder="CUSTOM-001"
          required
        />

        <div className="hidden sm:block" />

        <Input
          label="Width (mm)"
          value={form.Width}
          onChange={(v) => update("Width", v)}
          numeric
          min={1}
          max={2000}
          placeholder="1–2000"
          required
        />

        <Input
          label="Length (mm)"
          value={form.Length}
          onChange={(v) => update("Length", v)}
          numeric
          min={1}
          max={2000}
          placeholder="1–2000"
          required
        />

        <Input
          label="Depth (mm)"
          value={form.Depth}
          onChange={(v) => update("Depth", v)}
          numeric
          min={1}
          max={2000}
          placeholder="1–2000"
          required
        />

        <Input
          label="Max weight (kg)"
          value={form.MaxWeight}
          onChange={(v) => update("MaxWeight", v)}
          numeric
          min={0.1}
          max={100}
          placeholder="Optional: 0.1–100"
        />

        <Input
          label="Box weight (kg)"
          value={form.BoxWeight}
          onChange={(v) => update("BoxWeight", v)}
          numeric
          min={0}
          max={30}
          placeholder="Optional: 0–30"
        />

        <Input
          label="Maximum boxes"
          value={form.MaximumBoxes}
          onChange={(v) => update("MaximumBoxes", v)}
          numeric
          integer
          min={1}
          max={1000}
          placeholder="Optional: 1–1000"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 text-sm text-[#b64641]"
        >
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-[#d8e5f1] px-5 py-3 text-sm font-semibold text-[#49637e]"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-xl bg-[#2686d5] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save to catalogue"}
        </button>
      </div>
    </Card>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  numeric = false,
  integer = false,
  required = false,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  numeric?: boolean;
  integer?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[#49637e]">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        type={numeric ? "number" : "text"}
        min={numeric ? min : undefined}
        max={numeric ? max : undefined}
        step={numeric ? (integer ? "1" : "any") : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-[#dce5ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#172f50] outline-none focus:border-[#2686d5]"
      />
    </label>
  );
}
