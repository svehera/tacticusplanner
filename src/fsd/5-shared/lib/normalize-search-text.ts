/** Normalize text for accent-insensitive, case-insensitive search. */
export const normalizeSearchText = (text: string | undefined | null): string =>
    (text ?? '')
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036F]/g, '')
        .toLowerCase()
        .trim();
