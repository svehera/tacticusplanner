import { OnslaughtTrackId } from './models';

export const ROMAN_MAP: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
export const GREEK_ZONES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'];

/** Utility to convert Roman Numerals to Numbers for search */
export const romanToNum = (roman: string): number => {
    const romanNumerals: Record<string, number> = {
        I: 1,
        V: 5,
        X: 10,
        L: 50,
        C: 100,
        D: 500,
        M: 1000,
    };

    let result = 0;
    for (let i = 0; i < roman.length; i++) {
        const current = romanNumerals[roman[i]];
        const next = romanNumerals[roman[i + 1]];

        if (next && current < next) {
            result -= current;
        } else {
            result += current;
        }
    }
    return result;
};

/** Utility to convert Numbers to Roman Numerals */
export const numToRoman = (num: number): string => {
    if (num < 1 || num > 1000) return '';

    const romanNumerals: [number, string][] = [
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
    ];

    let result = '';
    for (const [value, symbol] of romanNumerals) {
        while (num >= value) {
            result += symbol;
            num -= value;
        }
    }
    return result;
};

export const ONSLAUGHT_TRACK_NAME: Record<OnslaughtTrackId, string> = {
    [OnslaughtTrackId.Imperial]: 'Imperial',
    [OnslaughtTrackId.Xenos]: 'Xenos',
    [OnslaughtTrackId.Chaos]: 'Chaos',
};
