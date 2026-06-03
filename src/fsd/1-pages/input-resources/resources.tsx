/* eslint-disable import-x/no-internal-modules */
import { JSX, useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { IDailyRaidsFarmOrder } from '@/models/interfaces';
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Alliance, Rarity, RarityMapper, useAuth } from '@/fsd/5-shared/model';
import { BadgeImage } from '@/fsd/5-shared/ui/icons/badge-image';
import { MiscIcon } from '@/fsd/5-shared/ui/icons/misc.icon';
import { OrbIcon } from '@/fsd/5-shared/ui/icons/orb.icon';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button/sync-button';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

import { XpUseState } from './models';

const MYTHIC_UNCRAFTABLE_UPGRADES = [
    {
        id: 'upgHpM001',
        material: 'Imperial Aquila',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM001.png',
    },
    {
        id: 'upgHpM002',
        material: 'Mutant Form',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM002.png',
    },
    {
        id: 'upgHpM003',
        material: 'Ancient Inscription',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM003.png',
    },
    {
        id: 'upgHpM004',
        material: 'Venerable Battle Mark',
        icon: 'snowprint_assets/upgrade_materials/ui_icon_upgrade_upgHpM004.png',
    },
] as const;

export const Resources = () => {
    const {
        inventory,
        xpUse,
        goals,
        characters: unresolvedCharacters,
        mows,
        campaignsProgress,
        dailyRaidsPreferences,
        dailyRaids,
        gameModeTokens,
    } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { userInfo } = useAuth();

    const [showNeed, setShowNeed] = useState(false);

    const characters = useMemo(
        () => CharactersService.resolveStoredCharacters(unresolvedCharacters),
        [unresolvedCharacters]
    );
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const units = useMemo(() => [...characters, ...resolvedMows], [characters, resolvedMows]);

    const { upgradeRankOrMowGoals, upgradeMaterialGoals, shardsGoals } = useMemo(
        () => GoalsService.prepareGoals(goals, units, false),
        [goals, units]
    );

    const onslaughtTokensToday = useMemo(
        () => UpgradesService.computeOnslaughtTokensToday(gameModeTokens),
        [gameModeTokens]
    );

    const neededByUpgradeId = useMemo<Record<string, number>>(() => {
        const est = UpgradesService.getUpgradesEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                campaignsProgress,
                // Force totalMaterials order so each upgrade ID appears exactly once
                preferences: {
                    ...dailyRaidsPreferences,
                    farmPreferences: {
                        ...dailyRaidsPreferences.farmPreferences,
                        order: IDailyRaidsFarmOrder.totalMaterials,
                    },
                },
                upgrades: inventory.upgrades,
                completedLocations: dailyRaids.raidedLocations,
                onslaughtTokensToday,
            },
            characters,
            resolvedMows,
            ...[upgradeMaterialGoals, upgradeRankOrMowGoals, shardsGoals].flat().filter(x => x.include)
        );

        const needed: Record<string, number> = {};
        for (const mat of [...est.inProgressMaterials, ...est.blockedMaterials, ...est.finishedMaterials]) {
            if (mat.id) needed[mat.id] = mat.requiredCount;
        }
        return needed;
    }, [
        dailyRaidsPreferences,
        campaignsProgress,
        inventory.upgrades,
        dailyRaids.raidedLocations,
        onslaughtTokensToday,
        characters,
        resolvedMows,
        upgradeMaterialGoals,
        upgradeRankOrMowGoals,
        shardsGoals,
    ]);

    const dispatchUpdate = (newState: XpUseState) => {
        dispatch.xpUse({
            type: 'Set',
            value: newState,
        });
    };

    const enabled: boolean[] = [
        xpUse.useCommon,
        xpUse.useUncommon,
        xpUse.useRare,
        xpUse.useEpic,
        xpUse.useLegendary,
        xpUse.useMythic,
    ];

    const getRarityIndex = (rarity: Rarity): number => rarities.indexOf(rarity);

    const newState = (rarity: Rarity): XpUseState => {
        const index = getRarityIndex(rarity);
        const updatedEnabled = [...enabled];
        updatedEnabled[index] = !updatedEnabled[index];

        return {
            useCommon: updatedEnabled[0],
            useUncommon: updatedEnabled[1],
            useRare: updatedEnabled[2],
            useEpic: updatedEnabled[3],
            useLegendary: updatedEnabled[4],
            useMythic: updatedEnabled[5],
        };
    };

    const toggleState = (rarity: Rarity) => dispatchUpdate(newState(rarity));

    const rarities: Rarity[] = [
        Rarity.Common,
        Rarity.Uncommon,
        Rarity.Rare,
        Rarity.Epic,
        Rarity.Legendary,
        Rarity.Mythic,
    ];

    const hasSync = !!userInfo.tacticusApiKey;

    const renderResourceItem = (
        key: string,
        icon: JSX.Element,
        quantity: number | string,
        onClick?: () => void, // Optional click handler
        isEnabled: boolean = true, // Optional enabled state (default true)
        clickTitle?: string
    ) => {
        const clickableClass = onClick ? 'cursor-pointer transition-all duration-150' : '';
        const hoverClass = onClick ? 'hover:scale-105 hover:bg-gray-700/50' : '';
        const disabledClass = isEnabled ? '' : 'grayscale opacity-40';
        const resolvedTitle = onClick ? (clickTitle ?? `Click to ${isEnabled ? 'disable' : 'enable'}`) : undefined;

        return (
            <div
                key={key}
                className={`flex min-w-[55px] flex-col items-center justify-start p-1 ${clickableClass} ${disabledClass} ${hoverClass}`}
                onClick={onClick}
                title={resolvedTitle}>
                <div className="flex h-[45px] w-[45px] items-center justify-center">{icon}</div>
                <span className="mt-1 text-sm font-semibold">{quantity}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-y-4 p-2">
            {hasSync && (
                <div className="flex justify-end border-b border-(--card-border) p-2">
                    <SyncButton showText={!isMobile} />
                </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col rounded-lg border border-(--card-border) bg-(--card) p-3 text-(--card-fg) shadow-lg">
                    <h4 className="text-md mb-2 border-b border-(--card-border) pb-2 font-bold tracking-wide text-(--card-fg) uppercase">
                        XP Books
                    </h4>
                    <div className="flex flex-wrap justify-start gap-x-1">
                        {rarities.map(rarity => {
                            const icon = RarityMapper.rarityToRarityString(rarity).toLowerCase() + 'Book';
                            const index = getRarityIndex(rarity);
                            const isEnabled = enabled[index];

                            return renderResourceItem(
                                'book-' + rarity,
                                <MiscIcon icon={icon} width={45} height={45} />,
                                inventory.xpBooks[rarity],
                                // Pass the click handler and enabled state only for XP Books
                                () => toggleState(rarity),
                                isEnabled
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col rounded-lg border border-(--card-border) bg-(--card) p-3 text-(--card-fg) shadow-lg">
                    <h4 className="text-md mb-2 border-b border-(--card-border) pb-2 font-bold tracking-wide text-(--card-fg) uppercase">
                        Forge Badges
                    </h4>
                    <div className="flex flex-wrap justify-start gap-x-1">
                        {rarities.map(rarity => {
                            if (rarity === Rarity.Common) return; // Skip Common Forge Badges
                            const quantity = inventory.forgeBadges[rarity] || 0;
                            const icon = RarityMapper.rarityToRarityString(rarity).toLowerCase() + 'ForgeBadge';
                            return renderResourceItem(
                                'forge-' + rarity,
                                <MiscIcon icon={icon} width={45} height={45} />,
                                quantity
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col rounded-lg border border-(--card-border) bg-(--card) p-3 text-(--card-fg) shadow-lg">
                    <h4 className="text-md mb-2 border-b border-(--card-border) pb-2 font-bold tracking-wide text-(--card-fg) uppercase">
                        Machine of War Components
                    </h4>
                    <div className="flex flex-wrap justify-start gap-x-1">
                        {Object.entries(inventory.components).map(([alliance, quantity]) => {
                            return renderResourceItem(
                                'component-' + alliance,
                                <MiscIcon icon={alliance.toLowerCase() + 'Component'} width={45} height={45} />,
                                quantity as number
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col rounded-lg border border-(--card-border) bg-(--card) p-3 text-(--card-fg) shadow-lg">
                    <h4 className="text-md mb-2 border-b border-(--card-border) pb-2 font-bold tracking-wide text-(--card-fg) uppercase">
                        Mythic Upgrade Materials
                    </h4>
                    <div className="flex flex-wrap justify-start gap-x-1">
                        {MYTHIC_UNCRAFTABLE_UPGRADES.map(upg => {
                            const have = inventory.upgrades[upg.id] ?? 0;
                            const need = neededByUpgradeId[upg.id] ?? 0;
                            const label = showNeed ? `${have}/${need}` : have;
                            return renderResourceItem(
                                'mythic-upg-' + upg.id,
                                <UpgradeImage
                                    material={upg.material}
                                    iconPath={upg.icon}
                                    rarity={RarityMapper.rarityToRarityString(Rarity.Mythic)}
                                    size={45}
                                />,
                                label,
                                () => setShowNeed(previous => !previous),
                                true,
                                showNeed ? 'Click to show quantity only' : 'Click to show have/need'
                            );
                        })}
                    </div>
                </div>
            </div>{' '}
            <div className="mt-4 flex flex-col rounded-lg border border-(--card-border) bg-(--card) p-3 text-(--card-fg) shadow-lg">
                <h3 className="mb-3 border-b border-(--card-border) pb-2 text-lg font-bold tracking-wider text-(--card-fg) uppercase">
                    Alliance Resources
                </h3>

                <div className="flex flex-col divide-y divide-gray-700">
                    {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                        <div key={alliance} className="py-3">
                            <h4 className="mb-2 text-sm font-semibold text-(--card-fg) uppercase">{alliance}</h4>

                            <div className="grid grid-cols-2 gap-x-4">
                                <div className="flex flex-wrap justify-start">
                                    {rarities.map(rarity => {
                                        const quantity = inventory.abilityBadges[alliance][rarity as number as Rarity];
                                        return renderResourceItem(
                                            alliance + '-badge-' + rarity,
                                            <BadgeImage alliance={alliance} rarity={rarity} />,
                                            quantity
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap justify-start">
                                    {rarities.map(rarity => {
                                        if (rarity === Rarity.Common) return; // Skip Common Orbs
                                        const quantity = inventory.orbs[alliance][rarity as number as Rarity];
                                        return renderResourceItem(
                                            alliance + '-orb-' + rarity,
                                            <OrbIcon alliance={alliance} rarity={rarity} size={45} />,
                                            quantity
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
