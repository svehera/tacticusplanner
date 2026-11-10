import { Link } from 'react-router-dom';

import { usePageMetaOverride } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { getShopCurrencyIconKey, shopEvents } from '@/fsd/4-entities/shops';

import {
    getEventDate,
    getEventDayOrder,
    getShopEventStatus,
    ShopEventStatus,
    sortShopEventsNewestFirst,
} from './shop-events.dates';

const sortedShopEvents = sortShopEventsNewestFirst(shopEvents);

const STATUS_LABEL: Record<ShopEventStatus, string> = { upcoming: 'Upcoming', active: 'Active', ended: 'Ended' };

export const ShopEventsList = () => {
    usePageMetaOverride({
        section: 'Plan',
        title: 'Shop Events',
        description: 'Browse seasonal and merchant shop events.',
    });

    return (
        <div className="flex flex-col gap-4 p-4">
            <h1 className="text-2xl font-bold">Shop Events</h1>
            <div className="flex flex-col gap-3">
                {sortedShopEvents.map(event => {
                    const currencyIconKey = getShopCurrencyIconKey(event.currencyType);
                    const status = getShopEventStatus(event);
                    const dayOrder = getEventDayOrder(event);
                    const startLabel = getEventDate(event, 1, dayOrder[0]);
                    const endWeek = event.weeks.length;
                    const endLabel = getEventDate(event, endWeek, dayOrder[6]);
                    const hasBanner = !!event.banner;

                    return (
                        <Link
                            key={event.id}
                            to={`/plan/shop-events/${event.id}`}
                            className={[
                                'relative flex flex-col justify-end gap-2 overflow-hidden rounded-xl border border-(--border) bg-(--overlay) p-4 transition-colors hover:border-(--primary)',
                                hasBanner ? (status === 'ended' ? 'min-h-24' : 'min-h-40') : '',
                            ].join(' ')}>
                            {event.banner && (
                                <>
                                    <img
                                        src={event.banner}
                                        alt=""
                                        loading="lazy"
                                        className={`absolute inset-0 size-full object-cover ${status === 'ended' ? 'opacity-70 grayscale-[40%]' : ''}`}
                                    />
                                    {/* Scrim so the text stays readable on any art. */}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
                                </>
                            )}
                            <div className={`relative flex items-center gap-2 ${hasBanner ? 'text-white' : ''}`}>
                                {currencyIconKey && <MiscIcon icon={currencyIconKey} width={28} height={28} />}
                                <span className="text-lg font-semibold">{event.displayName}</span>
                                <span
                                    className={[
                                        'ml-auto rounded-full px-2 py-0.5 text-xs',
                                        status === 'ended'
                                            ? 'bg-(--neutral) text-(--soft-fg)'
                                            : 'bg-(--primary) text-(--primary-fg)',
                                    ].join(' ')}>
                                    {STATUS_LABEL[status]}
                                </span>
                            </div>
                            <span className={`relative text-xs ${hasBanner ? 'text-white/80' : 'text-(--soft-fg)'}`}>
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
