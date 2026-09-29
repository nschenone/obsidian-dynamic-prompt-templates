import { formatReferenceDate } from "./date";

export const MAX_DAYS = 365;

export function validateDays(value: unknown): number | null {
  const days = typeof value === "number" ? value : Number(value);
  return Number.isInteger(days) && days >= 1 && days <= MAX_DAYS ? days : null;
}

export function lastDays(value: unknown, referenceDate: Date): string[] {
  const count = validateDays(value);
  if (count === null) throw new Error(`last_days requires a positive integer no greater than ${MAX_DAYS}.`);
  return Array.from({ length: count }, (_unused, index) => {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - (count - index - 1));
    return formatReferenceDate(date);
  });
}

/** Redact full lines by a case-insensitive trimmed prefix; never return input after a failure. */
export function redactLines(value: unknown, prefix: unknown): string {
  try {
    if (typeof value !== "string" || typeof prefix !== "string" || !prefix.trim()) return "";
    const normalizedPrefix = prefix.trim().toLocaleLowerCase();
    return value.split("\n").filter((line) => !line.trim().toLocaleLowerCase().startsWith(normalizedPrefix)).join("\n");
  } catch { return ""; }
}
