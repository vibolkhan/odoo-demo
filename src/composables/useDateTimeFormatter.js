import { computed } from 'vue';

export function useDateTimeFormatter() {
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = typeof dateStr === 'string' ? new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z')) : dateStr;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = typeof dateStr === 'string' ? new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z')) : dateStr;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDays = (days) => {
    if (days === undefined || days === null) return '0';
    return days % 1 === 0 ? days.toString() : days.toFixed(1);
  };

  return {
    formatTime,
    formatDate,
    formatDays,
  };
}
