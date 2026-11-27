import type { ChecklistItem, ChecklistTemplate, FieldErrors } from "@/types";

const controlClass = "w-full min-h-[var(--pc-control-min-height)] rounded-pc-control border border-pc-control-border bg-pc-surface px-3 py-2 aria-invalid:border-pc-danger-text";

export function checklistFieldId(itemId: string) {
  return `checklist-${itemId}`;
}

type ChecklistFieldsProps = {
  template: ChecklistTemplate;
  values: Record<string, string>;
  errors: FieldErrors;
  onChange: (itemId: string, value: string) => void;
};

export function ChecklistFields({ template, values, errors, onChange }: ChecklistFieldsProps) {
  return (
    <div className="grid gap-5">
      {template.items.map((item) => (
        <ChecklistField
          key={item.id}
          item={item}
          value={values[item.id] ?? ""}
          error={errors[`answers.${item.id}`]?.[0]}
          onChange={(value) => onChange(item.id, value)}
        />
      ))}
    </div>
  );
}

function ChecklistField({ item, value, error, onChange }: {
  item: ChecklistItem;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = checklistFieldId(item.id);
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const common = {
    id,
    value,
    required: item.required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [item.helpText && helpId, error && errorId].filter(Boolean).join(" ") || undefined,
    className: controlClass,
  };

  return (
    <div className="space-y-1.5">
      <label className="block font-semibold" htmlFor={id}>
        {item.label}
        {item.unit && <> ({item.unit})</>}
        {item.required && <span className="ml-2 text-sm font-normal text-pc-muted">Required</span>}
      </label>
      {item.helpText && <p id={helpId} className="text-sm text-pc-muted">{item.helpText}</p>}
      {item.kind === "number" ? (
        <input
          {...common}
          type="number"
          inputMode="decimal"
          step="any"
          min={item.min}
          max={item.max}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      ) : item.kind === "text" ? (
        <textarea {...common} rows={3} maxLength={2000} onChange={(event) => onChange(event.currentTarget.value)} />
      ) : (
        <select {...common} onChange={(event) => onChange(event.currentTarget.value)}>
          <option value="">{item.kind === "boolean" ? "Choose Yes or No" : "Choose an option"}</option>
          {item.kind === "boolean" ? (
            <>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </>
          ) : item.options?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      )}
      {error && <p id={errorId} className="text-sm text-pc-danger-text">{error}</p>}
    </div>
  );
}
