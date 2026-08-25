import { FC, ReactNode, useMemo } from 'react';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip, LazyTooltip } from '@/fsd/5-shared/ui';
import { ForgeBadgeImage, MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { CrusadeShopService, ResolvedShopItem } from '@/fsd/4-entities/shops';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { ICharacterUpgradeEstimate } from '@/fsd/3-features/goals/goals.models';

import { filterCrusadeShopItemsByType } from './crusade-shop-section.helpers';
import { NeededByEntry } from './daily-raids.helpers';
import { ShopAvailabilityGroups } from './shop-availability-groups';
import { groupByAvailability } from './shop-availability.helpers';
import { buildNeededByTooltip, resolveUnitName } from './shop-tooltip.helpers';
import { parseForgeBadgeRarity } from './war-shop-section.helpers';

const ICON_SIZE = 40;

interface Counts {
    acquired: number;
    required: number;
}

interface ShopItemCardProps {
    item: ResolvedShopItem;
    counts: Counts;
    icon: React.ReactNode;
    name: string;
    neededBy: NeededByEntry[];
}

const ShopItemCard: FC<ShopItemCardProps> = ({ item, counts, icon, name, neededBy }) => {
    const { acquired, required } = counts;
    const displayAcquired = Math.min(Math.floor(acquired), required);
    const remaining = required - displayAcquired;
    const totalCost = remaining > 0 ? Math.ceil(remaining / item.rewardQty) * item.costAmount : 0;

    const availableText =
        item.maxPerDay === 1 ? `1×${item.rewardQty} available` : `Up to ${item.maxPerDay}×${item.rewardQty} available`;

    const tooltip = buildNeededByTooltip(neededBy);
    const card = (
        <div className="flex w-52 flex-col rounded-lg border border-(--card-border) bg-(--card) p-3 text-(--card-fg) shadow-lg">
            <div className="flex w-full flex-row items-start gap-2">
                <div className="flex w-12 shrink-0 flex-col items-center gap-1">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center">{icon}</div>
                    <span className="mt-1 text-sm font-bold text-(--danger)">
                        {displayAcquired}/{required}
                    </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-1">
                        <h4 className="truncate text-xs font-normal">{name}</h4>
                        {!item.isGuaranteed && (
                            <AccessibleTooltip title="May or may not appear today — this slot is random">
                                <MiscIcon icon="chance" className="shrink-0" height={13} width={13} />
                            </AccessibleTooltip>
                        )}
                    </div>
                    <p className="text-xs text-(--soft-fg)">
                        {availableText}
                        <br />
                        <img
                            src={snowprintIcons.crusadeCurrency.file}
                            alt="crusade currency"
                            className="inline-block"
                            height={14}
                            width={14}
                        />{' '}
                        {item.costAmount.toLocaleString()} each
                        {remaining > 0 && (
                            <>
                                <br />
                                Total:{' '}
                                <img
                                    src={snowprintIcons.crusadeCurrency.file}
                                    alt="crusade currency"
                                    className="inline-block"
                                    height={14}
                                    width={14}
                                />{' '}
                                {totalCost.toLocaleString()}
                            </>
                        )}
                    </p>
                    <span className="w-fit rounded bg-(--soft-bg) px-1.5 py-0.5 text-[10px] text-(--soft-fg)">
                        Crusade Shop
                    </span>
                </div>
            </div>
        </div>
    );

    if (!tooltip) return card;
    return <LazyTooltip title={tooltip}>{card}</LazyTooltip>;
};

interface Props {
    inProgressMaterials: ICharacterUpgradeEstimate[];
    blockedMaterials: ICharacterUpgradeEstimate[];
    forgeBadgeCounts: Record<Rarity, Counts>;
    forgeBadgeNeededBy: Record<Rarity, NeededByEntry[]>;
    userPL: number;
    hasBlueStarUnit: boolean;
    hideRandomDeals: boolean;
}

export const CrusadeShopSection: FC<Props> = ({
    inProgressMaterials,
    blockedMaterials,
    forgeBadgeCounts,
    forgeBadgeNeededBy,
    userPL,
    hasBlueStarUnit,
    hideRandomDeals,
}) => {
    const today = CrusadeShopService.getTodayDow();

    const todayItems = useMemo(
        () => filterCrusadeShopItemsByType(CrusadeShopService.resolveForDay(today, userPL, hasBlueStarUnit)),
        [today, userPL, hasBlueStarUnit]
    );

    const shardsCountsMap = useMemo(() => {
        const map = new Map<string, Counts>();
        for (const mat of [...inProgressMaterials, ...blockedMaterials]) {
            const key = mat.snowprintId;
            if (!key.startsWith('shards_')) continue;
            const previous = map.get(key) ?? { acquired: 0, required: 0 };
            map.set(key, {
                acquired: previous.acquired + mat.acquiredCount,
                required: previous.required + mat.requiredCount,
            });
        }
        return map;
    }, [inProgressMaterials, blockedMaterials]);

    const shardsNeededByMap = useMemo(() => {
        const map = new Map<string, NeededByEntry[]>();
        for (const mat of [...inProgressMaterials, ...blockedMaterials]) {
            if (!mat.snowprintId.startsWith('shards_')) continue;
            const entries = map.get(mat.snowprintId) ?? [];
            for (const [unitId, count] of Object.entries(mat.countByUnitId ?? {})) {
                if (!unitId) continue;
                entries.push({ name: resolveUnitName(unitId), count });
            }
            map.set(mat.snowprintId, entries);
        }
        return map;
    }, [inProgressMaterials, blockedMaterials]);

    const materialCountsMap = useMemo(() => {
        const map = new Map<string, Counts>();
        for (const mat of [...inProgressMaterials, ...blockedMaterials]) {
            const key = mat.snowprintId;
            if (!UpgradesService.recipeExpandedUpgradeData[key]) continue;
            const previous = map.get(key) ?? { acquired: 0, required: 0 };
            map.set(key, {
                acquired: previous.acquired + mat.acquiredCount,
                required: previous.required + mat.requiredCount,
            });
        }
        return map;
    }, [inProgressMaterials, blockedMaterials]);

    const materialNeededByMap = useMemo(() => {
        const map = new Map<string, NeededByEntry[]>();
        for (const mat of [...inProgressMaterials, ...blockedMaterials]) {
            const key = mat.snowprintId;
            if (!UpgradesService.recipeExpandedUpgradeData[key]) continue;
            const entries = map.get(key) ?? [];
            for (const [unitId, count] of Object.entries(mat.countByUnitId ?? {})) {
                if (!unitId) continue;
                entries.push({ name: resolveUnitName(unitId), count });
            }
            map.set(key, entries);
        }
        return map;
    }, [inProgressMaterials, blockedMaterials]);

    const visibleItems = useMemo(
        () =>
            todayItems.filter(item => {
                if (item.rewardType.startsWith('shards_')) {
                    const c = shardsCountsMap.get(item.rewardType);
                    return c !== undefined && c.acquired < c.required;
                }
                const badgeRarity = parseForgeBadgeRarity(item.rewardType);
                if (badgeRarity !== undefined) {
                    const c = forgeBadgeCounts[badgeRarity];
                    return c.acquired < c.required;
                }
                const c = materialCountsMap.get(item.rewardType);
                return c !== undefined && c.acquired < c.required;
            }),
        [todayItems, shardsCountsMap, forgeBadgeCounts, materialCountsMap]
    );

    const renderItem = (item: ResolvedShopItem): ReactNode => {
        if (item.rewardType.startsWith('shards_')) {
            const shardCounts = shardsCountsMap.get(item.rewardType) ?? { acquired: 0, required: 0 };
            const charId = item.rewardType.slice(7);
            const unit = CharactersService.getUnit(charId) ?? MowsService.resolveToStatic(charId);
            const icon = unit ? (
                <UnitShardIcon icon={unit.roundIcon} name={unit.name} height={ICON_SIZE} width={ICON_SIZE} />
            ) : (
                <UnitShardIcon icon="" name={item.rewardType} height={ICON_SIZE} width={ICON_SIZE} />
            );
            return (
                <ShopItemCard
                    key={item.rewardType}
                    item={item}
                    counts={shardCounts}
                    icon={icon}
                    name={unit?.name ?? charId}
                    neededBy={shardsNeededByMap.get(item.rewardType) ?? []}
                />
            );
        }

        const badgeRarity = parseForgeBadgeRarity(item.rewardType);
        if (badgeRarity !== undefined) {
            const rarityLabel = RarityMapper.rarityToRarityString(badgeRarity);
            return (
                <ShopItemCard
                    key={item.rewardType}
                    item={item}
                    counts={forgeBadgeCounts[badgeRarity]}
                    icon={<ForgeBadgeImage rarity={badgeRarity} size="medium" />}
                    name={`${rarityLabel} Forge Badge`}
                    neededBy={forgeBadgeNeededBy[badgeRarity]}
                />
            );
        }

        const upgradeData = UpgradesService.recipeExpandedUpgradeData[item.rewardType];
        const materialRarity = typeof upgradeData.rarity === 'number' ? upgradeData.rarity : Rarity.Common;
        return (
            <ShopItemCard
                key={item.rewardType}
                item={item}
                counts={materialCountsMap.get(item.rewardType) ?? { acquired: 0, required: 0 }}
                icon={
                    <UpgradeImage
                        material={upgradeData.label}
                        iconPath={upgradeData.iconPath}
                        rarity={RarityMapper.rarityToRarityString(materialRarity)}
                        size={ICON_SIZE}
                    />
                }
                name={upgradeData.label}
                neededBy={materialNeededByMap.get(item.rewardType) ?? []}
            />
        );
    };

    const { guaranteed, possible } = useMemo(
        () => groupByAvailability(visibleItems, hideRandomDeals),
        [visibleItems, hideRandomDeals]
    );

    return (
        <ShopAvailabilityGroups
            shopName="Crusade Shop"
            guaranteed={guaranteed}
            possible={possible}
            renderItem={renderItem}
        />
    );
};
