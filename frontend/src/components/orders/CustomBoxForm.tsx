
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
    const reference = form.Reference.trim().toUpperCase();
    
    if (!reference.startsWith("CUSTOM-")) {
    setError(
        "Custom box references must start with CUSTOM-. " +
        "For example: CUSTOM-001."
    );
    return;
    }


    if (!reference) {
      setError("A box reference is required.");
      return;
    }

    const dimensions = [
      form.Width,
      form.Length,
      form.Depth,
    ].map(Number);

    if (
      [form.Width, form.Length, form.Depth].some(
        (value) => !value.trim()
      ) ||
      dimensions.some(
        (value) => !Number.isFinite(value) || value <= 0
      )
    ) {
      setError("Enter valid positive dimensions.");
      return;
    }

    if (
      form.MaxWeight !== "" &&
      (!Number.isFinite(Number(form.MaxWeight)) ||
        Number(form.MaxWeight) <= 0)
    ) {
      setError("Maximum weight must be positive.");
      return;
    }

    if (
      form.BoxWeight !== "" &&
      (!Number.isFinite(Number(form.BoxWeight)) ||
        Number(form.BoxWeight) < 0)
    ) {
      setError("Box weight cannot be negative.");
      return;
    }

    if (
      form.MaximumBoxes !== "" &&
      (!Number.isInteger(Number(form.MaximumBoxes)) ||
        Number(form.MaximumBoxes) < 1)
    ) {
      setError("Maximum boxes must be a positive whole number.");
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
            MaxWeight: form.MaxWeight
              ? Number(form.MaxWeight)
              : null,
            BoxWeight: form.BoxWeight
              ? Number(form.BoxWeight)
              : null,
            MaximumBoxes: form.MaximumBoxes
              ? Number(form.MaximumBoxes)
              : null,
          }),
        }
      );

      onCreated(created);
      setForm(initialForm);
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
          required
        />

        <Input
          label="Length (mm)"
          value={form.Length}
          onChange={(v) => update("Length", v)}
          numeric
          required
        />

        <Input
          label="Depth (mm)"
          value={form.Depth}
          onChange={(v) => update("Depth", v)}
          numeric
          required
        />

        <Input
          label="Max weight (kg)"
          value={form.MaxWeight}
          onChange={(v) => update("MaxWeight", v)}
          numeric
        />

        <Input
          label="Box weight (kg)"
          value={form.BoxWeight}
          onChange={(v) => update("BoxWeight", v)}
          numeric
        />

        <Input
          label="Maximum boxes"
          value={form.MaximumBoxes}
          onChange={(v) => update("MaximumBoxes", v)}
          numeric
          integer
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[#b64641]">
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  numeric?: boolean;
  integer?: boolean;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[#49637e]">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        type={numeric ? "number" : "text"}
        min={numeric ? (label.startsWith("Box weight") ? "0" : "0.001") : undefined}
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
