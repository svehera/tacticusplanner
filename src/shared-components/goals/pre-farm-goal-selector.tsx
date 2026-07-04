import { Pause, Play } from 'lucide-react';
import React, { useMemo } from 'react';

import { Rank } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { PersonalGoalType } from '@/fsd/4-entities/goal';

import { ICharacterUpgradeMow, ICharacterUpgradeRankGoal, TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

const RANK_ABBREV: Record<number, string> = {
    [Rank.Stone1]: 'St1',
    [Rank.Stone2]: 'St2',
    [Rank.Stone3]: 'St3',
    [Rank.Iron1]: 'I1',
    [Rank.Iron2]: 'I2',
    [Rank.Iron3]: 'I3',
    [Rank.Bronze1]: 'Br1',
    [Rank.Bronze2]: 'Br2',
    [Rank.Bronze3]: 'Br3',
    [Rank.Silver1]: 'S1',
    [Rank.Silver2]: 'S2',
    [Rank.Silver3]: 'S3',
    [Rank.Gold1]: 'G1',
    [Rank.Gold2]: 'G2',
    [Rank.Gold3]: 'G3',
    [Rank.Diamond1]: 'D1',
    [Rank.Diamond2]: 'D2',
    [Rank.Diamond3]: 'D3',
    [Rank.Adamantine1]: 'A1',
    [Rank.Adamantine2]: 'A2',
    [Rank.Adamantine3]: 'A3',
};

function rankLabel(rank: number, point5: boolean, appliedUpgrades: number): string {
    const base = RANK_ABBREV[rank] ?? String(rank);
    if (rank >= Rank.Diamond3 && appliedUpgrades > 0) return `${base}.${appliedUpgrades}`;
    if (rank < Rank.Diamond3 && point5) return `${base}.5`;
    return base;
}

function GoalSummary({ goal }: { goal: ICharacterUpgradeRankGoal | ICharacterUpgradeMow }) {
    if (goal.type === PersonalGoalType.UpgradeRank) {
        const start = rankLabel(goal.rankStart, goal.rankStartPoint5, goal.rankStartAppliedUpgrades ?? 0);
        const end = rankLabel(goal.rankEnd, goal.rankPoint5, goal.rankAppliedUpgrades ?? 0);
        const sortedRarities =
            goal.upgradesRarity && goal.upgradesRarity.length > 0 ? goal.upgradesRarity.toSorted((a, b) => a - b) : [];
        return (
            <span className="flex items-center gap-1 text-sm text-(--fg)">
                <span>
                    {start} → {end}
                </span>
                {sortedRarities.length > 0 && (
                    <span className="flex items-center gap-0.5">
                        {sortedRarities.map(r => (
                            <RarityIcon key={r} rarity={r} />
                        ))}
                    </span>
                )}
            </span>
        );
    }

    const parts: string[] = [];
    if (goal.primaryEnd > goal.primaryStart) parts.push(`P: ${goal.primaryStart}→${goal.primaryEnd}`);
    if (goal.secondaryEnd > goal.secondaryStart) parts.push(`S: ${goal.secondaryStart}→${goal.secondaryEnd}`);
    return <span className="text-sm text-(--fg)">{parts.join('  ')}</span>;
}

interface Props {
    materialId: string;
    allGoals: TypedGoalSelect[];
    selectedGoalIds: string[];
    onChange: (goalIds: string[]) => void;
}

export const PreFarmGoalSelector: React.FC<Props> = ({ materialId, allGoals, selectedGoalIds, onChange }) => {
    const eligibleGoals = useMemo(() => {
        return allGoals.filter((g): g is ICharacterUpgradeRankGoal | ICharacterUpgradeMow => {
            if (g.type !== PersonalGoalType.UpgradeRank && g.type !== PersonalGoalType.MowAbilities) return false;
            return UpgradesService.computeRawMaterialCountForGoal(materialId, g) > 0;
        });
    }, [materialId, allGoals]);

    const allSelected = eligibleGoals.length > 0 && eligibleGoals.every(g => selectedGoalIds.includes(g.goalId));

    const toggle = (goalId: string) => {
        if (selectedGoalIds.includes(goalId)) {
            onChange(selectedGoalIds.filter(id => id !== goalId));
        } else {
            onChange([...selectedGoalIds, goalId]);
        }
    };

    const toggleAll = () => {
        if (allSelected) {
            onChange(selectedGoalIds.filter(id => !eligibleGoals.some(g => g.goalId === id)));
        } else {
            const toAdd = eligibleGoals.map(g => g.goalId).filter(id => !selectedGoalIds.includes(id));
            onChange([...selectedGoalIds, ...toAdd]);
        }
    };

    if (eligibleGoals.length === 0) {
        return <div className="text-sm text-(--soft-fg)">No rank-up or MoW goals require this material.</div>;
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-(--soft-fg)">Goals that require this material</label>
                <Button
                    appearance="plain"
                    size="extra-small"
                    onPress={toggleAll}
                    className="text-xs text-(--primary) hover:underline">
                    {allSelected ? 'Deselect all' : 'Select all'}
                </Button>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-(--border) p-2">
                {eligibleGoals.map(goal => {
                    const checked = selectedGoalIds.includes(goal.goalId);
                    const count = UpgradesService.computeRawMaterialCountForGoal(materialId, goal);
                    return (
                        <label
                            key={goal.goalId}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-(--neutral)">
                            <input
                                type="checkbox"
                                className="h-4 w-4 shrink-0"
                                checked={checked}
                                onChange={() => toggle(goal.goalId)}
                            />
                            {goal.include ? (
                                <Play className="size-3.5 shrink-0 text-(--primary)" />
                            ) : (
                                <Pause className="size-3.5 shrink-0 text-(--soft-fg)" />
                            )}
                            <UnitShardIcon icon={goal.unitRoundIcon} width={28} height={28} name={goal.unitName} />
                            <span className="min-w-0 shrink-0 text-sm font-medium text-(--fg)">{goal.unitName}</span>
                            <GoalSummary goal={goal} />
                            <span className="ml-auto shrink-0 text-xs text-(--soft-fg) tabular-nums">×{count}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};
