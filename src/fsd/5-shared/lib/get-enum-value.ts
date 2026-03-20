export const getEnumValues = (enumObject: any): number[] => {
    return Object.keys(enumObject)
        .filter(key => typeof enumObject[key] === 'number')
        .map(key => enumObject[key]);
};
