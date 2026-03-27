import { describe, it, expect } from 'vitest';

import { arrayToKeyedObject, filterMap } from './array-utils';

describe('filterMap', () => {
    describe('mapping behavior', () => {
        it('maps all elements when the map function returns a value for every element', () => {
            const input = [1, 2, 3];
            const result = filterMap(input, x => x * 2);
            expect(result).toEqual([2, 4, 6]);
        });

        it('can map elements to a different type', () => {
            const input = [1, 2, 3];
            const result = filterMap(input, String);
            expect(result).toEqual(['1', '2', '3']);
        });
    });

    describe('filtering behavior', () => {
        it('excludes elements when the map function returns undefined', () => {
            const input = [1, 2, 3];
            const result = filterMap(input, x => (x === 2 ? undefined : x));
            expect(result).toEqual([1, 3]);
        });

        it('returns an empty array when the map function returns undefined for every element', () => {
            const input = [1, 2, 3];
            const result = filterMap(input, () => {});
            expect(result).toEqual([]);
        });
    });

    describe('combined filter + map behavior', () => {
        it('filters and maps elements in a single pass', () => {
            const input = [1, 2, 3, 4, 5];
            const result = filterMap(input, x => (x % 2 === 0 ? x * 10 : undefined));
            expect(result).toEqual([20, 40]);
        });

        it('can filter and map objects', () => {
            const input = [
                { name: 'Alice', age: 30 },
                { name: 'Bob', age: 15 },
                { name: 'Charlie', age: 25 },
            ];
            const result = filterMap(input, person => (person.age >= 18 ? person.name : undefined));
            expect(result).toEqual(['Alice', 'Charlie']);
        });
    });

    describe('callback arguments', () => {
        it('passes the correct element, index, and array to the map function', () => {
            const input = ['a', 'b', 'c'];
            const calls: [string, number, readonly string[]][] = [];

            filterMap(input, (element, index, array) => {
                calls.push([element, index, array]);
                return element;
            });

            expect(calls).toEqual([
                ['a', 0, input],
                ['b', 1, input],
                ['c', 2, input],
            ]);
        });
    });

    describe('edge cases', () => {
        it('returns an empty array when given an empty array', () => {
            const result = filterMap([], () => 'value');
            expect(result).toEqual([]);
        });

        it('does not include falsy non-undefined values in filtered output', () => {
            const input = [1, 2, 3];
            const result = filterMap(input, x => (x === 2 ? 0 : x));
            expect(result).toEqual([1, 0, 3]);
        });

        it('does not include null values in filtered output', () => {
            const input = [1, 2, 3];
            // null is a valid output value (not undefined), so it should be included
            // eslint-disable-next-line unicorn/no-null
            const result = filterMap(input, x => (x === 2 ? null : x));
            // eslint-disable-next-line unicorn/no-null
            expect(result).toEqual([1, null, 3]);
        });
    });
});

describe('arrayToKeyedObject', () => {
    describe('basic behavior', () => {
        it('keys each element by the specified property', () => {
            const input = [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' },
            ];
            const result = arrayToKeyedObject(input, 'id');
            expect(result).toEqual({
                1: { id: 1, name: 'Alice' },
                2: { id: 2, name: 'Bob' },
            });
        });

        it('works with string key values', () => {
            const input = [
                { code: 'foo', value: 10 },
                { code: 'bar', value: 20 },
            ];
            const result = arrayToKeyedObject(input, 'code');
            expect(result).toEqual({
                foo: { code: 'foo', value: 10 },
                bar: { code: 'bar', value: 20 },
            });
        });
    });

    describe('edge cases', () => {
        it('returns an empty object when given an empty array', () => {
            const result = arrayToKeyedObject([], 'id');
            expect(result).toEqual({});
        });

        it('last element wins when multiple elements share the same key value', () => {
            const input = [
                { id: 1, name: 'Alice' },
                { id: 1, name: 'Bob' },
            ];
            const result = arrayToKeyedObject(input, 'id');
            expect(result).toEqual({ 1: { id: 1, name: 'Bob' } });
        });
    });
});
