import { JSX } from 'react';

import { Alliance } from '@/fsd/5-shared/model';

import { rewardInfo } from '@/fsd/3-features/shop-rewards';

const ALL_ALLIANCES = [Alliance.Imperial, Alliance.Xenos, Alliance.Chaos];

/** Whether `type` (the part of a reward string before `:qty`) is a "pick an alliance" draft reward. */
export function isDraftRewardType(type: string): boolean {
    return type.startsWith('draft_');
}

/**
 * Resolves a draft reward type + a chosen alliance to the real, alliance-specific reward type.
 *
 * Badges and orbs already have real alliance-suffixed reward strings elsewhere in the game's data
 * (`abilityToken{Rarity}_{Alliance}`, `heroAscensionOrb{Rarity}_{Alliance}`), so those are reused
 * directly. MoW components have no such string anywhere — the shop only ever offers the generic
 * `draft_machinesOfWarTokens` — so `mowComponent_{Alliance}` is an internal-only type invented here
 * purely for cart-bucketing/coverage-row purposes; it never appears in real shop data.
 */
export function resolveDraftAllianceType(draftType: string, alliance: Alliance): string | undefined {
    const badgeMatch = /^draft_abilityTokens(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(draftType);
    if (badgeMatch) {
        return `abilityToken${badgeMatch[1]}_${alliance}`;
    }
    const orbMatch = /^draft_ascensionOrbs(Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(draftType);
    if (orbMatch) {
        return `heroAscensionOrb${orbMatch[1]}_${alliance}`;
    }
    if (draftType === 'draft_machinesOfWarTokens') {
        return `mowComponent_${alliance}`;
    }
    return undefined;
}

/** The 3 alliance-specific choices for a draft reward, with their real icon/label. `undefined` for a non-draft type. */
export function getDraftAllianceOptions(
    draftType: string
): Array<{ alliance: Alliance; icon: JSX.Element; label: string }> | undefined {
    if (!isDraftRewardType(draftType)) return undefined;

    const options = ALL_ALLIANCES.map(alliance => {
        const resolvedType = resolveDraftAllianceType(draftType, alliance);
        if (!resolvedType) return;
        const { icon, label } = rewardInfo(resolvedType);
        return { alliance, icon, label };
    }).filter((option): option is { alliance: Alliance; icon: JSX.Element; label: string } => option !== undefined);

    return options.length > 0 ? options : undefined;
}
