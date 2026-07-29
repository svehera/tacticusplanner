/**
 * Maps over an array and filters out any `undefined` results in a single pass.
 * Useful as a combined alternative to chaining `.map().filter()`.
 */
export const filterMap = <Element, Output>(
    array: readonly Element[],
    mapFunction: (element: Element, index: number, array: readonly Element[]) => Output | undefined
): Output[] => {
    const results = [];
    for (let index = 0; index < array.length; index++) {
        const result = mapFunction(array[index], index, array);
        if (result !== undefined) results.push(result);
    }
    return results;
};

/**
 * Returns a copy of `array` with the element at `fromIndex` moved to `toIndex`.
 * Both indices are assumed to be in range — callers guard their own bounds.
 */
export const moveItem = <T>(array: readonly T[], fromIndex: number, toIndex: number): T[] => {
    const result = [...array];
    const [moved] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, moved);
    return result;
};

/**
 * Converts an array into an object keyed by the specified property.
 * If multiple elements share the same key value, the last one wins.
 */
export const arrayToKeyedObject = <T extends Record<K, PropertyKey>, K extends keyof T>(
    array: readonly T[],
    key: K
): Record<T[K], T> => Object.fromEntries(array.map(element => [element[key], element])) as Record<T[K], T>;
