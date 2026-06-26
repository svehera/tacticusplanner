/* eslint-disable import-x/no-internal-modules */
import { isValidGuildTag } from '@/fsd/3-features/tacticus-integration/guild-sharing';

export interface SharedLeaderboardsPending {
    adds: string[];
    removes: Set<string>;
}

export function computePendingSummary(pending: SharedLeaderboardsPending): string[] {
    const lines: string[] = [];
    for (const tag of [...pending.removes].toSorted()) {
        lines.push(`Remove ${tag}`);
    }
    for (const tag of [...pending.adds].toSorted()) {
        lines.push(`Add ${tag}`);
    }
    return lines;
}

export function hasPendingChanges(pending: SharedLeaderboardsPending): boolean {
    return pending.adds.length > 0 || pending.removes.size > 0;
}

export function isTagAlreadyPresent(tag: string, committed: string[], pending: SharedLeaderboardsPending): boolean {
    if (pending.removes.has(tag)) return false;
    return committed.includes(tag) || pending.adds.includes(tag);
}

export function canAddTag(draft: string, committed: string[], pending: SharedLeaderboardsPending): boolean {
    const trimmed = draft.trim();
    return isValidGuildTag(trimmed) && !isTagAlreadyPresent(trimmed, committed, pending);
}
