/* eslint-disable import-x/no-internal-modules */
import { JSX } from 'react';

import { Alliance, Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { BadgeImage, ForgeBadgeImage, MiscIcon, OrbIcon, resolveSimpleRewardIcon } from '@/fsd/5-shared/ui/icons';

import { EquipmentService } from '@/fsd/4-entities/equipment';
import { EquipmentIcon } from '@/fsd/4-entities/equipment/ui';
import { getShopCurrencyIconKey, getShopCurrencyLabel, parseReward, plTier } from '@/fsd/4-entities/shops';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

export const REWARD_ICON_SIZE = 40;

const FACTION_LABEL_BY_SHARD_TYPE: Record<string, string> = {
    All: 'Any Faction',
    Imperial: 'Imperial',
    Chaos: 'Chaos',
    BloodAngels: 'Blood Angels',
    Orks: 'Orks',
};

/** Maps `plTier`'s 'medium' to the 'mid' tier key used by the HSE JSON data. */
export function hseTierKeyForRoster(pl: number, hasBlueStarUnit: boolean): 'high' | 'mid' | 'low' {
    const tier = plTier(pl, hasBlueStarUnit);
    return tier === 'medium' ? 'mid' : tier;
}

export function hseRewardInfo(chestRewardId: string): { icon: JSX.Element; label: string; qty: number } {
    const { type, qty } = parseReward(chestRewardId);

    // ── faction shards: Shards{Faction} ──────────────────────────────────────
    const shardsMatch = /^Shards(All|Imperial|Chaos|BloodAngels|Orks)$/.exec(type);
    if (shardsMatch) {
        const faction = FACTION_LABEL_BY_SHARD_TYPE[shardsMatch[1]] ?? shardsMatch[1];
        return {
            icon: <MiscIcon icon="shard" width={REWARD_ICON_SIZE} height={REWARD_ICON_SIZE} />,
            label: `${faction} Shards`,
            qty,
        };
    }

    // ── event/seasonal currencies (any registered cost.type) ────────────────
    const currencyIconKey = getShopCurrencyIconKey(type);
    if (currencyIconKey) {
        return {
            icon: <MiscIcon icon={currencyIconKey} width={REWARD_ICON_SIZE} height={REWARD_ICON_SIZE} />,
            label: getShopCurrencyLabel(type),
            qty,
        };
    }

    // ── simple named resources (shared across Shop Events, product calendar, HSEs) ─
    const simple = resolveSimpleRewardIcon(type);
    if (simple) {
        return {
            icon: <MiscIcon icon={simple.iconKey} width={REWARD_ICON_SIZE} height={REWARD_ICON_SIZE} />,
            label: simple.label,
            qty,
        };
    }

    // ── ability badges: abilityToken{Rarity}_{Alliance} ──────────────────────
    const badgeMatch = /^abilityToken(Common|Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Xenos|Chaos)$/.exec(type);
    if (badgeMatch) {
        const rarity = badgeMatch[1] as RarityString;
        const alliance = badgeMatch[2] as Alliance;
        return {
            icon: <BadgeImage alliance={alliance} rarity={rarity} size="medium" />,
            label: `${rarity} ${alliance} Badge`,
            qty,
        };
    }

    // ── ascension orbs: heroAscensionOrb{Rarity}_{Alliance} ──────────────────
    const orbMatch = /^heroAscensionOrb(Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Xenos|Chaos)$/.exec(type);
    if (orbMatch) {
        const rarity = RarityMapper.stringToNumber[orbMatch[1] as RarityString];
        const alliance = orbMatch[2] as Alliance;
        return {
            icon: <OrbIcon alliance={alliance} rarity={rarity} size={REWARD_ICON_SIZE} />,
            label: `${orbMatch[1]} ${alliance} Orb`,
            qty,
        };
    }

    // ── forge badges: itemAscensionResource_{Rarity} ─────────────────────────
    const forgeMatch = /^itemAscensionResource_(Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (forgeMatch) {
        const rarity = RarityMapper.stringToNumber[forgeMatch[1] as RarityString];
        return {
            icon: <ForgeBadgeImage rarity={rarity} />,
            label: `${forgeMatch[1]} Forge Badge`,
            qty,
        };
    }

    // ── upgrade materials: upg* ───────────────────────────────────────────────
    if (type.startsWith('upg')) {
        const upgradeData = UpgradesService.recipeExpandedUpgradeData[type];
        if (upgradeData) {
            return {
                icon: (
                    <UpgradeImage
                        material={upgradeData.label}
                        iconPath={upgradeData.iconPath}
                        rarity={RarityMapper.rarityToRarityString(upgradeData.rarity as Rarity)}
                        size={REWARD_ICON_SIZE}
                    />
                ),
                label: upgradeData.label,
                qty,
            };
        }
    }

    // ── equipment / relics: I_* or R_* ───────────────────────────────────────
    if (type.startsWith('I_') || type.startsWith('R_')) {
        const equip = EquipmentService.equipmentData.find(item => item.id === type);
        if (equip) {
            return {
                icon: <EquipmentIcon equipment={equip} height={REWARD_ICON_SIZE} width={REWARD_ICON_SIZE} />,
                label: equip.name,
                qty,
            };
        }
    }

    // ── fallback ──────────────────────────────────────────────────────────────
    return {
        icon: <span className="text-center text-[10px] leading-tight break-all text-(--soft-fg)">{type}</span>,
        label: type,
        qty,
    };
}
