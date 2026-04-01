/*
 * Converts number to a string with separated thousands e.g. 123 456 789
 * */
export const numberToThousandsString = (value: number): string => {
    return value < 1000 ? value.toString() : Math.floor(value / 1000) + 'k';
};

export const numberToThousandsStringOld = (value: number): string => {
    return value.toLocaleString().replaceAll(',', ' ');
};
