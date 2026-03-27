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

export const arrayToKeyedObject = <T extends Record<K, PropertyKey>, K extends keyof T>(
    array: readonly T[],
    key: K
): Record<T[K], T> => Object.fromEntries(array.map(element => [element[key], element])) as Record<T[K], T>;
