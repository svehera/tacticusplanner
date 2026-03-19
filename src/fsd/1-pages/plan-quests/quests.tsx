/* eslint-disable import-x/no-internal-modules */
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { useContext, useMemo, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { FactionImage } from '@/fsd/4-entities/faction';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import { INpcData, INpcStats } from '@/fsd/4-entities/npc/model';
import { NpcPortrait } from '@/fsd/4-entities/npc/npc-portrait';
import { NpcService } from '@/fsd/4-entities/npc/npc-service';
import questJson from '@/fsd/4-entities/quests/data/heroQuests.json';
import { IUnit, UnitsAutocomplete } from '@/fsd/4-entities/unit';
import { UpgradesService as FsdUpgradesService, UpgradeImage } from '@/fsd/4-entities/upgrade';

import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

// Type definition for the data we extract from the string
interface ResolvedEnemyData {
    id: string;
    npc: INpcData;
    stats: INpcStats; // The specific stats for this level
}

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

    // Toggles
    const toggleTier = (tierIndex: number) => setExpandedTiers(prev => ({ ...prev, [tierIndex]: !prev[tierIndex] }));
    const toggleBattle = (battleKey: string) =>
        setExpandedBattles(prev => ({ ...prev, [battleKey]: !prev[battleKey] }));

    const getUpgradeRarity = (upgradeId: string): RarityString => {
        const upgrade = FsdUpgradesService.getUpgrade(upgradeId);
        if (!upgrade || upgrade.rarity === 'Shard' || upgrade.rarity === 'Mythic Shard') {
            return RarityMapper.rarityToRarityString(Rarity.Common);
        }
        return RarityMapper.rarityToRarityString(upgrade.rarity as unknown as Rarity);
    };

    const unitsNeedingUpgrade = (
        upgradeId: string
    ): { acquired: number; required: number; units: Array<ICharacter2 | IMow2> } => {
        const inProgressMat = estimatedUpgradesTotal.inProgressMaterials.find(upgrade => upgrade.id === upgradeId);
        const blockedMat = estimatedUpgradesTotal.blockedMaterials.find(upgrade => upgrade.id === upgradeId);
        const acquired = (inProgressMat?.acquiredCount ?? 0) + (blockedMat?.acquiredCount ?? 0);
        const required = (inProgressMat?.requiredCount ?? 0) + (blockedMat?.requiredCount ?? 0);
        if (required === 0) return { acquired, required, units: [] };
        const units = [
            estimatedUpgradesTotal.inProgressMaterials.find(upgrade => upgrade.id === upgradeId)?.relatedCharacters,
            estimatedUpgradesTotal.blockedMaterials.find(upgrade => upgrade.id === upgradeId)?.relatedCharacters,
        ]
            .flat()
            .filter(x => x !== undefined);
        const resolvedChars = units
            .flat()
            .filter(x => x !== undefined)
            .map(charName => chars.find(c => c.shortName === charName))
            .filter(x => x !== undefined);
        const resolvedMows = units
            .flat()
            .filter(x => x !== undefined)
            .map(mowName => mows.find(m => m.name === mowName))
            .filter(x => x !== undefined);
        return { acquired, required, units: [...resolvedChars, ...resolvedMows] as Array<ICharacter2 | IMow2> };
    };

    const showLaunchBanner = Date.now() <= new Date('2026-03-22T23:59:59').getTime();

    return (
        <div className="flex flex-col gap-4 p-2 text-slate-900 dark:text-slate-100">
            {showLaunchBanner && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                    Thanks for using the new quests feature! Use this code in game <b>PLANNERQUEST</b>
                </div>
            )}

            {/* Header / Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
                <UnitsAutocomplete<IUnit>
                    unit={char ?? null}
                    label="Active Quest"
                    options={questJson
                        .map(
                            q =>
                                chars.find(c => c.snowprintId === q.unitId) ??
                                mows.find(m => m.snowprintId === q.unitId)
                        )
                        .filter(x => !!x)}
                    onUnitChange={value => setQuestId(value?.snowprintId ?? '')}
                />

                {quest && (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold uppercase opacity-60">Allowed</span>
                            <div className="flex gap-1">
                                {quest.allowedFactions.map(f => (
                                    <FactionImage key={f} faction={f} />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-end border-l border-slate-300 pl-4 dark:border-slate-700">
                            <span className="text-xs font-bold uppercase opacity-60">Enemies</span>
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
                            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <button
                                onClick={() => toggleTier(tier.index)}
                                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-md bg-blue-600 px-3 py-1 text-sm font-bold text-white">
                                        {RarityMapper.rarityToRarityString(tier.index as unknown as Rarity)} Tier
                                    </div>
                                    <span className="text-sm opacity-70">{tier.battles.length} Battles</span>
                                </div>
                                {isTierExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </button>

                            {/* Battles Content */}
                            {isTierExpanded && (
                                <div className="divide-y divide-slate-100 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-700">
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
                                                        <div className="flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
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
                                                                className={`text-xs font-bold ${needing.acquired >= needing.required ? 'text-green-500' : ''}`}>
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
                                                        <button
                                                            onClick={() => toggleBattle(battleKey)}
                                                            className="flex items-center gap-1 text-xs font-semibold tracking-wider text-blue-500 uppercase hover:text-blue-600">
                                                            <Users size={14} />
                                                            {isBattleExpanded ? 'Hide Enemies' : 'Show Enemies'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expandable Enemy Section */}
                                                {isBattleExpanded && (
                                                    <div className="bg-slate-50 px-4 pt-2 pb-4 dark:bg-black/20">
                                                        <div className="flex flex-wrap gap-2 rounded-lg border-2 border-dashed border-slate-200 p-3 dark:border-slate-700">
                                                            <div className="mb-3 flex flex-wrap items-start gap-x-3 gap-y-6">
                                                                {battle.enemies.map((enemy, idx) => {
                                                                    const npc = NpcService.getNpcById(enemy.name);
                                                                    const index =
                                                                        (enemy.progressionIndex ?? 1) > 0
                                                                            ? (enemy.progressionIndex ?? 1) - 1
                                                                            : 0;
                                                                    if (
                                                                        npc === undefined ||
                                                                        npc.stats.length <= index
                                                                    ) {
                                                                        return (
                                                                            <div
                                                                                key={idx}
                                                                                className="text-xs text-red-500">
                                                                                Error: {enemy.name}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    const data: ResolvedEnemyData = {
                                                                        id: enemy.name,
                                                                        npc,
                                                                        stats: npc.stats[index],
                                                                    };
                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={() => {}}
                                                                            className="relative h-[75px] w-[60px] cursor-pointer rounded transition-all hover:brightness-110 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                            style={{
                                                                                transform: 'scale(0.3)',
                                                                                transformOrigin: 'top left',
                                                                            }}
                                                                            title="Click for details">
                                                                            <NpcPortrait
                                                                                id={data.id}
                                                                                rank={data.stats.rank}
                                                                                stars={data.stats.rarityStars}
                                                                            />
                                                                        </button>
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
