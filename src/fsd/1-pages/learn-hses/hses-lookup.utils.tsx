/* eslint-disable import-x/no-internal-modules */
import { JSX } from 'react';

import { Alliance, Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import {
    BadgeImage,
    ForgeBadgeImage,
    MiscIcon,
    OrbIcon,
    resolveSimpleRewardIcon,
    tacticusIcons,
    UnknownItemImage,
} from '@/fsd/5-shared/ui/icons';
import { TIERED_REWARD_ICON_SIZE } from '@/fsd/5-shared/ui/tiered-reward-grid';

import { EquipmentService } from '@/fsd/4-entities/equipment';
import { EquipmentIcon } from '@/fsd/4-entities/equipment/ui';
import { getShopCurrencyIconKey, getShopCurrencyLabel, parseReward, plTier } from '@/fsd/4-entities/shops';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

export const REWARD_ICON_SIZE = TIERED_REWARD_ICON_SIZE;

const FACTION_LABEL_BY_SHARD_TYPE: Record<string, string> = {
    All: 'Any Faction',
    Imperial: 'Imperial',
    Chaos: 'Chaos',
    BloodAngels: 'Blood Angels',
    Orks: 'Orks',
};

const SUMMONING_TOKEN_ICON_BY_FACTION: Record<string, keyof typeof tacticusIcons> = {
    BloodAngels: 'bloodAngelsReq',
    Orks: 'orksReq',
};

const OFFER_TITLE_BY_KIND: Record<string, string> = {
    bundle: 'Bundle',
    playmore: 'Play More',
    booster: 'Booster',
};

/** Offer JSON has no human-readable title — derive one from the offerId's trailing "kind" segment. */
export function hseOfferTitle(offerId: string): string {
    const kind = offerId.split('_').at(-1) ?? offerId;
    return OFFER_TITLE_BY_KIND[kind] ?? kind;
}

/** Maps `plTier`'s 'medium' to the 'mid' tier key used by the HSE JSON data. */
export function hseTierKeyForRoster(pl: number, hasBlueStarUnit: boolean): 'high' | 'mid' | 'low' {
    const tier = plTier(pl, hasBlueStarUnit);
    return tier === 'medium' ? 'mid' : tier;
}

export function hseRewardInfo(chestRewardId: string): {
    icon: JSX.Element;
    label: string;
    qty: number;
    resolved: boolean;
} {
    const { type, qty } = parseReward(chestRewardId);

    // ── faction shards: Shards{Faction} ──────────────────────────────────────
    const shardsMatch = /^Shards(All|Imperial|Chaos|BloodAngels|Orks)$/.exec(type);
    if (shardsMatch) {
        const faction = FACTION_LABEL_BY_SHARD_TYPE[shardsMatch[1]] ?? shardsMatch[1];
        return {
            icon: <MiscIcon icon="shard" width={REWARD_ICON_SIZE} height={REWARD_ICON_SIZE} />,
            label: `${faction} Shards`,
            qty,
            resolved: true,
        };
    }

    // ── event/seasonal currencies (any registered cost.type) ────────────────
    const currencyIconKey = getShopCurrencyIconKey(type);
    if (currencyIconKey) {
        return {
            icon: <MiscIcon icon={currencyIconKey} width={REWARD_ICON_SIZE} height={REWARD_ICON_SIZE} />,
            label: getShopCurrencyLabel(type),
            qty,
            resolved: true,
        };
    }

    // ── event summoning tokens: eventSummoningToken_{Faction} ────────────────
    if (type.startsWith('eventSummoningToken_')) {
        const faction = type.replace('eventSummoningToken_', '');
        const iconKey = SUMMONING_TOKEN_ICON_BY_FACTION[faction];
        if (iconKey) {
            return {
                icon: <MiscIcon icon={iconKey} width={REWARD_ICON_SIZE} height={REWARD_ICON_SIZE} />,
                label: `${faction} Req Scroll`,
                qty,
                resolved: true,
            };
        }
    }

    // ── simple named resources (shared across Shop Events, product calendar, HSEs) ─
    const simple = resolveSimpleRewardIcon(type);
    if (simple) {
        return {
            icon: <MiscIcon icon={simple.iconKey} width={REWARD_ICON_SIZE} height={REWARD_ICON_SIZE} />,
            label: simple.label,
            qty,
            resolved: true,
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
            resolved: true,
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
            resolved: true,
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
            resolved: true,
        };
    }

    // ── generic rarity-only items: items{Rarity} / itemsChaos{Rarity} ────────
    const itemsMatch = /^items(?:Chaos)?(Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (itemsMatch) {
        const rarity = itemsMatch[1];
        return {
            icon: <UnknownItemImage rarity={rarity} size={REWARD_ICON_SIZE} />,
            label: `${rarity} Item`,
            qty,
            resolved: true,
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
                resolved: true,
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
                resolved: true,
            };
        }
    }

    // ── fallback ──────────────────────────────────────────────────────────────
    return {
        icon: <span className="text-center text-[10px] leading-tight break-all text-(--soft-fg)">{type}</span>,
        label: type,
        qty,
        resolved: false,
    };
}

/**
 * Resolves a reward from an offer's `rewards[]` list (same `type:qty` string format as
 * `chestRewardId`). Event-points rewards (`tieredRewardPoints_{event}_tier_{tier}` and the
 * "pick which sub-event to credit" variant `draft_HSE_{event}_tier_{tier}`) are shown as plain
 * text ("100x Event Points") with no icon; everything else is resolved via `hseRewardInfo`.
 */
export function hseOfferRewardInfo(rewardString: string): {
    icon?: JSX.Element;
    label: string;
    qty: number;
    resolved: boolean;
} {
    const { type, qty } = parseReward(rewardString);
    if (type.startsWith('tieredRewardPoints_') || type.startsWith('draft_HSE_')) {
        return { label: 'Event Points', qty, resolved: true };
    }
    return hseRewardInfo(rewardString);
}
