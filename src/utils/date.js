/**
 * Utility for date parsing and formatting
 */

/**
 * Parses an API date string (typically Odoo format "YYYY-MM-DD HH:mm:ss")
 * and returns a Date object, ensuring it's treated as UTC.
 */
export function parseApiDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  // Odoo returns dates in UTC without the 'Z' suffix.
  // Appending 'Z' ensures Date constructor treats it as UTC.
  const isoStr = dateStr.endsWith('Z') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
  const date = new Date(isoStr);
  
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date for local display (e.g., "Mon, May 7, 2026")
 */
export function formatDisplayDate(dateStr) {
  const date = parseApiDate(dateStr);
  if (!date) return '';
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a time for local display (e.g., "04:23 PM")
 */
export function formatDisplayTime(dateStr) {
  const date = parseApiDate(dateStr);
  if (!date) return '';
  
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Formats a date and time for local display (e.g., "May 7, 2026, 04:23 PM")
 */
export function formatDisplayDateTime(dateStr) {
  const date = parseApiDate(dateStr);
  if (!date) return '';
  
  return `${formatDisplayDate(dateStr)}, ${formatDisplayTime(dateStr)}`;
}

/**
 * Formats decimal hours into a readable string (e.g., 1.5 -> "1.5")
 */
export function formatHours(hours) {
  if (hours === undefined || hours === null) return '0';
  const val = Number(hours);
  return val % 1 === 0 ? val.toString() : val.toFixed(1);
}

/**
 * Formats decimal days into a readable string
 */
export function formatDays(days) {
  return formatHours(days);
}
