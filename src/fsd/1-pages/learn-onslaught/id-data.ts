import { OnslaughtTrackId } from './models';

export const GREEK_ZONES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'];

/** Utility to convert Roman Numerals to Numbers for search */
export const romanToNumber = (roman: string): number => {
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
    for (let index = 0; index < roman.length; index++) {
        const current = romanNumerals[roman[index]];
        const next = romanNumerals[roman[index + 1]];

        if (next && current < next) {
            result -= current;
        } else {
            result += current;
        }
    }
    return result;
};

/** Utility to convert Numbers to Roman Numerals */
export const numberToRoman = (toConvert: number): string => {
    if (toConvert < 1 || toConvert > 1000) return '';

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
        while (toConvert >= value) {
            result += symbol;
            toConvert -= value;
        }
    }
    return result;
};

export const ONSLAUGHT_TRACK_NAME: Record<OnslaughtTrackId, string> = {
    [OnslaughtTrackId.Imperial]: 'Imperial',
    [OnslaughtTrackId.Xenos]: 'Xenos',
    [OnslaughtTrackId.Chaos]: 'Chaos',
};
