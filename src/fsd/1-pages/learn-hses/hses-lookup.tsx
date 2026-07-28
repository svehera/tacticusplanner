/* eslint-disable import-x/no-internal-modules */
import { Infinity as InfinityIcon, Info } from 'lucide-react';
import { useContext, useMemo, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { formatPrice } from '@/fsd/5-shared/lib';
import { Rarity } from '@/fsd/5-shared/model';
import { TieredRewardCell, TieredRewardGrid } from '@/fsd/5-shared/ui/tiered-reward-grid';
import { AccessibleTooltip } from '@/fsd/5-shared/ui/tooltip';

import { CharactersService } from '@/fsd/4-entities/character';
import { getHseDisplayName, homescreenEvents, HseIcon, resolveHseTier } from '@/fsd/4-entities/homescreen_events';
import { MowsService } from '@/fsd/4-entities/mow';
import { hasBlueStarUnit, PL_MEDIUM } from '@/fsd/4-entities/shops';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';
import { resolveHseDescriptionLines } from '@/fsd/3-features/homescreen-events/hse-description-resolver';

import {
    hseOfferRewardInfo,
    hseOfferTitle,
    hseRewardInfo,
    hseTierKeyForRoster,
    REWARD_ICON_SIZE,
} from './hses-lookup.utils';

const sortedEvents = homescreenEvents
    .map(event => ({ event, displayName: getHseDisplayName(event) }))
    .toSorted((a, b) => a.displayName.localeCompare(b.displayName));

export const HsesLookup = () => {
    const { characters: unresolvedCharacters, mows, playerMetadata } = useContext(StoreContext);

    const [selectedEventName, setSelectedEventName] = useState(sortedEvents[0]?.event.eventName ?? '');

    const pl = playerMetadata.powerLevel ?? 1;

    const rosterHasBlueStarUnit = useMemo(() => {
        const characters = CharactersService.resolveStoredCharacters(unresolvedCharacters);
        const resolvedMows = MowsService.resolveAllFromStorage(mows);
        return hasBlueStarUnit([...characters, ...resolvedMows]);
    }, [unresolvedCharacters, mows]);

    const tierKeyForRoster = hseTierKeyForRoster(pl, rosterHasBlueStarUnit);

    const selectedEvent = useMemo(
        () => homescreenEvents.find(event => event.eventName === selectedEventName),
        [selectedEventName]
    );

    const resolvedTier = selectedEvent ? resolveHseTier(selectedEvent, tierKeyForRoster) : undefined;
    const rewards = resolvedTier?.tier.tieredProgressRewards ?? [];
    const descriptionLines = resolvedTier ? resolveHseDescriptionLines(resolvedTier.tier) : [];
    const offers = Object.entries(resolvedTier?.tier.offers ?? {});
    const isSingleTierEvent = selectedEvent ? Object.keys(selectedEvent.tiers).length === 1 : false;

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex flex-wrap items-end gap-4 rounded-xl border border-(--border) bg-(--overlay) p-4">
                <div className="flex flex-col gap-1">
                    <label htmlFor="hse-select" className="text-sm font-medium text-(--fg)">
                        Home-Screen Event
                    </label>
                    <select
                        id="hse-select"
                        value={selectedEventName}
                        onChange={event_ => setSelectedEventName(event_.currentTarget.value)}
                        className="rounded-lg border border-(--border) bg-(--overlay) px-2 py-1.5 text-sm text-(--fg)">
                        {sortedEvents.map(({ event, displayName }) => (
                            <option key={event.eventName} value={event.eventName}>
                                {displayName}
                            </option>
                        ))}
                    </select>
                </div>

                {!isSingleTierEvent && (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-(--fg)">Power Level</span>
                        <p className="text-sm font-semibold tabular-nums">{pl}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-(--soft-fg)">
                            <span>
                                {'Your tier: '}
                                <span className="font-semibold text-amber-400 capitalize">
                                    {resolvedTier?.key ?? tierKeyForRoster}
                                </span>
                            </span>
                            <AccessibleTooltip
                                title={
                                    <span>
                                        Low: P.L. &lt;{PL_MEDIUM}
                                        <br />
                                        Mid: P.L. ≥{PL_MEDIUM}, no blue-star unit
                                        <br />
                                        High: P.L. ≥{PL_MEDIUM} with a blue-star (or higher) unit
                                    </span>
                                }>
                                <Info className="size-3.5 cursor-help" />
                            </AccessibleTooltip>
                        </p>
                    </div>
                )}
            </div>

            {selectedEvent && (
                <div className="flex items-center gap-3">
                    <HseIcon eventName={selectedEvent.eventName} className="size-8 text-(--soft-fg)" />
                    <h1 className="text-xl font-bold">{getHseDisplayName(selectedEvent)}</h1>
                </div>
            )}

            {descriptionLines.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border border-(--border) bg-(--overlay) p-4 text-sm text-(--fg)">
                    {descriptionLines.map((line, index) => (
                        <div key={index} className={index === 0 ? 'text-base font-semibold' : undefined}>
                            <AbilityText
                                text={line.text}
                                level={1}
                                variables={line.variables}
                                constants={line.constants}
                                scaledVariableNames={[]}
                                rarity={Rarity.Common}
                                unitName=""
                                factionId=""
                            />
                        </div>
                    ))}
                </div>
            )}

            {rewards.length === 0 ? (
                <div className="rounded-xl border border-(--border) bg-(--overlay) p-8 text-center text-(--soft-fg)">
                    No reward data available for this event/tier.
                </div>
            ) : (
                <TieredRewardGrid
                    cells={rewards.map((reward, index): TieredRewardCell => {
                        const { icon, label, qty } = hseRewardInfo(reward.chestRewardId);
                        const isLast = index === rewards.length - 1;
                        return {
                            key: index,
                            title: label,
                            badge: isLast && reward.endless && (
                                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-(--primary) text-(--primary-fg)">
                                    <InfinityIcon className="size-3.5" />
                                </span>
                            ),
                            rewards: [{ icon, qty }],
                            costLabel: `${reward.requiredProgress.toLocaleString()} pts`,
                        };
                    })}
                />
            )}

            {offers.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h2 className="text-sm font-semibold tracking-wide text-(--soft-fg) uppercase">Offers</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {offers.map(([offerId, offer]) => (
                            <div
                                key={offerId}
                                className="flex flex-col gap-2 rounded-xl border border-(--border) bg-(--overlay) p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-(--fg)">{hseOfferTitle(offerId)}</span>
                                    <span className="font-semibold text-amber-400 tabular-nums">
                                        {formatPrice(offer.realMoneyProduct.price, false)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1.5 rounded-lg bg-(--soft) p-2.5">
                                    {offer.offer.maxPurchases !== undefined && (
                                        <span className="text-xs text-(--soft-fg)">
                                            ×{offer.offer.maxPurchases} available
                                        </span>
                                    )}
                                    {offer.realMoneyProduct.rewards.map((reward, index) => {
                                        const { icon, label, qty } = hseOfferRewardInfo(reward);
                                        return (
                                            <div key={index} className="flex items-center gap-2">
                                                {icon && (
                                                    <div
                                                        className="flex shrink-0 items-center justify-center"
                                                        style={{ height: REWARD_ICON_SIZE, width: REWARD_ICON_SIZE }}>
                                                        {icon}
                                                    </div>
                                                )}
                                                <span className="text-sm text-(--fg)">
                                                    <span className="mr-1 font-semibold tabular-nums">×{qty}</span>
                                                    {label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
