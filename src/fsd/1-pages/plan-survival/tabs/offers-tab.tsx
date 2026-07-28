import React from 'react';

import { formatPrice } from '@/fsd/5-shared/lib';

import {
    ISurvivalEvent,
    survivalOfferRewardInfo,
    survivalOfferTitle,
    SURVIVAL_REWARD_ICON_SIZE,
} from '@/fsd/4-entities/survival';

interface Props {
    event: ISurvivalEvent;
}

export const OffersTab: React.FC<Props> = ({ event }) => {
    const offers = Object.entries(event.offers);

    if (offers.length === 0) {
        return (
            <div className="rounded-xl border border-(--border) bg-(--overlay) p-8 text-center text-(--soft-fg)">
                No offers for this event.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map(([offerId, offer]) => (
                <div
                    key={offerId}
                    className="flex flex-col gap-2 rounded-xl border border-(--border) bg-(--overlay) p-4">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-(--fg)">{survivalOfferTitle(offerId)}</span>
                        <span className="font-semibold text-amber-400 tabular-nums">
                            {formatPrice(offer.realMoneyProduct.price, false)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5 rounded-lg bg-(--soft) p-2.5">
                        {offer.offer.maxPurchases !== undefined && (
                            <span className="text-xs text-(--soft-fg)">×{offer.offer.maxPurchases} available</span>
                        )}
                        {offer.realMoneyProduct.rewards.map((reward, index) => {
                            const { icon, label, qty } = survivalOfferRewardInfo(reward);
                            return (
                                <div key={index} className="flex items-center gap-2">
                                    {icon && (
                                        <div
                                            className="flex shrink-0 items-center justify-center"
                                            style={{
                                                height: SURVIVAL_REWARD_ICON_SIZE,
                                                width: SURVIVAL_REWARD_ICON_SIZE,
                                            }}>
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
    );
};
