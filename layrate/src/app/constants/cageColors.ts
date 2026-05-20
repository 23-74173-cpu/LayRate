/**
 * Canonical cage accent colors — single source of truth for the entire system.
 * Import from this file wherever cage colors are needed.
 */
export const CAGE_COLORS: Record<string, string> = {
  'CAGE-A': '#2F7D4A', // Leaf green
  'CAGE-B': '#C27A2C', // Warm amber
  'CAGE-C': '#8B5FBF', // Muted violet
  'CAGE-D': '#2F8C9D', // Teal
};

/** Convenience helper — returns the accent color for a cage, with a neutral fallback. */
export function cageColor(cageId: string): string {
  return CAGE_COLORS[cageId] ?? '#6B7280';
}
