import type { VariableCardEntity } from '../../types/timeline';

export const VARIABLE_CARDS_SHAPE_TYPE = 'dsa-variable-cards' as const;

export interface VariableItem {
  name: string;
  value: string | number;
  color?: 'mint' | 'indigo' | 'amber' | 'purple';
  isUpdated?: boolean;
}

export interface VariableCardsShapeProps {
  w: number;
  h: number;
  title: string;
  variables: VariableItem[];
}

export const VARIABLE_CARDS_DEFAULT_PROPS: VariableCardsShapeProps = {
  w: 520,
  h: 175,
  title: 'vars',
  variables: [
    { name: 'max', value: 13, color: 'mint', isUpdated: false },
    { name: 'secondMax', value: 5, color: 'mint', isUpdated: false },
    { name: 'pivot', value: 13, color: 'mint', isUpdated: false },
    { name: 'i', value: -1, color: 'indigo', isUpdated: false },
    { name: 'j', value: 0, color: 'indigo', isUpdated: false },
  ],
};

/**
 * Convert pure timeline state variable entities into shape render props items
 */
export function entityMapToVariableItems(
  variablesRecord: Record<string, VariableCardEntity>,
  changedVars?: Set<string>
): VariableItem[] {
  return Object.values(variablesRecord).map((card) => ({
    name: card.name,
    value: card.value,
    color: card.color || 'indigo',
    isUpdated: changedVars ? changedVars.has(card.name) : Boolean(card.isUpdated),
  }));
}

/**
 * Visual styling theme for individual variable cards
 */
export function getVariableTheme(color?: string): {
  cardClass: string;
  badgeClass: string;
  textClass: string;
} {
  switch (color) {
    case 'mint':
      return {
        cardClass: 'border-emerald-500/80 bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-900 shadow-emerald-500/5',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        textClass: 'text-emerald-950',
      };
    case 'amber':
      return {
        cardClass: 'border-amber-400/80 bg-amber-50/90 hover:bg-amber-100/90 text-amber-950 shadow-amber-500/5',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        textClass: 'text-amber-950',
      };
    case 'purple':
      return {
        cardClass: 'border-purple-400/80 bg-purple-50/90 hover:bg-purple-100/90 text-purple-900 shadow-purple-500/5',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
        textClass: 'text-purple-950',
      };
    case 'indigo':
    default:
      return {
        cardClass: 'border-indigo-400/80 bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-900 shadow-indigo-500/5',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        textClass: 'text-indigo-950',
      };
  }
}

/**
 * Update a variable in the list immutably
 */
export function updateVariableInList(
  variables: VariableItem[],
  name: string,
  newValue: string | number
): VariableItem[] {
  return variables.map((v) => (v.name === name ? { ...v, value: newValue, isUpdated: true } : v));
}

/**
 * Append or upsert variable in list immutably
 */
export function upsertVariableInList(
  variables: VariableItem[],
  item: VariableItem
): VariableItem[] {
  const existing = variables.find((v) => v.name === item.name);
  if (existing) {
    return variables.map((v) => (v.name === item.name ? { ...v, ...item, isUpdated: true } : v));
  }
  return [...variables, { ...item, isUpdated: true }];
}

/**
 * Remove a variable from the list immutably
 */
export function removeVariableFromList(
  variables: VariableItem[],
  name: string
): VariableItem[] {
  return variables.filter((v) => v.name !== name);
}
