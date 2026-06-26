import { Shuffle } from 'lucide-react';
import { FC, useMemo } from 'react';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip, LazyTooltip } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { GuildShopService, ResolvedShopItem } from '@/fsd/4-entities/shops';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { ICharacterUpgradeEstimate } from '@/fsd/3-features/goals/goals.models';

import { NeededByEntry } from './daily-raids.helpers';

const MYTHIC_IDS = new Set(['upgHpM001', 'upgHpM002', 'upgHpM003', 'upgHpM004']);
const ICON_SIZE = 40;

function resolveUnitName(unitId: string): string {
    return CharactersService.getUnit(unitId)?.shortName ?? MowsService.resolveToStatic(unitId)?.name ?? unitId;
}

function buildNeededByTooltip(neededBy: NeededByEntry[]) {
    if (neededBy.length === 0) return;
    return (
        <div className="text-xs leading-relaxed">
            {neededBy.map((entry, index) => (
                <div key={index}>
                    {entry.name} {entry.count}x
                </div>
            ))}
        </div>
    );
}

interface ShopItemCardProps {
    item: ResolvedShopItem;
    acquired: number;
    required: number;
    neededBy: NeededByEntry[];
}

const ShopItemCard: FC<ShopItemCardProps> = ({ item, acquired, required, neededBy }) => {
    const charId = item.rewardType.startsWith('shards_') ? item.rewardType.slice(7) : undefined;
    const unit = charId ? (CharactersService.getUnit(charId) ?? MowsService.resolveToStatic(charId)) : undefined;

    const upgradeData = MYTHIC_IDS.has(item.rewardType)
        ? UpgradesService.recipeExpandedUpgradeData[item.rewardType]
        : undefined;

    const icon = charId ? (
        unit ? (
            <UnitShardIcon icon={unit.roundIcon} name={unit.name} height={ICON_SIZE} width={ICON_SIZE} />
        ) : (
            <UnitShardIcon icon="" name={item.rewardType} height={ICON_SIZE} width={ICON_SIZE} />
        )
    ) : upgradeData ? (
        <UpgradeImage
            material={upgradeData.label}
            iconPath={upgradeData.iconPath}
            rarity={RarityMapper.rarityToRarityString(Rarity.Mythic)}
            size={ICON_SIZE}
        />
    ) : undefined;

    const name = charId ? (unit?.name ?? charId) : (upgradeData?.label ?? item.rewardType);

    const availableText =
        item.maxPerDay === 1 ? `1×${item.rewardQty} available` : `Up to ${item.maxPerDay}×${item.rewardQty} available`;

    const tooltip = buildNeededByTooltip(neededBy);
    const card = (
        <div className="flex w-52 flex-col rounded-lg border border-(--card-border) bg-(--card) p-3 text-(--card-fg) shadow-lg">
            <div className="flex w-full flex-row items-start gap-2">
                <div className="flex w-12 shrink-0 flex-col items-center gap-1">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center">{icon}</div>
                    <span className="mt-1 text-sm font-bold text-(--danger)">
                        {Math.min(Math.floor(acquired), required)}/{required}
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
                            src={snowprintIcons.guildCredits.file}
                            alt="gc"
                            className="inline-block"
                            height={14}
                            width={14}
                        />{' '}
                        {item.costAmount.toLocaleString()} each
                    </p>
                    <span className="w-fit rounded bg-(--soft-bg) px-1.5 py-0.5 text-[10px] text-(--soft-fg)">
                        Guild Shop
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
    userPL: number;
}

export const GuildShopSection: FC<Props> = ({ inProgressMaterials, blockedMaterials, userPL }) => {
    const today = GuildShopService.getTodayDow();

    const todayItems = useMemo(
        () =>
            GuildShopService.resolveForDay(today, userPL).filter(
                item => item.rewardType.startsWith('shards_') || MYTHIC_IDS.has(item.rewardType)
            ),
        [today, userPL]
    );

    const countsMap = useMemo(() => {
        const map = new Map<string, { acquired: number; required: number }>();
        for (const mat of [...inProgressMaterials, ...blockedMaterials]) {
            const key = mat.snowprintId;
            if (!key.startsWith('shards_') && !MYTHIC_IDS.has(key)) continue;
            const previous = map.get(key) ?? { acquired: 0, required: 0 };
            map.set(key, {
                acquired: previous.acquired + mat.acquiredCount,
                required: previous.required + mat.requiredCount,
            });
        }
        return map;
    }, [inProgressMaterials, blockedMaterials]);

    const neededByMap = useMemo(() => {
        const map = new Map<string, NeededByEntry[]>();
        for (const mat of [...inProgressMaterials, ...blockedMaterials]) {
            const key = mat.snowprintId;
            if (!key.startsWith('shards_') && !MYTHIC_IDS.has(key)) continue;
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
                const c = countsMap.get(item.rewardType);
                return c !== undefined && c.acquired < c.required;
            }),
        [todayItems, countsMap]
    );

    if (visibleItems.length === 0) return;

    return (
        <div className="mt-4 border-t border-(--card-border) pt-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                Available in Guild Shop today
            </p>
            <div className="flex flex-wrap items-start justify-center gap-2">
                {visibleItems.map(item => (
                    <ShopItemCard
                        key={item.rewardType}
                        item={item}
                        acquired={countsMap.get(item.rewardType)?.acquired ?? 0}
                        required={countsMap.get(item.rewardType)?.required ?? 0}
                        neededBy={neededByMap.get(item.rewardType) ?? []}
                    />
                ))}
            </div>
        </div>
    );
};
