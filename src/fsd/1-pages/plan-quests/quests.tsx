/* eslint-disable import-x/no-internal-modules */
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { useContext, useMemo, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { FactionImage } from '@/fsd/4-entities/faction';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import { INpcData, INpcStats } from '@/fsd/4-entities/npc/model';
import { NpcPortrait } from '@/fsd/4-entities/npc/npc-portrait';
import { NpcService } from '@/fsd/4-entities/npc/npc-service';
import questJson from '@/fsd/4-entities/quests/data/hero-quests.json';
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
    const toggleTier = (tierIndex: number) =>
        setExpandedTiers(previous => ({ ...previous, [tierIndex]: !previous[tierIndex] }));
    const toggleBattle = (battleKey: string) =>
        setExpandedBattles(previous => ({ ...previous, [battleKey]: !previous[battleKey] }));

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

    return (
        <div className="space-y-8 py-6">
            <div>
                <h2>Quests</h2>
                <p className="text-sm text-(--muted-fg)">Browse hero quest tiers, battles, and loot requirements.</p>
            </div>

            {/* Header / Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-(--secondary) p-4">
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
                    onUnitChange={value => setQuestId(value?.snowprintId ?? '')}
                />

                {quest && (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-(--muted-fg) uppercase">Allowed</span>
                            <div className="flex gap-1">
                                {quest.allowedFactions.map(f => (
                                    <FactionImage key={f} faction={f} />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-end border-l border-(--border) pl-4">
                            <span className="text-xs font-bold text-(--muted-fg) uppercase">Enemies</span>
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
                            className="overflow-hidden rounded-xl border border-(--border) bg-(--card-bg) shadow-sm">
                            <button
                                onClick={() => toggleTier(tier.index)}
                                className="flex w-full cursor-pointer items-center justify-between p-4 transition-colors hover:bg-(--primary)/10">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`rounded-md border px-3 py-1 text-sm font-bold text-(--fg) ${tierBadgeBg[tier.index] ?? ''}`}>
                                        {RarityMapper.rarityToRarityString(tier.index as unknown as Rarity)} Tier
                                    </div>
                                    <span className="text-sm text-(--muted-fg)">{tier.battles.length} Battles</span>
                                </div>
                                {isTierExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </button>

                            {/* Battles Content */}
                            {isTierExpanded && (
                                <div className="divide-y divide-(--border) border-t border-(--border)">
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
                                                        <div className="flex items-center gap-2 rounded-md bg-(--fg)/8 px-2 py-1">
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
                                                    <div className="bg-(--fg)/5 px-4 pt-2 pb-4">
                                                        <div className="flex flex-wrap gap-2 rounded-lg border-2 border-dashed border-(--border) p-3">
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
