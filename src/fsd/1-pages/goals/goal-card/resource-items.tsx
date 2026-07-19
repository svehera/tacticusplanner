import { numberToThousandsString } from '@/fsd/5-shared/lib';
import { Alliance, Rarity } from '@/fsd/5-shared/model';
import { BadgeImage, ComponentImage, ForgeBadgeImage, MiscIcon, OrbIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignImage } from '@/fsd/4-entities/campaign';

import { IGoalEstimate } from '@/fsd/3-features/goals';

import { ResourceCostItem } from './resource-cost-row';

/**
 * Ascension orb chips (one per rarity in stock demand) plus an onslaught-token chip when the goal
 * consumes tokens. Shared by the Ascend card body and the goals table's Orbs cell.
 */
export const buildOrbItems = (
    goalEstimate: IGoalEstimate,
    fallbackAlliance: Alliance,
    includeTokens = true
): ResourceCostItem[] => {
    const orbAlliance = goalEstimate.orbsEstimate?.alliance ?? fallbackAlliance;
    const items: ResourceCostItem[] = Object.entries(goalEstimate.orbsEstimate?.orbs ?? {})
        .filter(([, count]) => count > 0)
        .map(([rarity, count]) => ({
            key: `orb-${rarity}`,
            icon: <OrbIcon alliance={orbAlliance} rarity={Number(rarity) as Rarity} size={20} />,
            label: `×${count}`,
            tooltip: `${Rarity[Number(rarity) as Rarity]} ascension orb`,
        }));
    if (includeTokens && goalEstimate.oTokensTotal) {
        items.push({
            key: 'onslaught',
            icon: <CampaignImage campaign="Onslaught" size={20} />,
            label: `×${goalEstimate.oTokensTotal}`,
            tooltip: 'Onslaught tokens',
        });
    }
    return items;
};

/**
 * MoW material chips: ability badges, forge badges, components, and gold. Shared by the MoW
 * abilities card body and the goals table's cost cell.
 */
export const buildMowCostItems = (
    mow: IGoalEstimate['mowEstimate'],
    alliance: Alliance,
    includeGold = true
): ResourceCostItem[] => {
    if (!mow) return [];
    const items: ResourceCostItem[] = [];
    for (const [rarity, count] of Object.entries(mow.badges)) {
        if (count > 0)
            items.push({
                key: `badge-${rarity}`,
                icon: (
                    <BadgeImage
                        alliance={alliance}
                        rarity={Number(rarity) as Rarity}
                        size="small"
                        className="h-5 w-auto"
                    />
                ),
                label: `×${count}`,
                tooltip: `${Rarity[Number(rarity) as Rarity]} ability badge`,
            });
    }
    for (const [rarity, count] of Object.entries(mow.forgeBadges)) {
        if (count > 0)
            items.push({
                key: `forge-${rarity}`,
                icon: (
                    <span className="inline-flex [&>img]:h-5 [&>img]:w-auto">
                        <ForgeBadgeImage rarity={Number(rarity) as Rarity} size="small" />
                    </span>
                ),
                label: `×${count}`,
                tooltip: `${Rarity[Number(rarity) as Rarity]} forge badge`,
            });
    }
    if (mow.components > 0)
        items.push({
            key: 'component',
            icon: (
                <span className="inline-flex [&>img]:h-5 [&>img]:w-auto">
                    <ComponentImage alliance={alliance} size="small" />
                </span>
            ),
            label: `×${mow.components}`,
            tooltip: 'MoW Component',
        });
    if (includeGold && mow.gold > 0)
        items.push({
            key: 'gold',
            icon: <MiscIcon icon="coin" width={20} height={20} />,
            label: numberToThousandsString(mow.gold),
            tooltip: 'Coins',
        });
    return items;
};

/**
 * Character-ability material chips: ability badges and gold. Shared by the Character abilities card
 * body and the goals table's cost cell.
 */
export const buildAbilityCostItems = (
    abilities: IGoalEstimate['abilitiesEstimate'],
    includeGold = true
): ResourceCostItem[] => {
    if (!abilities) return [];
    const items: ResourceCostItem[] = [];
    for (const [rarity, count] of Object.entries(abilities.badges)) {
        if (count > 0)
            items.push({
                key: `badge-${rarity}`,
                icon: (
                    <BadgeImage
                        alliance={abilities.alliance}
                        rarity={Number(rarity) as Rarity}
                        size="small"
                        className="h-5 w-auto"
                    />
                ),
                label: `×${count}`,
                tooltip: `${Rarity[Number(rarity) as Rarity]} ability badge`,
            });
    }
    if (includeGold && abilities.gold > 0)
        items.push({
            key: 'gold',
            icon: <MiscIcon icon="coin" width={20} height={20} />,
            label: numberToThousandsString(abilities.gold),
            tooltip: 'Coins',
        });
    return items;
};
