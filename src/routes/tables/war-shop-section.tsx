import { Shuffle } from 'lucide-react';
import { FC, useMemo } from 'react';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import { Alliance, Rarity, RarityString } from '@/fsd/5-shared/model';
import { AccessibleTooltip, LazyTooltip } from '@/fsd/5-shared/ui';
import { ComponentImage, ForgeBadgeImage, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { WarShopService, ResolvedShopItem } from '@/fsd/4-entities/shops';

import { ICharacterUpgradeEstimate } from '@/fsd/3-features/goals/goals.models';

import { NeededByEntry } from './daily-raids.helpers';
import { buildNeededByTooltip, resolveUnitName } from './shop-tooltip.helpers';
import {
    filterWarShopItemsByGoalNeed,
    filterWarShopItemsByType,
    parseForgeBadgeRarity,
} from './war-shop-section.helpers';

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
                                <Shuffle className="shrink-0 text-(--warning)" size={13} aria-label="Random" />
                            </AccessibleTooltip>
                        )}
                    </div>
                    <p className="text-xs text-(--soft-fg)">
                        {availableText}
                        <br />
                        <img
                            src={snowprintIcons.warCredits.file}
                            alt="gwc"
                            className="inline-block"
                            height={14}
                            width={14}
                        />{' '}
                        {item.costAmount.toLocaleString()} each
                    </p>
                    <span className="w-fit rounded bg-(--soft-bg) px-1.5 py-0.5 text-[10px] text-(--soft-fg)">
                        War Shop
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
    componentsByAlliance: Record<Alliance, Counts>;
    forgeBadgeCounts: Record<Rarity, Counts>;
    componentNeededBy: Record<Alliance, NeededByEntry[]>;
    forgeBadgeNeededBy: Record<Rarity, NeededByEntry[]>;
    userPL: number;
}

export const WarShopSection: FC<Props> = ({
    inProgressMaterials,
    blockedMaterials,
    componentsByAlliance,
    forgeBadgeCounts,
    componentNeededBy,
    forgeBadgeNeededBy,
    userPL,
}) => {
    const today = WarShopService.getTodayDow();

    const todayItems = useMemo(
        () => filterWarShopItemsByType(WarShopService.resolveForDay(today, userPL)),
        [today, userPL]
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

    const visibleItems = useMemo(
        () => filterWarShopItemsByGoalNeed(todayItems, shardsCountsMap, componentsByAlliance, forgeBadgeCounts),
        [todayItems, shardsCountsMap, componentsByAlliance, forgeBadgeCounts]
    );

    if (visibleItems.length === 0) return;

    return (
        <div className="mt-4 border-t border-(--card-border) pt-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                Available in War Shop today
            </p>
            <div className="flex flex-wrap items-start justify-center gap-2">
                {visibleItems.map(item => {
                    if (item.rewardType.startsWith('shards_')) {
                        const shardCounts = shardsCountsMap.get(item.rewardType);
                        const needsShard = shardCounts !== undefined && shardCounts.acquired < shardCounts.required;
                        if (!needsShard && item.freeOfferType === 'draft_machinesOfWarTokens') {
                            return (Object.values(Alliance) as Alliance[])
                                .filter(a => componentsByAlliance[a].acquired < componentsByAlliance[a].required)
                                .map(a => (
                                    <ShopItemCard
                                        key={`${item.rewardType}-${a}`}
                                        item={item}
                                        counts={componentsByAlliance[a]}
                                        icon={<ComponentImage alliance={a} size="medium" />}
                                        name={`${a} Components`}
                                        neededBy={componentNeededBy[a]}
                                    />
                                ));
                        }
                        const charId = item.rewardType.slice(7);
                        const unit = CharactersService.getUnit(charId) ?? MowsService.resolveToStatic(charId);
                        const icon = unit ? (
                            <UnitShardIcon
                                icon={unit.roundIcon}
                                name={unit.name}
                                height={ICON_SIZE}
                                width={ICON_SIZE}
                            />
                        ) : (
                            <UnitShardIcon icon="" name={item.rewardType} height={ICON_SIZE} width={ICON_SIZE} />
                        );
                        return (
                            <ShopItemCard
                                key={item.rewardType}
                                item={item}
                                counts={shardCounts ?? { acquired: 0, required: 0 }}
                                icon={icon}
                                name={unit?.name ?? charId}
                                neededBy={shardsNeededByMap.get(item.rewardType) ?? []}
                            />
                        );
                    }

                    if (item.rewardType === 'draft_machinesOfWarTokens') {
                        return (Object.values(Alliance) as Alliance[])
                            .filter(a => componentsByAlliance[a].acquired < componentsByAlliance[a].required)
                            .map(a => (
                                <ShopItemCard
                                    key={`${item.rewardType}-${a}`}
                                    item={item}
                                    counts={componentsByAlliance[a]}
                                    icon={<ComponentImage alliance={a} size="medium" />}
                                    name={`${a} Components`}
                                    neededBy={componentNeededBy[a]}
                                />
                            ));
                    }

                    const rarity = parseForgeBadgeRarity(item.rewardType);
                    if (rarity === undefined) return;
                    const rarityLabel = RarityString[rarity as unknown as keyof typeof RarityString] ?? 'Forge Badge';
                    return (
                        <ShopItemCard
                            key={item.rewardType}
                            item={item}
                            counts={forgeBadgeCounts[rarity]}
                            icon={<ForgeBadgeImage rarity={rarity} size="medium" />}
                            name={`${rarityLabel} Forge Badge`}
                            neededBy={forgeBadgeNeededBy[rarity]}
                        />
                    );
                })}
            </div>
        </div>
    );
};
