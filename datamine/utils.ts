import fs from 'node:fs/promises';

import { z } from 'zod';

// e.g. CountStringSchemaGenerator('gold', 'gem') will create a schema that accepts
// 'gold'
// 'gem'
// 'gold:30'
// 'gem:4'
// 'gold:30-50'
// 'gem:4-5'
// Transforms it to an object of the form { type: 'gold', min: 30, max: 50 } for easier use in code.
export const CountStringSchemaGenerator = (...rewardStrings: string[]) => {
    if (rewardStrings.length === 0) throw new Error('At least one reward string must be provided');
    const stringSchema = z.union(rewardStrings.map(rewardString => z.literal(rewardString)));
    return z
        .union([
            stringSchema,
            z.templateLiteral([stringSchema, z.literal(':'), z.int().positive()]),
            z.templateLiteral([stringSchema, z.literal(':'), z.int().positive(), z.literal('-'), z.int().positive()]),
        ])
        .transform(value => {
            const [type, amount = '1'] = value.split(':');
            const [min = amount, max = amount] = amount.split('-');
            return {
                type,
                min: Number.parseInt(min, 10),
                max: Number.parseInt(max, 10),
            };
        });
};

const RARITY_VALUES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'] as const;
export const RaritySchema = z.enum(RARITY_VALUES);

const RARITY_LETTERS = ['C', 'U', 'R', 'E', 'L', 'M'] as const;
export const RarityLettersSchema = z.enum(RARITY_LETTERS);

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
    object: T,
    keyMap: M
): RenameKeys<T, M> {
    return Object.fromEntries(
        Object.entries(object).map(([key, value]) => [keyMap[key as keyof T] ?? key, value])
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

export const HealthUpgradeIdSchema = z.templateLiteral([
    'upgHp',
    RarityLettersSchema,
    z
        .string()
        .length(3)
        .regex(/^\d{3}$/),
    z.literal('C').optional(),
]);

export const DamageUpgradeIdSchema = z.templateLiteral([
    'upgDmg',
    RarityLettersSchema,
    z
        .string()
        .length(3)
        .regex(/^\d{2,3}$/),
    z.literal('C').optional(),
]);

export const ArmorUpgradeIdSchema = z.templateLiteral([
    'upgArm',
    RarityLettersSchema,
    z
        .string()
        .length(3)
        .regex(/^\d{2,3}$/),
    z.literal('C').optional(),
]);

export const UpgradeIdSchema = z.union([HealthUpgradeIdSchema, DamageUpgradeIdSchema, ArmorUpgradeIdSchema]);

export const UNCAPPED_LEVELS = 65;
export const LEVEL_CAP = 55; // Mythic goes to 65 but players are capped lower during the Mythic rollout
export const RELIC_LEVELS = 10;
export const MOW_MYTHIC_ABILITY_LEVELS = 4;
