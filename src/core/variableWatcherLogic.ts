export type WatchedBadgeColor = 'mint' | 'indigo' | 'amber' | 'purple' | 'slate';

export interface WatchedVariable {
  name: string;
  currentValue: string | number;
  previousValue?: string | number;
  hasChanged: boolean;
  badgeColor: WatchedBadgeColor;
  inferredType: 'number' | 'string' | 'boolean' | 'node' | 'other';
}

/**
 * Infer a friendly type label for displaying in the watch table.
 */
export function inferVariableType(val: string | number): 'number' | 'string' | 'boolean' | 'node' | 'other' {
  if (typeof val === 'number') return 'number';
  const str = String(val).toLowerCase();
  if (str === 'true' || str === 'false') return 'boolean';
  if (str.includes('node(') || str === 'null') return 'node';
  if (/^-?\d+(\.\d+)?$/.test(str)) return 'number';
  return 'string';
}

/**
 * Assign a cohesive semantic badge color based on variable name and state.
 */
export function getVariableBadgeColor(
  name: string,
  hasChanged: boolean
): WatchedBadgeColor {
  if (hasChanged) return 'amber';
  const lower = name.toLowerCase();
  if (lower === 'pivot' || lower.includes('max') || lower === 'val') return 'mint';
  if (lower === 'i' || lower === 'j' || lower === 'curr' || lower === 'prev') return 'indigo';
  if (lower.includes('head') || lower.includes('root')) return 'purple';
  return 'slate';
}

/**
 * Compares current step variables with previous step variables and returns
 * enriched watch records with change flags and previous values.
 */
export function computeVariableWatchList(
  currentVariables: Record<string, string | number> = {},
  previousVariables: Record<string, string | number> = {}
): WatchedVariable[] {
  const keys = Object.keys(currentVariables);

  // Group: pointers / iterators first (i, j, curr, prev), then named values, then complex expressions
  const sortedKeys = [...keys].sort((a, b) => {
    const isSpecialA = ['i', 'j', 'pivot', 'curr', 'prev', 'next'].includes(a);
    const isSpecialB = ['i', 'j', 'pivot', 'curr', 'prev', 'next'].includes(b);
    if (isSpecialA && !isSpecialB) return -1;
    if (!isSpecialA && isSpecialB) return 1;
    return a.localeCompare(b);
  });

  return sortedKeys.map((name) => {
    const curVal = currentVariables[name];
    const prevVal = previousVariables[name];
    const hasChanged = prevVal !== undefined && String(prevVal) !== String(curVal);

    return {
      name,
      currentValue: curVal,
      previousValue: prevVal,
      hasChanged,
      badgeColor: getVariableBadgeColor(name, hasChanged),
      inferredType: inferVariableType(curVal),
    };
  });
}
