import { JSX } from 'react';

import { Alliance, Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import {
    BadgeImage,
    ForgeBadgeImage,
    MiscIcon,
    OrbIcon,
    resolveSimpleRewardIcon,
    UnitShardIcon,
} from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentIcon, EquipmentService, EquipmentTypeRarityIcon } from '@/fsd/4-entities/equipment';
import { MowsService } from '@/fsd/4-entities/mow';
import { getShopCurrencyIconKey, getShopCurrencyLabel } from '@/fsd/4-entities/shops';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

const DEFAULT_ICON_SIZE = 45;

/** Readable labels for the generic equipment "type" reward pools (`items{Rarity}_{Type}`). */
const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
    I_Crit: 'Critical Chance Item',
    I_Block: 'Block Item',
    I_Defensive: 'Defensive Item',
    I_Booster_Crit: 'Critical Booster Item',
    I_Booster_Block: 'Block Booster Item',
};

/**
 * Resolves a reward `type:qty` string to an icon + label + qty, covering every reward vocabulary
 * used across Shop Events, the product calendar, and the daily shops (War/Guild/Crusade/Rogue
 * Trader): character shards, shop-event currencies, simple named resources, ability badges,
 * ascension orbs, forge badges, upgrade materials, and equipment/relics.
 */
export function rewardInfo(
    reward: string,
    iconSize: number = DEFAULT_ICON_SIZE
): { icon: JSX.Element; label: string; qty: number | undefined } {
    const [type, qtyString] = reward.split(':');
    const qty = qtyString === undefined ? undefined : Number.parseInt(qtyString, 10);

    // ── character shards ──────────────────────────────────────────────────────
    if (type.startsWith('shards_') || type.startsWith('mythicShards_')) {
        const isMythic = type.startsWith('mythicShards_');
        const charId = type.replace(isMythic ? 'mythicShards_' : 'shards_', '');
        const char = CharactersService.charactersBySnowprintId[charId];
        const mow = char ? undefined : MowsService.resolveToStatic(charId);
        const unit = char ?? mow;
        return {
            icon: unit ? (
                <UnitShardIcon
                    icon={unit.roundIcon}
                    name={unit.name}
                    mythic={isMythic}
                    height={iconSize}
                    width={iconSize}
                />
            ) : (
                <MiscIcon icon={isMythic ? 'mythicShard' : 'shard'} width={iconSize} height={iconSize} />
            ),
            label: unit
                ? `${unit.name} ${isMythic ? 'Mythic Shards' : 'Shards'}`
                : isMythic
                  ? 'Mythic Shards'
                  : 'Shards',
            qty,
        };
    }

    // ── shop event currencies (any registered cost.type) ────────────────────
    const currencyIconKey = getShopCurrencyIconKey(type);
    if (currencyIconKey) {
        return {
            icon: <MiscIcon icon={currencyIconKey} width={iconSize} height={iconSize} />,
            label: getShopCurrencyLabel(type),
            qty,
        };
    }

    // ── simple named resources (shared across Shop Events and product calendar) ─
    const simple = resolveSimpleRewardIcon(type);
    if (simple) {
        return {
            icon: <MiscIcon icon={simple.iconKey} width={iconSize} height={iconSize} />,
            label: simple.label,
            qty,
        };
    }

    // ── event summoning tokens ────────────────────────────────────────────────
    if (type.startsWith('eventSummoningToken_')) {
        const faction = type.replace('eventSummoningToken_', '');
        const factionIconMap: Record<string, string> = {
            BloodAngels: 'bloodAngelsReq',
            Orks: 'orksReq',
        };
        const iconKey = factionIconMap[faction] ?? 'legendaryEventToken';
        return {
            icon: <MiscIcon icon={iconKey} width={iconSize} height={iconSize} />,
            label: `${faction} Req Scroll`,
            qty,
        };
    }

    // ── ability badges: abilityToken{Rarity}_{Alliance} ──────────────────────
    const badgeMatch = type.match(/^abilityToken(Common|Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Xenos|Chaos)$/);
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
    const orbMatch = type.match(/^heroAscensionOrb(Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Xenos|Chaos)$/);
    if (orbMatch) {
        const rarity = RarityMapper.stringToNumber[orbMatch[1] as RarityString];
        const alliance = orbMatch[2] as Alliance;
        return {
            icon: <OrbIcon alliance={alliance} rarity={rarity} size={iconSize} />,
            label: `${orbMatch[1]} ${alliance} Orb`,
            qty,
        };
    }

    // ── MoW components: mowComponent_{Alliance} (internal-only, not a real reward string — see draft-alliance.ts) ──
    const mowComponentMatch = /^mowComponent_(Imperial|Xenos|Chaos)$/.exec(type);
    if (mowComponentMatch) {
        const alliance = mowComponentMatch[1] as Alliance;
        return {
            icon: <MiscIcon icon={`${alliance.toLowerCase()}Component`} width={iconSize} height={iconSize} />,
            label: `${alliance} MoW Component`,
            qty,
        };
    }

    // ── forge badges: itemAscensionResource_{Rarity} ─────────────────────────
    const forgeMatch = type.match(/^itemAscensionResource_(Uncommon|Rare|Epic|Legendary|Mythic)$/);
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
                        size={iconSize}
                    />
                ),
                label: upgradeData.label,
                qty,
            };
        }
    }

    // ── generic equipment reward pools: items{Rarity}_{Type} (e.g. itemsLegendary_I_Block) ──
    const genericEquipmentMatch = /^items(Common|Uncommon|Rare|Epic|Legendary|Mythic)_(.+)$/.exec(type);
    if (genericEquipmentMatch) {
        const rarityString = genericEquipmentMatch[1] as RarityString;
        const equipmentType = genericEquipmentMatch[2];
        const rarity = RarityMapper.stringToNumber[rarityString];
        return {
            icon: (
                <EquipmentTypeRarityIcon
                    equipmentType={equipmentType}
                    rarity={rarity}
                    height={iconSize}
                    width={iconSize}
                />
            ),
            label: `${rarityString} ${EQUIPMENT_TYPE_LABELS[equipmentType] ?? equipmentType}`,
            qty,
        };
    }

    // ── equipment / relics: I_* or R_* ───────────────────────────────────────
    if (type.startsWith('I_') || type.startsWith('R_')) {
        const equip = EquipmentService.equipmentData.find(item => item.id === type);
        if (equip) {
            return {
                icon: <EquipmentIcon equipment={equip} height={iconSize} width={iconSize} />,
                label: equip.name,
                qty,
            };
        }
    }

    // ── fallback ──────────────────────────────────────────────────────────────
    return { icon: <span className="text-xs break-all text-(--soft-fg)">{type}</span>, label: type, qty };
}
