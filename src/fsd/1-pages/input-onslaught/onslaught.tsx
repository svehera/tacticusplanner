/* eslint-disable import-x/no-internal-modules */
import React, { useCallback, useContext } from 'react';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import { Alliance, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';
import { OnslaughtTierSelect } from '@/fsd/5-shared/ui/selects';

import {
    type IAllianceOnslaughtPrefs,
    type OnslaughtSector,
    type OnslaughtTier,
    ONSLAUGHT_REWARDS,
    ONSLAUGHT_SECTOR_LABELS,
    ONSLAUGHT_SECTORS,
    ONSLAUGHT_TIERS,
} from './onslaught-rewards';

const ALLIANCE_LABELS: Record<Alliance, string> = {
    [Alliance.Imperial]: 'Imperial',
    [Alliance.Xenos]: 'Xenos',
    [Alliance.Chaos]: 'Chaos',
};

const REWARD_ROWS: Array<{ rarity: Rarity; stars: RarityStars }> = [
    { rarity: Rarity.Common, stars: RarityStars.None },
    { rarity: Rarity.Common, stars: RarityStars.OneStar },
    { rarity: Rarity.Common, stars: RarityStars.TwoStars },
    { rarity: Rarity.Uncommon, stars: RarityStars.TwoStars },
    { rarity: Rarity.Uncommon, stars: RarityStars.ThreeStars },
    { rarity: Rarity.Uncommon, stars: RarityStars.FourStars },
    { rarity: Rarity.Rare, stars: RarityStars.FourStars },
    { rarity: Rarity.Rare, stars: RarityStars.FiveStars },
    { rarity: Rarity.Rare, stars: RarityStars.RedOneStar },
    { rarity: Rarity.Epic, stars: RarityStars.RedOneStar },
    { rarity: Rarity.Epic, stars: RarityStars.RedTwoStars },
    { rarity: Rarity.Epic, stars: RarityStars.RedThreeStars },
    { rarity: Rarity.Legendary, stars: RarityStars.RedThreeStars },
    { rarity: Rarity.Legendary, stars: RarityStars.RedFourStars },
    { rarity: Rarity.Legendary, stars: RarityStars.RedFiveStars },
    { rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar },
    { rarity: Rarity.Mythic, stars: RarityStars.OneBlueStar },
    { rarity: Rarity.Mythic, stars: RarityStars.TwoBlueStars },
    { rarity: Rarity.Mythic, stars: RarityStars.ThreeBlueStars },
    { rarity: Rarity.Mythic, stars: RarityStars.MythicWings },
];

interface AllianceSelectorProps {
    alliance: Alliance;
    prefs: IAllianceOnslaughtPrefs;
    onUpdate: (alliance: Alliance, sector: OnslaughtSector, tier: OnslaughtTier) => void;
}

const AllianceSelector: React.FC<AllianceSelectorProps> = ({ alliance, prefs, onUpdate }) => (
    <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">{ALLIANCE_LABELS[alliance]}</h3>
        <OnslaughtTierSelect
            label=""
            sector={prefs.sector}
            tier={prefs.tier}
            onChange={(sector, tier) => onUpdate(alliance, sector, tier)}
        />
    </div>
);

export const Onslaught: React.FC = () => {
    const { onslaughtPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const handleUpdate = useCallback(
        (alliance: Alliance, sector: OnslaughtSector, tier: OnslaughtTier) => {
            dispatch.onslaughtPreferences({ type: 'UpdateAlliance', alliance, sector, tier });
        },
        [dispatch]
    );

    return (
        <div className="flex flex-col gap-6 p-4">
            <h2 className="text-xl font-bold">Onslaught Preferences</h2>
            <p className="text-sm text-gray-500">
                Set your current sector and tier for each alliance. These values are used to estimate shards earned per
                onslaught token when computing ascension goal timelines.
            </p>

            <div className="flex flex-wrap gap-6">
                {([Alliance.Imperial, Alliance.Xenos, Alliance.Chaos] as Alliance[]).map(alliance => (
                    <AllianceSelector
                        key={alliance}
                        alliance={alliance}
                        prefs={onslaughtPreferences[alliance]}
                        onUpdate={handleUpdate}
                    />
                ))}
            </div>

            <div className="mt-4">
                <h3 className="mb-2 text-base font-semibold">Shard Rewards Reference Table</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="border px-2 py-1 text-left">Sector / Tier</th>
                                <th className="w-px border px-2 py-1"></th>
                                {REWARD_ROWS.map(row => (
                                    <th key={`${row.rarity}-${row.stars}`} className="border px-2 py-1 text-center">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <RarityIcon rarity={row.rarity} />
                                            <StarsIcon stars={row.stars} />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ONSLAUGHT_SECTORS.flatMap(sector =>
                                ONSLAUGHT_TIERS.map(tier => {
                                    const effectiveTier = (tier === 3 ? [3, 4] : [tier]) as OnslaughtTier[];
                                    const activeAlliances = (
                                        [
                                            [Alliance.Imperial, 'imperialOnslaughtMarker'],
                                            [Alliance.Xenos, 'xenosOnslaughtMarker'],
                                            [Alliance.Chaos, 'chaosOnslaughtMarker'],
                                        ] as const
                                    ).filter(
                                        ([alliance]) =>
                                            onslaughtPreferences[alliance].sector === sector &&
                                            effectiveTier.includes(onslaughtPreferences[alliance].tier as OnslaughtTier)
                                    );
                                    return (
                                        <tr
                                            key={`${sector}-${tier}`}
                                            className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                                            <td className="border px-2 py-1 font-medium whitespace-nowrap">
                                                {ONSLAUGHT_SECTOR_LABELS[sector]} {tier}
                                            </td>
                                            <td className="w-px border px-1 py-1">
                                                <div className="flex items-center gap-0.5">
                                                    {activeAlliances.map(([, iconKey]) => {
                                                        const icon = snowprintIcons[iconKey];
                                                        return (
                                                            <img
                                                                key={iconKey}
                                                                src={icon.file}
                                                                alt={icon.label}
                                                                width={30}
                                                                height={30}
                                                                className="pointer-events-none"
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            {REWARD_ROWS.map(row => {
                                                const effectiveRewardTier = (tier === 4 ? 3 : tier) as 1 | 2 | 3;
                                                const { min, max, isMythic } =
                                                    ONSLAUGHT_REWARDS[sector][effectiveRewardTier][
                                                        row.rarity === Rarity.Mythic
                                                            ? 'mythicShards'
                                                            : row.rarity === Rarity.Legendary &&
                                                                row.stars >= RarityStars.OneBlueStar
                                                              ? 'legendaryBlue'
                                                              : row.rarity === Rarity.Legendary
                                                                ? 'legendary'
                                                                : row.rarity === Rarity.Epic
                                                                  ? 'epic'
                                                                  : row.rarity === Rarity.Rare
                                                                    ? 'rare'
                                                                    : row.rarity === Rarity.Uncommon
                                                                      ? 'uncommon'
                                                                      : 'common'
                                                    ];
                                                const label =
                                                    min === max
                                                        ? `${min}${isMythic ? 'M' : ''}`
                                                        : `${min}-${max}${isMythic ? 'M' : ''}`;
                                                return (
                                                    <td
                                                        key={`${row.rarity}-${row.stars}`}
                                                        className={`border px-2 py-1 text-center ${isMythic ? 'font-medium text-purple-600' : ''}`}>
                                                        {label}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
