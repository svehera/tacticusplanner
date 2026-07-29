import { Link } from 'react-router-dom';

import { usePageMetaOverride } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { getShopCurrencyIconKey, shopEvents } from '@/fsd/4-entities/shops';

import { getEventDate, getEventDayOrder } from './shop-events.dates';

export const ShopEventsList = () => {
    usePageMetaOverride({
        section: 'Plan',
        title: 'Shop Events',
        description: 'Browse seasonal and merchant shop events.',
    });

    return (
        <div className="flex flex-col gap-4 p-4">
            <h1 className="text-2xl font-bold">Shop Events</h1>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shopEvents.map(event => {
                    const currencyIconKey = getShopCurrencyIconKey(event.currencyType);
                    const totalDays = event.weeks.length * 7;
                    const endUtc = event.startUtc + totalDays * 86_400_000;
                    const hasEnded = Date.now() > endUtc;
                    const dayOrder = getEventDayOrder(event);
                    const startLabel = getEventDate(event, 1, dayOrder[0]);
                    const endWeek = event.weeks.length;
                    const endLabel = getEventDate(event, endWeek, dayOrder[6]);

                    return (
                        <Link
                            key={event.id}
                            to={`/plan/shop-events/${event.id}`}
                            className="flex flex-col gap-2 rounded-xl border border-(--border) bg-(--overlay) p-4 transition-colors hover:border-(--primary)">
                            <div className="flex items-center gap-2">
                                {currencyIconKey && <MiscIcon icon={currencyIconKey} width={28} height={28} />}
                                <span className="font-semibold">{event.displayName}</span>
                                {hasEnded && (
                                    <span className="ml-auto rounded-full bg-(--neutral) px-2 py-0.5 text-xs text-(--soft-fg)">
                                        Ended
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-(--soft-fg)">
                                {startLabel} – {endLabel} · {event.weeks.length}{' '}
                                {event.weeks.length === 1 ? 'week' : 'weeks'}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
