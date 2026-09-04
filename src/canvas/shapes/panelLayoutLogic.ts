/**
 * Shared panel layout constants and content-adaptive dimension solvers.
 * Ensures compact, balanced, content-driven sizing with consistent padding and min-dimensions
 * across all DSA canvas panels (arr, vars, for).
 */

export const PANEL_CONSTANTS = {
  MIN_WIDTH: 360,
  MIN_HEIGHT: 180,
  PADDING_X: 20, // 20px horizontal padding
  PADDING_Y: 16, // 16px vertical padding
} as const;

/**
 * Calculates adapted dimensions for Array shape (dsa-array).
 * Automatically adapts width based on slots count while keeping min dimensions.
 * Includes generous breathing buffers to completely eliminate clipping on slot rings,
 * hover shadows, pointer badges, and accidental scrollbars.
 */
export function calculateArrayPanelDimensions(
  valuesCount: number,
  currentWidth?: number,
  currentHeight?: number
): { w: number; h: number } {
  // Slots count includes ghost slot [-1] and array slots [0..n-1]
  const count = Math.max(1, valuesCount);
  const totalSlots = count + 1;
  // Slot width = 72px, gap = 12px -> 84px pitch
  const slotsContentWidth = totalSlots * 84 - 12;
  // Account for header width, padding, and 48px breathing buffer for active scale/glows
  const minRequiredWidth = Math.max(270, slotsContentWidth);
  const adaptedWidth = Math.max(
    PANEL_CONSTANTS.MIN_WIDTH,
    minRequiredWidth + PANEL_CONSTANTS.PADDING_X * 2 + 48
  );

  // Height: Header (~38px) + Pointers (~36px) + Slots with index (~96px) + Footer (~26px) + gaps + padding (~40px) = 256px
  const adaptedHeight = Math.max(PANEL_CONSTANTS.MIN_HEIGHT, 256);

  return {
    w: typeof currentWidth === 'number' && currentWidth > adaptedWidth ? currentWidth : adaptedWidth,
    h: typeof currentHeight === 'number' && currentHeight > adaptedHeight ? currentHeight : adaptedHeight,
  };
}

/**
 * Calculates adapted dimensions for Variable Cards shape (dsa-variable-cards).
 * Automatically adapts width & height based on variable items count with generous
 * row spacing to prevent vertical scrollbars and clipped hover states.
 */
export function calculateVarsPanelDimensions(
  varCount: number,
  currentWidth?: number,
  currentHeight?: number
): { w: number; h: number } {
  let targetWidth: number = PANEL_CONSTANTS.MIN_WIDTH;
  let targetHeight: number = PANEL_CONSTANTS.MIN_HEIGHT;

  if (varCount <= 3) {
    targetWidth = Math.max(PANEL_CONSTANTS.MIN_WIDTH, varCount * 135 + 48);
    targetHeight = PANEL_CONSTANTS.MIN_HEIGHT;
  } else if (varCount <= 6) {
    const cols = Math.ceil(varCount / 2);
    targetWidth = Math.max(460, cols * 150 + 48);
    // 2 rows of cards need 210px to comfortably breathe without scrollbars
    targetHeight = 210;
  } else {
    // 7+ cards: 3 or more rows (e.g. 7 cards: 3 rows)
    const cols = 3;
    targetWidth = Math.max(540, cols * 165 + 48);
    const rows = Math.ceil(varCount / cols);
    targetHeight = Math.max(240, 95 + rows * 48);
  }

  return {
    w: typeof currentWidth === 'number' && currentWidth > targetWidth ? currentWidth : targetWidth,
    h: typeof currentHeight === 'number' && currentHeight > targetHeight ? currentHeight : targetHeight,
  };
}

/**
 * Calculates adapted dimensions for Loop Tracker shape (dsa-loop-tracker).
 * Automatically adapts based on pills count, header, and condition text with
 * generous height to avoid vertical scrollbar cuts next to iteration pills.
 */
export function calculateLoopPanelDimensions(
  pillsCount: number,
  headerText = '',
  conditionText = '',
  currentWidth?: number,
  currentHeight?: number
): { w: number; h: number } {
  // Pills row width: pillsCount pills (~70px each + gap 6px) + exit pill (~66px)
  const pillsWidth = (Math.max(1, pillsCount) + 1) * 72 + 24;
  // Approximate minimum header width
  const headerWidth = headerText.length * 8 + 150;
  // Approximate minimum condition width
  const condWidth = conditionText.length * 8 + 110;

  const contentWidth = Math.max(pillsWidth, headerWidth, condWidth);
  const adaptedWidth = Math.max(
    PANEL_CONSTANTS.MIN_WIDTH,
    contentWidth + PANEL_CONSTANTS.PADDING_X * 2 + 24
  );
  // Height: Header (~38px) + Progress (~14px) + Condition (~40px) + Pills (~40px) + padding (~40px) + gaps = 200px
  const adaptedHeight = 200;

  return {
    w: typeof currentWidth === 'number' && currentWidth > adaptedWidth ? currentWidth : adaptedWidth,
    h: typeof currentHeight === 'number' && currentHeight > adaptedHeight ? currentHeight : adaptedHeight,
  };
}

export const LINKED_LIST_PANEL_CONSTANTS = {
  MIN_WIDTH: 180,
  MIN_HEIGHT: 134,
  PADDING_X: 16,
  PADDING_Y: 12,
} as const;

/**
 * Calculates adapted dimensions for Linked List Node shape (dsa-linked-node).
 * Automatically expands width if multiple pointer badges (prev, curr, next, tail)
 * are attached, or if the stored node value contains multi-digit or string content.
 * Prevents badge clipping and maintains centered compartment alignment.
 */
export function calculateLinkedListNodeDimensions(
  pointersCount: number,
  value?: string | number,
  currentWidth?: number,
  currentHeight?: number
): { w: number; h: number } {
  const count = Math.max(0, pointersCount);
  // Pointer badges: ~48px per badge + 6px gap + horizontal padding
  const pointersRequiredWidth =
    count > 0 ? count * 48 + (count - 1) * 6 + LINKED_LIST_PANEL_CONSTANTS.PADDING_X * 2 : 0;

  // Value compartment + next pointer compartment (56px) + borders & padding
  const valStr = value !== undefined && value !== null ? String(value) : '';
  const valCompWidth = Math.max(54, valStr.length * 13 + 16);
  const cardRequiredWidth = valCompWidth + 56 + LINKED_LIST_PANEL_CONSTANTS.PADDING_X * 2 + 12;

  const contentWidth = Math.max(pointersRequiredWidth, cardRequiredWidth);
  const adaptedWidth = Math.max(LINKED_LIST_PANEL_CONSTANTS.MIN_WIDTH, contentWidth);
  // 134px uniform height provides perfect vertical alignment for horizontal connector arrows
  // and generous breathing room for pointer badges, compartments, and subscripts.
  const adaptedHeight = LINKED_LIST_PANEL_CONSTANTS.MIN_HEIGHT;

  return {
    w: typeof currentWidth === 'number' && currentWidth > adaptedWidth ? currentWidth : adaptedWidth,
    h: typeof currentHeight === 'number' && currentHeight > adaptedHeight ? currentHeight : adaptedHeight,
  };
}


export const TREE_NODE_PANEL_CONSTANTS = {
  MIN_WIDTH: 76,
  MIN_HEIGHT: 76,
  PADDING: 8,
} as const;

/**
 * Calculates adapted dimensions for Binary Tree Node shape (dsa-tree-node).
 * Automatically adapts circular diameter based on value character count (e.g. 1024, -999)
 * and provides breathing margin so focus rings, glow effects, and branch badges (L/R)
 * are never cut off.
 */
export function calculateTreeNodeDimensions(
  value?: number | string,
  currentWidth?: number,
  currentHeight?: number
): { w: number; h: number } {
  const valStr = value !== undefined && value !== null ? String(value) : '';
  // Multi-digit values need larger diameter so text fits inside circle with padding
  const requiredDiameter =
    valStr.length > 3
      ? Math.max(TREE_NODE_PANEL_CONSTANTS.MIN_WIDTH, valStr.length * 15 + 24)
      : TREE_NODE_PANEL_CONSTANTS.MIN_WIDTH;

  const targetW = Math.max(TREE_NODE_PANEL_CONSTANTS.MIN_WIDTH, requiredDiameter);
  const targetH = Math.max(TREE_NODE_PANEL_CONSTANTS.MIN_HEIGHT, requiredDiameter);

  return {
    w: typeof currentWidth === 'number' && currentWidth > targetW ? currentWidth : targetW,
    h: typeof currentHeight === 'number' && currentHeight > targetH ? currentHeight : targetH,
  };
}

