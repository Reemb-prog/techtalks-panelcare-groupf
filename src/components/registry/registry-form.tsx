"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import type { ZodType } from "zod";
import type { ApiResult, FieldErrors } from "@/types";
import { inputValues } from "@/features/registry/form-data";
import { FORM_ERROR_KEY, toFieldErrors } from "@/lib/validations/errors";
import styles from "./registry.module.css";

export interface Field {
  name: string;
  label: string;
  type?: string;
  optional?: boolean;
  options?: readonly string[];
}

export function RegistryForm<T, R>({ fields, schema, build, save, onSaved, action, controls }: {
  fields: readonly Field[];
  schema: ZodType<T>;
  build?: (values: Record<string, string>) => unknown;
  save: (input: T) => Promise<ApiResult<R>>;
  onSaved: (record: R) => void;
  action: string;
  controls?: (pending: boolean) => ReactNode;
}) {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const form = event.currentTarget;
    const values = inputValues(new FormData(form), fields.filter((field) => field.optional).map((field) => field.name));
    const parsed = schema.safeParse(build ? build(values) : values);
    setMessage("");
    setErrors({});
    function showErrors(next: FieldErrors) {
      setErrors(next);
      const first = fields.find((field) => next[field.name]);
      if (first) (form.elements.namedItem(first.name) as HTMLElement | null)?.focus();
    }
    if (!parsed.success) {
      const next = toFieldErrors(parsed.error);
      showErrors(next);
      setMessage(next[FORM_ERROR_KEY]?.[0] ?? "Check the highlighted fields.");
      return;
    }
    locked.current = true;
    setPending(true);
    let saved = false;
    try {
      const result = await save(parsed.data);
      if (result.ok) {
        onSaved(result.data);
        saved = true;
      } else {
        setMessage(result.error.message);
        showErrors(result.error.fieldErrors ?? {});
      }
    } catch {
      setMessage("The mock request failed. Your entries are still here. Try again.");
    } finally {
      if (!saved) {
        locked.current = false;
        setPending(false);
      }
    }
  }

  return (
    <form className={styles.panel} onSubmit={submit} noValidate aria-busy={pending}>
      {message && <p className={styles.error} role="alert">{message}</p>}
      <div className={styles.fields}>
        {fields.map(({ name, label, type, options, optional }) => (
          <div key={name}>
            <label htmlFor={name}>{label}{optional ? " (optional)" : ""}</label>
            {options ? (
              <select id={name} name={name} required aria-invalid={!!errors[name]} aria-describedby={errors[name] ? name + "-error" : undefined}>
                <option value="">Choose a type</option>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : (
              <input id={name} name={name} type={type ?? "text"} required={!optional} step={type === "number" ? "0.001" : undefined}
                aria-invalid={!!errors[name]} aria-describedby={errors[name] ? name + "-error" : undefined} />
            )}
            {errors[name] && <p id={name + "-error"} className={styles.fieldError}>{errors[name].join(" ")}</p>}
          </div>
        ))}
      </div>
      {controls?.(pending)}
      <p className={styles.muted}>Mock changes are kept in this workspace until it reloads.</p>
      <button className={styles.primary} disabled={pending}>{pending ? "Saving…" : action}</button>
    </form>
  );
}
