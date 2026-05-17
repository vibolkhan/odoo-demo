/**
 * Utility for domain-specific formatting
 */

/**
 * Splits an Odoo leave type label into English and Khmer parts.
 * Expected format: "English Name - Khmer Name" or just "English Name"
 */
export function splitLeaveLabel(label) {
  if (!label) return { english: '', khmer: '' };
  
  const parts = label.split('-');
  return {
    english: parts[0] || '',
    khmer: parts[1] || ''
  };
}

/**
 * Returns only the English part of a leave type label
 */
export function getLeaveTypeEnglishName(label) {
  return splitLeaveLabel(label).english;
}

/**
 * Returns only the Khmer part of a leave type label
 */
export function getLeaveTypeKhmerName(label) {
  return splitLeaveLabel(label).khmer;
}
