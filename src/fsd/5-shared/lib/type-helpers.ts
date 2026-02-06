/**
 * The Prettify helper is a utility type that takes an object type and makes the hover overlay more readable.
 *
 * @source https://www.totaltypescript.com/concepts/the-prettify-helper
 * @param T The type to prettify
 * @returns A new type with the same properties as T, but with a cleaner representation
 * @example type Original = { a: number } & { b: string };
 * @example type Pretty = Prettify<Original>; // { a: number; b: string; }
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Type-safe version of Object.keys
 *
 * @description Normally Object.keys returns string[] which is not type safe. This wraps it to return typed keys
 *
 * @param obj The object to get the keys from
 * @returns The keys of the object as an array of keyof Obj
 * @example Object.keys({ a: 1, b: 2 }) // string[]
 * @example constObjectKeys({ a: 1, b: 2 }) // ('a' | 'b')[]
 * */
export const constObjectKeys = <Obj extends object>(obj: Obj) => Object.keys(obj) as (keyof Obj)[];

/**
 * Utility type to get _all_ the possible keys from a const array of object types
 *
 * @param T The array of object types
 * @returns The union of all keys from the object types in the array
 * @example const sampleData = [ { a: 1, b: 2 }, { b: 3, c: 4 } ] as const;
 * @example type GuaranteedKeys = keyof typeof sampleData[number]; // 'b'
 * @example type AllKeys = UnionToKeys<typeof sampleData>; // 'a' | 'b' | 'c'
 */
type UnionToKeys<T extends readonly object[]> = {
    [K in keyof T]: T[K] extends object ? keyof T[K] : never;
}[number];

/**
 * Utility type to get the property type for a given key from a const array of object types.
 * Improvement over T[number][K] which gives `any` if the key is not present on all object types.
 *
 * @param T The array of object types
 * @param K The key to get the property type for
 * @returns The union of all property types for the given key from the object types in the array
 * @example const sampleData = [ { a: 1, b: 2 }, { a: 3, c: 4 } ] as const;
 * @example type PlainA = typeof sampleData[number]['a']; // 1 | 3
 * @example type PropA = GetPropType<typeof sampleData, 'a'>; // 1 | 3
 * @example type PlainB = typeof sampleData[number]['b']; // any
 * @example type PropB = GetPropType<typeof sampleData, 'b'>; // 2 | undefined
 */
type GetPropType<T extends readonly any[], K extends PropertyKey> = T[number] extends infer U
    ? U extends any
        ? K extends keyof U
            ? U[K]
            : undefined
        : never
    : never;

/**
 * Generates a type-safe getter function for a const array of object types.
 *
 * @param dataArray The array of object types
 * @returns A function that takes an object and a key, and returns the value of the key on the object if it exists, otherwise undefined
 * @example const sampleData = [ { a: 1, b: 2 }, { b: 3, c: 4 } ] as const;
 * @example const safeGet = createSafeGetter(sampleData);
 * @example const valueA = safeGet(sampleData[0], 'a'); // value: 10; type: 10 | undefined
 * @example const valueC = safeGet(sampleData[0], 'c'); // value: undefined; type: 4 | undefined
 * @example const valueX = safeGet(sampleData[1], 'x'); // value: undefined; TypeScript Error
 */
export function createSafeGetter<T extends readonly object[]>() {
    return <Obj extends T[number], Key extends UnionToKeys<T>>(obj: Obj, key: Key) => obj[key] as GetPropType<T, Key>;
}

/**
 * Utility type to remove all levels of readonly modifier from a type T
 */
type DeepMutable<T> = Prettify<{
    -readonly [P in keyof T]: DeepMutable<T[P]>;
}>;

/**
 * Creates a deep mutable copy of the given array of objects.
 * Intended for when we pass our JSON data (which is readonly) to libraries that require mutable data.
 *
 * @param obj The object or array to create a mutable copy of
 * @returns A deep mutable copy of the given object or array
 * @example const readonlyObj = { a: 1, b: { c: 2 } } as const;
 * @example const mutableObj = mutableCopy(readonlyObj);
 * @example mutableObj.b.c = 3; // No TypeScript error
 */
export function mutableCopy<T extends object | readonly object[]>(obj: T): DeepMutable<T> {
    return JSON.parse(JSON.stringify(obj)) as DeepMutable<T>;
}

type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>;

export type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;
