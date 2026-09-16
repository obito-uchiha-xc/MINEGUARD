/**
 * SIH 2026 Integrated Mine Safety Monitoring System
 * Timestamp & Date Utilities
 *
 * Handles UTC ISO-8601 timestamps emitted by backend FastAPI endpoints.
 * Guarantees consistent parsing without unintended timezone shifts.
 */

/**
 * Parses an ISO-8601 UTC timestamp string from the backend into a Date object.
 */
export function parseUtcTimestamp(isoString?: string | null): Date | null {
  if (!isoString) return null;
  const parsed = new Date(isoString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats an ISO-8601 UTC timestamp for standard human-readable display.
 * Format: YYYY-MM-DD HH:mm:ss UTC
 */
export function formatUtcDisplay(isoString?: string | null): string {
  const date = parseUtcTimestamp(isoString);
  if (!date) return '—';

  return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

/**
 * Formats an ISO-8601 UTC timestamp to 12-hour or 24-hour time (e.g., "10:24 AM").
 */
export function formatUtcTime(isoString?: string | null): string {
  const date = parseUtcTimestamp(isoString);
  if (!date) return '';

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

/**
 * Formats a timestamp into relative time ("just now", "2m ago", "1h ago").
 */
export function formatRelativeTime(isoString?: string | null): string {
  const date = parseUtcTimestamp(isoString);
  if (!date) return '—';

  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  if (diffSec < 0 || diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/**
 * Converts a Date object or current time to an ISO-8601 UTC string for backend queries.
 */
export function toIsoUtcString(date: Date = new Date()): string {
  return date.toISOString();
}
