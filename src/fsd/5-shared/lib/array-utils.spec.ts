import { describe, it, expect } from 'vitest';

import { arrayToKeyedObject, filterMap, moveInOrder, moveItem, normalizeOrder } from './array-utils';

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

describe('moveItem', () => {
    describe('basic behavior', () => {
        it('moves an element forward', () => {
            expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
        });

        it('moves an element backward', () => {
            expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
        });

        it('moves an element by one position', () => {
            expect(moveItem(['a', 'b', 'c'], 1, 0)).toEqual(['b', 'a', 'c']);
        });

        it('moves the first element to last', () => {
            expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
        });

        it('moves the last element to first', () => {
            expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
        });

        it('preserves element identity rather than cloning', () => {
            const first = { id: 'a' };
            const second = { id: 'b' };
            const result = moveItem([first, second], 1, 0);
            expect(result[0]).toBe(second);
            expect(result[1]).toBe(first);
        });
    });

    describe('edge cases', () => {
        it('returns an equal array when the indices are the same', () => {
            expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
        });

        it('returns a copy rather than mutating the input', () => {
            const input = ['a', 'b', 'c'];
            const result = moveItem(input, 0, 2);
            expect(input).toEqual(['a', 'b', 'c']);
            expect(result).not.toBe(input);
        });

        it('returns an equal array for a single-element array', () => {
            expect(moveItem(['a'], 0, 0)).toEqual(['a']);
        });
    });
});

describe('normalizeOrder', () => {
    it('assigns priority from array position, 1-based', () => {
        const result = normalizeOrder([{ priority: 99 }, { priority: 1 }, { priority: 50 }]);
        expect(result.map(x => x.priority)).toEqual([1, 2, 3]);
    });

    it('preserves other fields', () => {
        const result = normalizeOrder([{ priority: 5, name: 'a' }]);
        expect(result).toEqual([{ priority: 1, name: 'a' }]);
    });

    it('returns an empty array when given an empty array', () => {
        expect(normalizeOrder([])).toEqual([]);
    });

    it('does not mutate the input', () => {
        const input = [{ priority: 5 }];
        normalizeOrder(input);
        expect(input).toEqual([{ priority: 5 }]);
    });
});

describe('moveInOrder', () => {
    // Global order, interleaving two accordion sections the way the goals page does.
    const ORDER = ['ascend-1', 'upgrade-2', 'upgrade-3', 'ascend-4'];

    describe('moving up', () => {
        it('swaps the item with the one above it', () => {
            expect(moveInOrder(ORDER, 'upgrade-3', -1)).toEqual(['ascend-1', 'upgrade-3', 'upgrade-2', 'ascend-4']);
        });

        it('moves an item past a neighbour from another section', () => {
            expect(moveInOrder(ORDER, 'upgrade-2', -1)).toEqual(['upgrade-2', 'ascend-1', 'upgrade-3', 'ascend-4']);
        });

        it('returns undefined only for the globally first item', () => {
            expect(moveInOrder(ORDER, 'ascend-1', -1)).toBeUndefined();
        });
    });

    describe('moving down', () => {
        it('swaps the item with the one below it', () => {
            expect(moveInOrder(ORDER, 'upgrade-2', 1)).toEqual(['ascend-1', 'upgrade-3', 'upgrade-2', 'ascend-4']);
        });

        it('returns undefined only for the globally last item', () => {
            expect(moveInOrder(ORDER, 'ascend-4', 1)).toBeUndefined();
        });
    });

    describe('edge cases', () => {
        it('returns undefined when the item is not in the list', () => {
            expect(moveInOrder(ORDER, 'not-here', 1)).toBeUndefined();
        });

        it('returns undefined for a single-item list in either direction', () => {
            expect(moveInOrder(['only'], 'only', -1)).toBeUndefined();
            expect(moveInOrder(['only'], 'only', 1)).toBeUndefined();
        });

        it('returns undefined when a multi-step move would overshoot the end', () => {
            expect(moveInOrder(ORDER, 'upgrade-3', 2)).toBeUndefined();
        });

        it('supports multi-step moves that stay in range', () => {
            expect(moveInOrder(ORDER, 'ascend-1', 3)).toEqual(['upgrade-2', 'upgrade-3', 'ascend-4', 'ascend-1']);
        });

        it('does not mutate the list', () => {
            const order = ['a', 'b', 'c'];
            moveInOrder(order, 'a', 1);
            expect(order).toEqual(['a', 'b', 'c']);
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
