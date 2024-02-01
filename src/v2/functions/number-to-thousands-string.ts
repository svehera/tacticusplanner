/*
 * Converts number to a string with separated thousands e.g. 123 456 789
 * */
export const numberToThousandsString = (value: number): string => {
    return value.toLocaleString().replace(/,/g, ' ');
};
