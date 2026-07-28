import { JSX } from 'react';

import { Alliance, Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';
import {
    BadgeImage,
    ForgeBadgeImage,
    MiscIcon,
    OrbIcon,
    resolveSimpleRewardIcon,
    tacticusIcons,
    UnitShardIcon,
    UnknownItemImage,
} from '@/fsd/5-shared/ui/icons';
import { TIERED_REWARD_ICON_SIZE } from '@/fsd/5-shared/ui/tiered-reward-grid';

import { CharactersService } from '@/fsd/4-entities/character/@x/survival';
import { EquipmentIcon, EquipmentService } from '@/fsd/4-entities/equipment/@x/survival';
import { INpcData, INpcStats, NpcService } from '@/fsd/4-entities/npc/@x/survival';
import { getShopCurrencyIconKey, getShopCurrencyLabel, parseReward } from '@/fsd/4-entities/shops/@x/survival';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade/@x/survival';

import type { ISurvivalEvent } from './model';

export const SURVIVAL_REWARD_ICON_SIZE = TIERED_REWARD_ICON_SIZE;

const GENERIC_POWUP_ICON_KEY: Record<string, keyof typeof tacticusIcons> = {
    powupArmor: 'powupArmor',
    powupBomb: 'powupBomb',
    powupDamage: 'powupDamage',
    powupHealing: 'powupHealing',
    powupHealth: 'powupHealth',
    powupHits: 'powupHits',
    powupMeleeHits: 'powupMeleeHits',
    powupReactivateAbility: 'powupReactivateAbility',
    powupReinforcement: 'powupReinforcement',
    powupReinforcementShield: 'powupReinforcementShield',
    powupResurrect: 'powupResurrect',
};

/**
 * Same id:qty split as `parseReward`, but keeps a `min-max` quantity range (e.g. `gold:600-660`) as
 * a string instead of collapsing it down to the minimum via `parseInt`.
 */
function parseRewardQtyRange(rewardId: string): number | string {
    const colonIndex = rewardId.indexOf(':');
    if (colonIndex === -1) return 1;
    const qtyPart = rewardId.slice(colonIndex + 1);
    return qtyPart.includes('-') ? qtyPart : Number.parseInt(qtyPart, 10);
}

/** Human-friendly title for the theme string (e.g. "may_2026" -> "May 2026"). */
function humanizeTheme(theme: string): string {
    return theme
        .split('_')
        .map(part => (/^\d+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join(' ');
}

/** Dropdown label for a survival event: "<theme> — <featured hero name>". */
export function getSurvivalDisplayName(event: ISurvivalEvent): string {
    return `${humanizeTheme(event.theme)} — ${event.featuredHero.name}`;
}

/** Dropdown icon for a survival event: the featured hero's round portrait. */
export function getSurvivalDisplayIconUrl(event: ISurvivalEvent): string {
    const character = CharactersService.resolveCharacter(event.featuredHero.id);
    return getImageUrl(character?.roundIcon ?? '');
}

/**
 * Resolves a survival reward/chest-reward id to an icon + label + qty. Same resolution chain as
 * `hses-lookup.utils.tsx`'s `hseRewardInfo` (duplicated rather than shared, matching this codebase's
 * convention of small per-feature reward resolvers), plus hero-shard handling for chest rewards like
 * `shards_astarCyrus`.
 */
export function survivalRewardInfo(rewardId: string): {
    icon: JSX.Element;
    label: string;
    qty: number | string;
    resolved: boolean;
} {
    const { type } = parseReward(rewardId);
    const qty = parseRewardQtyRange(rewardId);

    // ── character shards: shards_{unitId} / mythicShards_{unitId} ───────────
    if (type.startsWith('shards_') || type.startsWith('mythicShards_')) {
        const isMythic = type.startsWith('mythicShards_');
        const unitId = type.replace(isMythic ? 'mythicShards_' : 'shards_', '');
        const character = CharactersService.charactersBySnowprintId[unitId];
        return {
            icon: character ? (
                <UnitShardIcon
                    icon={character.roundIcon}
                    name={character.name}
                    mythic={isMythic}
                    height={SURVIVAL_REWARD_ICON_SIZE}
                    width={SURVIVAL_REWARD_ICON_SIZE}
                />
            ) : (
                <MiscIcon
                    icon={isMythic ? 'mythicShard' : 'shard'}
                    width={SURVIVAL_REWARD_ICON_SIZE}
                    height={SURVIVAL_REWARD_ICON_SIZE}
                />
            ),
            label: character
                ? `${character.name} ${isMythic ? 'Mythic Shards' : 'Shards'}`
                : isMythic
                  ? 'Mythic Shards'
                  : 'Shards',
            qty,
            resolved: true,
        };
    }

    // ── event/seasonal currencies (any registered cost.type) ────────────────
    const currencyIconKey = getShopCurrencyIconKey(type);
    if (currencyIconKey) {
        return {
            icon: (
                <MiscIcon icon={currencyIconKey} width={SURVIVAL_REWARD_ICON_SIZE} height={SURVIVAL_REWARD_ICON_SIZE} />
            ),
            label: getShopCurrencyLabel(type),
            qty,
            resolved: true,
        };
    }

    // ── simple named resources (shared across Shop Events, product calendar, HSEs) ─
    const simple = resolveSimpleRewardIcon(type);
    if (simple) {
        return {
            icon: (
                <MiscIcon icon={simple.iconKey} width={SURVIVAL_REWARD_ICON_SIZE} height={SURVIVAL_REWARD_ICON_SIZE} />
            ),
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
            icon: <OrbIcon alliance={alliance} rarity={rarity} size={SURVIVAL_REWARD_ICON_SIZE} />,
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
            icon: <UnknownItemImage rarity={rarity} size={SURVIVAL_REWARD_ICON_SIZE} />,
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
                        size={SURVIVAL_REWARD_ICON_SIZE}
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
                icon: (
                    <EquipmentIcon
                        equipment={equip}
                        height={SURVIVAL_REWARD_ICON_SIZE}
                        width={SURVIVAL_REWARD_ICON_SIZE}
                    />
                ),
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
 * Resolves a wave power-up id (e.g. `powupHealing`, `powupSummonSpawn_darkaSmnTerminator:1`) to an
 * icon + label + qty. Only the summon-spawn variants carry a `:qty` suffix in practice.
 */
export function survivalPowupInfo(rawPowupId: string): {
    icon: JSX.Element;
    label: string;
    qty: number;
    resolved: boolean;
} {
    const { type: powupId, qty } = parseReward(rawPowupId);

    if (powupId.startsWith('powupSummonSpawn_')) {
        const npc = NpcService.getNpcById(powupId);
        if (npc) {
            return {
                icon: <img src={getImageUrl(npc.icon)} className="size-full object-contain" alt={npc.name} />,
                label: npc.name,
                qty,
                resolved: true,
            };
        }
    }

    const iconKey = GENERIC_POWUP_ICON_KEY[powupId];
    if (iconKey) {
        return {
            icon: <MiscIcon icon={iconKey} width={SURVIVAL_REWARD_ICON_SIZE} height={SURVIVAL_REWARD_ICON_SIZE} />,
            label: tacticusIcons[iconKey].label,
            qty,
            resolved: true,
        };
    }

    return {
        icon: <span className="text-center text-[10px] leading-tight break-all text-(--soft-fg)">{powupId}</span>,
        label: powupId,
        qty,
        resolved: false,
    };
}

const OFFER_TITLE_BY_KIND: Record<string, string> = {
    pass: 'Season Pass',
    playmore: 'Play More',
    bundle: 'Bundle',
    booster: 'Booster',
};

/** Offer JSON has no human-readable title — derive one from the offerId's trailing "kind" segment. */
export function survivalOfferTitle(offerId: string): string {
    const kind = offerId.split('_').at(-1) ?? offerId;
    return OFFER_TITLE_BY_KIND[kind] ?? kind;
}

/**
 * Resolves a reward from an offer's `rewards[]` list. Event-currency-percentage/premium-track
 * unlock rewards have no meaningful icon, so they're shown as plain text; everything else is
 * resolved via `survivalRewardInfo`.
 */
export function survivalOfferRewardInfo(rewardString: string): {
    icon?: JSX.Element;
    label: string;
    qty: number | string;
    resolved: boolean;
} {
    const { type } = parseReward(rewardString);
    const qty = parseRewardQtyRange(rewardString);
    if (type === 'seasonalEcBonus') {
        return { label: `+${qty}% Event Currency`, qty, resolved: true };
    }
    if (type === 'seasonalPremium') {
        return { label: 'Premium Track', qty, resolved: true };
    }
    return survivalRewardInfo(rewardString);
}

/**
 * Resolves a wave army entry (`snowprintId:N`) to its NPC data + stats + rarity. The `:N` suffix is
 * a 1-based index into the NPC's `stats` progression array (same convention as guild-boss encounter
 * unit ids — see `encounterStatsIndex` in `4-entities/guild_boss`), not an ability level.
 */
export function resolveSurvivalEnemyNpc(
    rawEnemyId: string
): { npc: INpcData; stats: INpcStats; rarity: Rarity } | undefined {
    const [snowprintId, indexString] = rawEnemyId.split(':');
    const npc = NpcService.getNpcById(snowprintId);
    if (!npc || npc.stats.length === 0) return undefined;

    const oneBasedIndex = Number.parseInt(indexString ?? '1', 10);
    const index = Math.max(0, Math.min(oneBasedIndex - 1, npc.stats.length - 1));
    const stats = npc.stats[index];
    return { npc, stats, rarity: NpcService.resolveRarityFromStars(stats.rarityStars) };
}
