const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseReferenceDate(referenceDate?: string): Date {
  if (!referenceDate) {
    return new Date();
  }

  const dateOnly = DATE_ONLY_PATTERN.exec(referenceDate);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    const parsed = new Date(year, month, day);

    if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) {
      throw new Error(`Invalid reference date: ${referenceDate}`);
    }

    return parsed;
  }

  const parsed = new Date(referenceDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid reference date: ${referenceDate}`);
  }

  return parsed;
}

export function formatReferenceDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
