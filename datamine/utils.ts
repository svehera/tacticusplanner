import fs from 'fs/promises';

import { z } from 'zod';

// e.g. RewardSchemaGenerator('gold', 'gem') will create a schema that accepts 'gold', 'gem', 'gold:100', 'gem:50', etc.
// Transforms it to an object of the form { type: 'gold', amount: 100 } or { type: 'gem', amount: 50 } for easier use in code.
export const RewardSchemaGenerator = (...rewardStrings: string[]) => {
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
