import { CalendarDays } from 'lucide-react';

import { getImageUrl } from '@/fsd/5-shared/ui';

/**
 * eventName -> image path (relative to `src/assets/images`). Every event currently falls back to
 * the placeholder icon below; fill these in per-event as real art gets datamined.
 */
const HSE_ICON_BY_EVENT_NAME: Partial<Record<string, string>> = {};

export function HseIcon({ eventName, className }: { eventName: string; className?: string }) {
    const iconPath = HSE_ICON_BY_EVENT_NAME[eventName];
    if (iconPath) {
        return <img src={getImageUrl(iconPath)} alt={eventName} className={className} />;
    }
    return <CalendarDays className={className} />;
}
