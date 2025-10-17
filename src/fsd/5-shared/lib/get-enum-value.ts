export const getEnumValues = (enumObj: any): number[] => {
    return Object.keys(enumObj)
        .filter(key => typeof enumObj[key] === 'number')
        .map(key => enumObj[key]);
};
