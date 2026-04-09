/**
 * Converts a number of days into a formatted date string.
 * Returns an empty string if days is undefined or non-positive.
 */
export const getEstimatedDate = (days: number | undefined): string => {
    if (days === undefined || !Number.isFinite(days) || days <= 0) return '';
    const date = new Date();
    // Use Math.ceil to handle partial days (e.g., 1.2 days is 2 calendar days away)
    date.setDate(date.getDate() + Math.ceil(days) - 1);
    return formatDateWithOrdinal(date);
};

export function getImageUrl(image: string): string {
    return new URL(`../assets/images/${image}`, import.meta.url).href;
}

export function formatDateWithOrdinal(date: Date, withYear: boolean = false): string {
    const day = date.getDate();
    const month = date.toLocaleString('en', { month: 'long' });
    const suffix = getDaySuffix(day);
    const year = date.getFullYear();

    return withYear ? `${day}${suffix} of ${month} ${year}` : `${day}${suffix} of ${month}`;
}

function getDaySuffix(day: number) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1: {
            return 'st';
        }
        case 2: {
            return 'nd';
        }
        case 3: {
            return 'rd';
        }
        default: {
            return 'th';
        }
    }
}

// Re-export from shared lib

export { getEnumValues, getCompletionRateColor } from '@/fsd/5-shared/lib';
