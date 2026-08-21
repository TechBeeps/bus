/**
 * Format any date string or ISO timestamp into:
 * "DD-MM-YYYY hh:mm AM/PM" (e.g. 21-08-2026 02:30 PM)
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    // If dateStr is just a date string "2026-08-21"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const [year, month, day] = dateStr.trim().split('-');
      return `${day}-${month}-${year}`;
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr;
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const strHours = String(hours).padStart(2, '0');

    return `${day}-${month}-${year} ${strHours}:${minutes} ${ampm}`;
  } catch (err) {
    return dateStr;
  }
}

/**
 * Format date only: "DD-MM-YYYY"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
        const [year, month, day] = dateStr.trim().split('-');
        return `${day}-${month}-${year}`;
      }
      return dateStr;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (err) {
    return dateStr;
  }
}
