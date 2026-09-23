/**
 * BPSCVS Unified Date Formatting Utility
 * Ensures 100% consistent date representations across all cards, modals, tables, and broadcasts.
 * Eliminates raw numeric month strings like "-10-" in favor of clean festival names ("10 Oct 2026").
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Formats any date string (ISO "2026-10-15", full string "2026-10-15T12:00:00Z",
 * or existing formatted "10 Oct 2024") into a uniform "15 Oct 2026" display string.
 */
export function formatFestiveDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();

    // Already in "DD Mon YYYY" format? (e.g. "10 Oct 2024" or "1 Nov 2024")
    const alreadyFormattedMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
    if (alreadyFormattedMatch) {
      const day = parseInt(alreadyFormattedMatch[1], 10);
      const rawMonth = alreadyFormattedMatch[2].toLowerCase();
      const year = alreadyFormattedMatch[3];
      const foundIdx = MONTH_NAMES.findIndex(m => rawMonth.startsWith(m.toLowerCase()));
      if (foundIdx !== -1) {
        return `${day} ${MONTH_NAMES[foundIdx]} ${year}`;
      }
      return `${day} ${alreadyFormattedMatch[2]} ${year}`;
    }

    // YYYY-MM-DD pattern from HTML date inputs (e.g. "2026-10-15")
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const monthIdx = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
      }
    }

    // DD-MM-YYYY pattern (e.g. "15-10-2026")
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const monthIdx = parseInt(dmyMatch[2], 10) - 1;
      const year = dmyMatch[3];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
      }
    }
  }

  // Fallback to JS Date parsing
  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) {
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }

  return String(dateInput);
}

/**
 * Formats a date into a full long readable format, e.g. "15 October 2026"
 */
export function formatFullFestiveDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) {
    return `${d.getDate()} ${MONTH_FULL_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }
  return formatFestiveDate(dateInput);
}

/**
 * Normalizes any date into ISO "YYYY-MM-DD" format suitable for HTML <input type="date">
 */
export function toIsoDateInput(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const dmy = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
    if (dmy) {
      const day = String(parseInt(dmy[1], 10)).padStart(2, '0');
      const rawMonth = dmy[2].toLowerCase();
      const monthIdx = MONTH_NAMES.findIndex(m => rawMonth.startsWith(m.toLowerCase()));
      if (monthIdx !== -1) {
        const month = String(monthIdx + 1).padStart(2, '0');
        return `${dmy[3]}-${month}-${day}`;
      }
    }
  }

  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
}
