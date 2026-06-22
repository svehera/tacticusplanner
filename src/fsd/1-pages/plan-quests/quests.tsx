/* eslint-disable import-x/no-internal-modules */
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { useContext, useMemo, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import { Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { trackEvent } from '@/fsd/5-shared/monitoring';
import { Button } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { FactionImage } from '@/fsd/4-entities/faction';
import { MowsService } from '@/fsd/4-entities/mow';
import { INpcData, INpcStats } from '@/fsd/4-entities/npc/model';
import { NpcPortrait } from '@/fsd/4-entities/npc/npc-portrait';
import { NpcService } from '@/fsd/4-entities/npc/npc-service';
import questJson from '@/fsd/4-entities/quests/data/hero-quests.json';
import { IUnit, UnitsAutocomplete } from '@/fsd/4-entities/unit';
import { UpgradesService as FsdUpgradesService, UpgradeImage } from '@/fsd/4-entities/upgrade';

import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

import { useUpgradeNeeds } from './quests.hooks';

// Type definition for the data we extract from the string
interface ResolvedEnemyData {
    id: string;
    npc: INpcData;
    stats: INpcStats; // The specific stats for this level
}

const tierBadgeBg: Record<number, string> = {
    [Rarity.Common]: 'bg-(--rarity-common)/30 border-(--rarity-common)/60',
    [Rarity.Uncommon]: 'bg-(--rarity-uncommon)/30 border-(--rarity-uncommon)/60',
    [Rarity.Rare]: 'bg-(--rarity-rare)/30 border-(--rarity-rare)/60',
    [Rarity.Epic]: 'bg-(--rarity-epic)/30 border-(--rarity-epic)/60',
    [Rarity.Legendary]: 'bg-(--rarity-legendary)/30 border-(--rarity-legendary)/60',
    [Rarity.Mythic]: 'bg-(--rarity-mythic)/30 border-(--rarity-mythic)/60',
};

const getUpgradeRarity = (upgradeId: string): RarityString => {
    const upgrade = FsdUpgradesService.getUpgrade(upgradeId);
    if (!upgrade || upgrade.rarity === 'Shard' || upgrade.rarity === 'Mythic Shard') {
        return RarityMapper.rarityToRarityString(Rarity.Common);
    }
    return RarityMapper.rarityToRarityString(upgrade.rarity as unknown as Rarity);
};

const trackQuestPlanUpdate = (action: string) => {
    trackEvent('quest_plan_update', {
        feature: 'quests',
        action,
    });
};

type Objective = { ObjectiveType: string; ObjectiveTarget?: string | number };

const ObjectiveChip = ({ objective }: { objective: Objective }) => {
    const { ObjectiveType, ObjectiveTarget } = objective;

    if (ObjectiveType === 'DamageType' || ObjectiveType === 'NotDamageType') {
        const icon = snowprintIcons[`damage${ObjectiveTarget as string}`];
        const isNot = ObjectiveType === 'NotDamageType';
        return (
            <div
                title={`${isNot ? 'No ' : ''}${ObjectiveTarget as string} damage`}
                className={`flex items-center gap-0.5 rounded border px-1 py-0.5 ${isNot ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
                {isNot && <span className="text-xs font-bold text-red-400">✕</span>}
                {icon && (
                    <img src={icon.file} alt={icon.label} width={16} height={16} className="pointer-events-none" />
                )}
            </div>
        );
    }

    if (ObjectiveType === 'UseNoSummons') {
        const icon = snowprintIcons.traitSummon;
        return (
            <div
                title="No summons"
                className="flex items-center gap-0.5 rounded border border-red-500/50 bg-red-500/10 px-1 py-0.5">
                <span className="text-xs font-bold text-red-400">✕</span>
                <img src={icon.file} alt={icon.label} width={16} height={16} className="pointer-events-none" />
            </div>
        );
    }

    if (ObjectiveType === 'HasRangedAttack' || ObjectiveType === 'HasNoRangedAttack') {
        const icon = snowprintIcons.rangedAttack;
        const isNot = ObjectiveType === 'HasNoRangedAttack';
        return (
            <div
                title={isNot ? 'No ranged attack' : 'Ranged attack'}
                className={`flex items-center gap-0.5 rounded border px-1 py-0.5 ${isNot ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
                {isNot && <span className="text-xs font-bold text-red-400">✕</span>}
                <img src={icon.file} alt={icon.label} width={16} height={16} className="pointer-events-none" />
            </div>
        );
    }

    if (ObjectiveType === 'Trait' || ObjectiveType === 'NotTrait') {
        const traitName = ObjectiveTarget as string;
        const icon = snowprintIcons[`trait${traitName}`];
        const isNot = ObjectiveType === 'NotTrait';
        if (icon) {
            return (
                <div
                    title={`${isNot ? 'No ' : ''}${traitName}`}
                    className={`flex items-center gap-0.5 rounded border px-1 py-0.5 ${isNot ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
                    {isNot && <span className="text-xs font-bold text-red-400">✕</span>}
                    <img src={icon.file} alt={icon.label} width={16} height={16} className="pointer-events-none" />
                </div>
            );
        }
    }

    let label: string;
    switch (ObjectiveType) {
        case 'NoDamageTakenByAnyHero': {
            label = 'No damage taken';
            break;
        }
        case 'MaxHits': {
            label = `≤${ObjectiveTarget} hits`;
            break;
        }
        case 'MinHits': {
            label = `≥${ObjectiveTarget} hits`;
            break;
        }
        case 'NotTrait': {
            label = `No ${ObjectiveTarget as string}`;
            break;
        }
        case 'Trait': {
            label = String(ObjectiveTarget);
            break;
        }
        default: {
            label = ObjectiveType;
        }
    }

    return (
        <div className="rounded border border-(--card-border) bg-(--soft) px-1.5 py-0.5 text-xs text-(--soft-fg)">
            {label}
        </div>
    );
};

export const Quests = () => {
    const {
        characters: unresolvedCharacters,
        campaignsProgress,
        dailyRaids,
        dailyRaidsPreferences,
        goals,
        inventory,
        mows: unresolvedMows,
    } = useContext(StoreContext);

    const [questId, setQuestId] = useState<string>(questJson[0].unitId);
    const [expandedTiers, setExpandedTiers] = useState<Record<number, boolean>>({});
    const [expandedBattles, setExpandedBattles] = useState<Record<string, boolean>>({});

    // Memoize resolution to avoid heavy logic on every render
    const chars = useMemo(
        () => CharactersService.resolveStoredCharacters(unresolvedCharacters),
        [unresolvedCharacters]
    );
    const mows = useMemo(() => MowsService.resolveAllFromStorage(unresolvedMows), [unresolvedMows]);
    const quest = useMemo(() => questJson.find(q => q.unitId === questId), [questId]);
    const char = useMemo(
        () => chars.find(c => c.snowprintId === questId) ?? mows.find(m => m.snowprintId === questId),
        [chars, mows, questId]
    );

    const { shardsGoals, upgradeRankOrMowGoals } = GoalsService.prepareGoals(goals, [...chars, ...mows], false);

    const estimatedUpgradesTotal = UpgradesService.getUpgradesEstimatedDays(
        {
            dailyEnergy: dailyRaidsPreferences.dailyEnergy,
            campaignsProgress: campaignsProgress,
            preferences: {
                ...dailyRaidsPreferences,
            },
            upgrades: inventory.upgrades,
            completedLocations: dailyRaids.raidedLocations,
        },
        chars,
        mows,
        ...[upgradeRankOrMowGoals, shardsGoals].flat().filter(x => x.include)
    );

    const unitsNeedingUpgrade = useUpgradeNeeds(estimatedUpgradesTotal, chars, mows);

    // Toggles
    const toggleTier = (tierIndex: number) => {
        trackQuestPlanUpdate('toggle_tier');
        setExpandedTiers(previous => ({ ...previous, [tierIndex]: !previous[tierIndex] }));
    };
    const toggleBattle = (battleKey: string) => {
        trackQuestPlanUpdate('toggle_battle');
        setExpandedBattles(previous => ({ ...previous, [battleKey]: !previous[battleKey] }));
    };

    return (
        <div className="space-y-8 py-6">
            {/* Header / Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-(--card-border) bg-(--card) p-4 shadow-sm">
                <UnitsAutocomplete<IUnit>
                    // eslint-disable-next-line unicorn/no-null -- autocomplete requires null
                    unit={char ?? null}
                    label="Active Quest"
                    options={questJson
                        .map(
                            q =>
                                chars.find(c => c.snowprintId === q.unitId) ??
                                mows.find(m => m.snowprintId === q.unitId)
                        )
                        .filter(x => !!x)}
                    onUnitChange={value => {
                        trackQuestPlanUpdate('select_quest');
                        setQuestId(value?.snowprintId ?? '');
                    }}
                />

                {quest && (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-(--soft-fg) uppercase">Allowed</span>
                            <div className="flex gap-1">
                                {quest.allowedFactions.map(f => (
                                    <FactionImage key={f} faction={f} />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-end border-l border-(--card-border) pl-4">
                            <span className="text-xs font-bold text-(--soft-fg) uppercase">Enemies</span>
                            <div className="flex gap-1">
                                {quest.enemyFactions.map(f => (
                                    <FactionImage key={f} faction={f} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tiers List */}
            <div className="space-y-4">
                {quest?.tiers.toReversed().map(tier => {
                    const isTierExpanded = !!expandedTiers[tier.index];
                    return (
                        <div
                            key={tier.index}
                            className="overflow-hidden rounded-xl border border-(--card-border) bg-(--soft) shadow-sm">
                            <button
                                onClick={() => toggleTier(tier.index)}
                                className="flex w-full cursor-pointer items-center justify-between bg-(--soft) p-4 transition-colors hover:bg-(--primary)/10">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`rounded-md border px-3 py-1 text-sm font-bold text-(--fg) ${tierBadgeBg[tier.index] ?? ''}`}>
                                        {RarityMapper.rarityToRarityString(tier.index as unknown as Rarity)} Tier
                                    </div>
                                    <span className="text-sm text-(--soft-fg)">{tier.battles.length} Battles</span>
                                </div>
                                {isTierExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </button>

                            {/* Battles Content */}
                            {isTierExpanded && (
                                <div className="divide-y divide-(--card-border) border-t border-(--card-border)">
                                    {tier.battles.toReversed().map(battle => {
                                        const battleKey = `${quest.unitId}-${tier.index}-${battle.battleNr}`;
                                        const isBattleExpanded = !!expandedBattles[battleKey];
                                        const needing = unitsNeedingUpgrade(battle.loot.reward.upgradeId);

                                        return (
                                            <div key={battleKey} className="flex flex-col">
                                                {/* Battle Summary Row */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                                                    <div className="flex items-center gap-4">
                                                        <span className="min-w-[70px] text-sm font-medium">
                                                            Battle {battle.battleNr}
                                                        </span>
                                                        {battle.objectives.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {battle.objectives.map((objective, index) => (
                                                                    <ObjectiveChip key={index} objective={objective} />
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 rounded-md bg-(--soft) px-2 py-1">
                                                            <UpgradeImage
                                                                material={battle.loot.reward.upgradeId}
                                                                iconPath={
                                                                    FsdUpgradesService.getUpgrade(
                                                                        battle.loot.reward.upgradeId
                                                                    )?.iconPath ?? ''
                                                                }
                                                                rarity={getUpgradeRarity(battle.loot.reward.upgradeId)}
                                                            />
                                                            <span
                                                                className={`text-xs font-bold ${needing.acquired >= needing.required ? 'text-(--success)' : ''}`}>
                                                                {needing.acquired} / {needing.required}
                                                            </span>
                                                        </div>
                                                        <div className="mr-4 flex gap-2">
                                                            {needing.units.slice(0, 3).map(unit => (
                                                                <UnitShardIcon
                                                                    key={unit.snowprintId}
                                                                    icon={unit?.roundIcon ?? ''}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            appearance="plain"
                                                            intent="primary"
                                                            size="extra-small"
                                                            onPress={() => toggleBattle(battleKey)}>
                                                            <Users size={14} />
                                                            {isBattleExpanded ? 'Hide Enemies' : 'Show Enemies'}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Expandable Enemy Section */}
                                                {isBattleExpanded && (
                                                    <div className="bg-(--soft) px-4 pt-2 pb-4">
                                                        <div className="flex flex-wrap gap-2 rounded-lg border-2 border-dashed border-(--card-border) p-3">
                                                            <div className="mb-3 flex flex-wrap items-start gap-x-3 gap-y-6">
                                                                {battle.enemies.map((enemy, enemyIndex) => {
                                                                    const npc = NpcService.getNpcById(enemy.name);
                                                                    const progressionIndex =
                                                                        (enemy.progressionIndex ?? 1) > 0
                                                                            ? (enemy.progressionIndex ?? 1) - 1
                                                                            : 0;
                                                                    if (
                                                                        npc === undefined ||
                                                                        npc.stats.length <= progressionIndex
                                                                    ) {
                                                                        return (
                                                                            <div
                                                                                key={enemyIndex}
                                                                                className="text-xs text-(--danger)">
                                                                                Error: {enemy.name}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    const data: ResolvedEnemyData = {
                                                                        id: enemy.name,
                                                                        npc,
                                                                        stats: npc.stats[progressionIndex],
                                                                    };
                                                                    return (
                                                                        <div
                                                                            key={enemyIndex}
                                                                            className="relative h-[75px] w-[60px] origin-top-left scale-[0.3] rounded transition-all">
                                                                            <NpcPortrait
                                                                                id={data.id}
                                                                                rank={data.stats.rank}
                                                                                stars={data.stats.rarityStars}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
