import type { ChecklistAnswerValue } from "@/types";

export function displayAnswer(value: ChecklistAnswerValue | null | undefined, unit?: string | null) {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return unit ? `${value} ${unit}` : String(value);
}
