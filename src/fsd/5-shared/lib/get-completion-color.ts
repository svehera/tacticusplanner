export const getCompletionRateColor = (current: number, total: number): string => {
    if (!current) {
        return 'white';
    }

    const completionPercentage = (current / total) * 100;

    if (completionPercentage === 100) {
        return 'green';
    } else if (completionPercentage >= 75) {
        return 'lightgreen';
    } else if (completionPercentage >= 50) {
        return 'yellow';
    } else if (completionPercentage >= 25) {
        return 'orange';
    } else {
        return 'lightcoral';
    }
};
