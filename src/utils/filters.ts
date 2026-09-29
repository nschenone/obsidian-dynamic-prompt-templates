import { formatReferenceDate } from "./date";

export const MAX_DAYS = 365;

export function lastDays(value: unknown, referenceDate: Date): string[] {
  const count = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(count) || count < 1 || count > MAX_DAYS) throw new Error(`last_days requires a positive integer no greater than ${MAX_DAYS}.`);
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
