import { Shuffle } from 'lucide-react';
import { FC, useMemo } from 'react';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { ForgeBadgeImage } from '@/fsd/5-shared/ui/icons';

import { RogueTraderService, ResolvedShopItem } from '@/fsd/4-entities/shops';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { ICharacterUpgradeEstimate } from '@/fsd/3-features/goals/goals.models';

const MYTHIC_MAT_IDS = new Set(['upgHpM001', 'upgHpM002', 'upgHpM003', 'upgHpM004']);
const MYTHIC_FORGE_BADGE = 'itemAscensionResource_Mythic';
const ICON_SIZE = 40;

interface Counts {
    acquired: number;
    required: number;
}

interface ShopItemCardProps {
    item: ResolvedShopItem;
    acquired: number;
    required: number;
}

const ShopItemCard: FC<ShopItemCardProps> = ({ item, acquired, required }) => {
    const upgradeData = MYTHIC_MAT_IDS.has(item.rewardType)
        ? UpgradesService.recipeExpandedUpgradeData[item.rewardType]
        : undefined;

    const icon =
        item.rewardType === MYTHIC_FORGE_BADGE ? (
            <ForgeBadgeImage rarity={Rarity.Mythic} size="medium" />
        ) : upgradeData ? (
            <UpgradeImage
                material={upgradeData.label}
                iconPath={upgradeData.iconPath}
                rarity={RarityMapper.rarityToRarityString(Rarity.Mythic)}
                size={ICON_SIZE}
            />
        ) : undefined;

    const name =
        item.rewardType === MYTHIC_FORGE_BADGE ? 'Mythic Forge Badge' : (upgradeData?.label ?? item.rewardType);

    const displayAcquired = Math.min(Math.floor(acquired), required);
    const availableText =
        item.maxPerDay === 1 ? `1×${item.rewardQty} available` : `Up to ${item.maxPerDay}×${item.rewardQty} available`;

    return (
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
                            src={snowprintIcons.archeotech.file}
                            alt="archeotech"
                            className="inline-block"
                            height={14}
                            width={14}
                        />{' '}
                        {item.costAmount.toLocaleString()} each
                    </p>
                    <span className="w-fit rounded bg-(--soft-bg) px-1.5 py-0.5 text-[10px] text-(--soft-fg)">
                        Rogue Trader
                    </span>
                </div>
            </div>
        </div>
    );
};

interface Props {
    inProgressMaterials: ICharacterUpgradeEstimate[];
    blockedMaterials: ICharacterUpgradeEstimate[];
    forgeBadgeCounts: Record<Rarity, Counts>;
}

export const RogueTraderSection: FC<Props> = ({ inProgressMaterials, blockedMaterials, forgeBadgeCounts }) => {
    const today = RogueTraderService.getTodayDow();

    const todayItems = useMemo(
        () =>
            RogueTraderService.resolvePenultimateForDay(today).filter(
                item => item.rewardType === MYTHIC_FORGE_BADGE || MYTHIC_MAT_IDS.has(item.rewardType)
            ),
        [today]
    );

    const countsMap = useMemo(() => {
        const map = new Map<string, Counts>();
        for (const mat of [...inProgressMaterials, ...blockedMaterials]) {
            if (!MYTHIC_MAT_IDS.has(mat.snowprintId)) continue;
            const previous = map.get(mat.snowprintId) ?? { acquired: 0, required: 0 };
            map.set(mat.snowprintId, {
                acquired: previous.acquired + mat.acquiredCount,
                required: previous.required + mat.requiredCount,
            });
        }
        return map;
    }, [inProgressMaterials, blockedMaterials]);

    const visibleItems = useMemo(
        () =>
            todayItems.filter(item => {
                if (item.rewardType === MYTHIC_FORGE_BADGE) {
                    const c = forgeBadgeCounts[Rarity.Mythic];
                    return c.acquired < c.required;
                }
                const c = countsMap.get(item.rewardType);
                return c !== undefined && c.acquired < c.required;
            }),
        [todayItems, forgeBadgeCounts, countsMap]
    );

    if (visibleItems.length === 0) return;

    return (
        <div className="mt-4 border-t border-(--card-border) pt-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                Available in Rogue Trader today
            </p>
            <div className="flex flex-wrap items-start justify-center gap-2">
                {visibleItems.map(item => {
                    const c =
                        item.rewardType === MYTHIC_FORGE_BADGE
                            ? forgeBadgeCounts[Rarity.Mythic]
                            : (countsMap.get(item.rewardType) ?? { acquired: 0, required: 0 });
                    return (
                        <ShopItemCard key={item.rewardType} item={item} acquired={c.acquired} required={c.required} />
                    );
                })}
            </div>
        </div>
    );
};
