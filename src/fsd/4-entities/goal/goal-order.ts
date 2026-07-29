/**
 * Array order is the source of truth for goal ordering; `priority` is derived from it and re-derived
 * on every load (see the `GlobalState` constructor). Persisting a `priority` that disagrees with the
 * array position silently loses the reorder on the next refresh, so every write that changes goal
 * order must return through here.
 */
export const normalizeGoalOrder = <T extends { priority: number }>(goals: readonly T[]): T[] =>
    goals.map((goal, index) => ({ ...goal, priority: index + 1 }));
