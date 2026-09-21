import { numberToThousandsString } from '@/fsd/5-shared/lib';
import { Alliance, Rarity } from '@/fsd/5-shared/model';
import { BadgeImage, ComponentImage, ForgeBadgeImage, MiscIcon, OrbIcon } from '@/fsd/5-shared/ui/icons';

import { IGoalEstimate } from '@/fsd/3-features/goals';

import { ResourceCostItem } from './resource-cost-row';

/**
 * Chip label for a stocked resource. Once inventory adjustment has run, `remaining` holds only
 * what's still to farm and `required` the full requirement, so the label reads `have/required` —
 * otherwise (unadjusted estimate) it's a plain `×N`.
 */
const stockLabel = (required: number, remaining: number, adjusted: boolean): string =>
    adjusted ? `${required - remaining}/${required}` : `×${remaining}`;

const stockTooltip = (required: number, remaining: number, name: string, adjusted: boolean): string =>
    adjusted ? `${required - remaining} of ${required} ${name}s in stock` : name;

/**
 * Ascension orb chips, one per rarity in stock demand. Shared by the Ascend card body and the goals
 * table's Orbs cell. Onslaught tokens are an estimate chip, not a resource — see GoalEstimateChips.
 */
export const buildOrbItems = (goalEstimate: IGoalEstimate, fallbackAlliance: Alliance): ResourceCostItem[] => {
    const orbAlliance = goalEstimate.orbsEstimate?.alliance ?? fallbackAlliance;
    const orbsRequired = goalEstimate.orbsEstimate?.orbsRequired;
    const items: ResourceCostItem[] = [];
    for (const [rarityKey, remaining] of Object.entries(goalEstimate.orbsEstimate?.orbs ?? {})) {
        const rarity = Number(rarityKey) as Rarity;
        const required = orbsRequired?.[rarity] ?? remaining;
        if (required <= 0) continue;
        items.push({
            key: `orb-${rarity}`,
            icon: <OrbIcon alliance={orbAlliance} rarity={rarity} size={20} />,
            label: stockLabel(required, remaining, orbsRequired !== undefined),
            tooltip: stockTooltip(required, remaining, `${Rarity[rarity]} ascension orb`, orbsRequired !== undefined),
        });
    }
    return items;
};

/**
 * Badge chips for one alliance. Once inventory adjustment has run, `badges` holds only what's still
 * to farm and `badgesRequired` the full requirement, so the label reads `have/required` — otherwise
 * (unadjusted estimate) it's a plain `×N`.
 */
const buildBadgeItems = (
    badges: Record<Rarity, number>,
    badgesRequired: Record<Rarity, number> | undefined,
    alliance: Alliance
): ResourceCostItem[] => {
    const items: ResourceCostItem[] = [];
    for (const [rarityKey, remaining] of Object.entries(badges)) {
        const rarity = Number(rarityKey) as Rarity;
        const required = badgesRequired?.[rarity] ?? remaining;
        if (required <= 0) continue;
        const rarityName = Rarity[rarity];
        items.push({
            key: `badge-${rarity}`,
            icon: <BadgeImage alliance={alliance} rarity={rarity} size="small" className="h-5 w-auto" />,
            label: stockLabel(required, remaining, badgesRequired !== undefined),
            tooltip: stockTooltip(required, remaining, `${rarityName} ability badge`, badgesRequired !== undefined),
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
    const items = buildBadgeItems(mow.badges, mow.badgesRequired, alliance);
    for (const [rarityKey, remaining] of Object.entries(mow.forgeBadges)) {
        const rarity = Number(rarityKey) as Rarity;
        const required = mow.forgeBadgesRequired?.[rarity] ?? remaining;
        if (required <= 0) continue;
        items.push({
            key: `forge-${rarity}`,
            icon: (
                <span className="inline-flex [&>img]:h-5 [&>img]:w-auto">
                    <ForgeBadgeImage rarity={rarity} size="small" />
                </span>
            ),
            label: stockLabel(required, remaining, mow.forgeBadgesRequired !== undefined),
            tooltip: stockTooltip(
                required,
                remaining,
                `${Rarity[rarity]} forge badge`,
                mow.forgeBadgesRequired !== undefined
            ),
        });
    }
    const componentsRequired = mow.componentsRequired ?? mow.components;
    if (componentsRequired > 0)
        items.push({
            key: 'component',
            icon: (
                <span className="inline-flex [&>img]:h-5 [&>img]:w-auto">
                    <ComponentImage alliance={alliance} size="small" />
                </span>
            ),
            label: stockLabel(componentsRequired, mow.components, mow.componentsRequired !== undefined),
            tooltip: stockTooltip(
                componentsRequired,
                mow.components,
                'MoW Component',
                mow.componentsRequired !== undefined
            ),
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
    const items = buildBadgeItems(abilities.badges, abilities.badgesRequired, abilities.alliance);
    if (includeGold && abilities.gold > 0)
        items.push({
            key: 'gold',
            icon: <MiscIcon icon="coin" width={20} height={20} />,
            label: numberToThousandsString(abilities.gold),
            tooltip: 'Coins',
        });
    return items;
};
