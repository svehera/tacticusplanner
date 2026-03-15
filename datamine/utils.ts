import fs from 'fs/promises';

import { z } from 'zod';

// e.g. CountStringSchemaGenerator('gold', 'gem') will create a schema that accepts 'gold', 'gem', 'gold:100', 'gem:50', etc.
// Transforms it to an object of the form { type: 'gold', amount: 100 } or { type: 'gem', amount: 50 } for easier use in code.
export const CountStringSchemaGenerator = (...rewardStrings: string[]) => {
    if (rewardStrings.length === 0) throw new Error('At least one reward string must be provided');
    const stringSchema = z.union(rewardStrings.map(str => z.literal(str)));
    return z
        .union([stringSchema, z.templateLiteral([stringSchema, z.literal(':'), z.int().positive()])])
        .transform(val => {
            const [type, amount = '1'] = val.split(':');
            return { type, amount: parseInt(amount, 10) };
        });
};

const RARITY_VALUES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'] as const;
export const RaritySchema = z.enum(RARITY_VALUES);

const ALLIANCE_VALUES = ['Imperial', 'Xenos', 'Chaos'] as const;
export const AllianceSchema = z.enum(ALLIANCE_VALUES);

export const saveToTsConst = async (data: unknown, fileName: string) => {
    const filePath = `./generated/${fileName}.gen.ts`;
    const fileContent = `
// This file is auto-generated. Do not edit directly.
// Generated on ${new Date().toISOString()}
export const data = ${JSON.stringify(data, undefined, 2)} as const;

`;
    await fs.writeFile(filePath, fileContent);
};

const GREEK_LETTERS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'] as const;
const ROMAN_NUMERALS = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
] as const;

export function indexToRomanNumeral(index: number) {
    if (index < 0 || index > 200) return `Roman(${index})`;
    let result = '';
    let remaining = index + 1;
    for (const [value, symbol] of ROMAN_NUMERALS) {
        while (remaining >= value) {
            result += symbol;
            remaining -= value;
        }
    }
    return result;
}

export function indexToGreekLetter(index: number) {
    if (index < 0 || index >= GREEK_LETTERS.length) return `Greek(${index})`;
    return GREEK_LETTERS[index];
}

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type RenameKeys<T, M extends Partial<Record<keyof T, string>>> = Prettify<{
    [K in keyof T as K extends keyof M ? M[K] & string : K]: T[K];
}>;

export function renameKeys<T extends object, M extends Partial<Record<keyof T, string>>>(
    obj: T,
    keyMap: M
): RenameKeys<T, M> {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [keyMap[key as keyof T] ?? key, value])
    ) as RenameKeys<T, M>;
}

export function isPropertyLinear<O extends object, K extends keyof O>(data: O[], key: K, initialValue = 1) {
    return !data.some((entry, index) => entry[key] !== initialValue + index);
}

export function isPropertyAscending<K extends string, O extends { [key in K]: number }>(data: O[], key: K) {
    let lastValue = -Infinity;
    for (const entry of data) {
        if (entry[key] <= lastValue) return false;
        lastValue = entry[key];
    }
    return true;
}

export const ItemSchema = z.enum(['I_Crit', 'I_Defensive', 'I_Booster_Crit', 'I_Block', 'I_Booster_Block']);
