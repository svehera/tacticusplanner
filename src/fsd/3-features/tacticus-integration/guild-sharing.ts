/** A Tacticus guild tag is exactly five alphanumeric characters. */
export const GUILD_TAG_LENGTH = 5;

const GUILD_TAG_REGEX = /^[a-z0-9]{5}$/i;

export function isValidGuildTag(tag: string): boolean {
    return GUILD_TAG_REGEX.test(tag);
}

/** Order-insensitive equality for two guild-tag lists. */
export function sameGuildTags(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].toSorted((x, y) => x.localeCompare(y));
    const sortedB = [...b].toSorted((x, y) => x.localeCompare(y));
    return sortedA.every((tag, index) => tag === sortedB[index]);
}
