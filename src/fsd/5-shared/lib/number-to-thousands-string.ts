/*
 * Converts number to a string with separated thousands e.g. 123 456 789
 * */
export const numberToThousandsString = (value: number): string => {
    if (value < 1000) {
        return value.toString();
    } else {
        return Math.floor(value / 1000) + 'k';
    }
};

export const numberToThousandsStringOld = (value: number): string => {
    return value.toLocaleString().replace(/,/g, ' ');
};
