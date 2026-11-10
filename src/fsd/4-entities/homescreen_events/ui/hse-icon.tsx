import { CalendarDays } from 'lucide-react';

import { getHseGameModeIconUrl } from './hse-icon.utils';

export function HseIcon({
    eventName,
    gameModeIcon,
    className,
}: {
    eventName: string;
    gameModeIcon?: string;
    className?: string;
}) {
    const url = getHseGameModeIconUrl(gameModeIcon);
    if (url) {
        return <img src={url} alt={eventName} className={`${className ?? ''} object-contain`} />;
    }
    return <CalendarDays className={className} />;
}
