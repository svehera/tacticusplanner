import { Info } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { rankToLevel } from 'src/models/constants';

import { Rank } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { RankSelect, Select } from '@/fsd/5-shared/ui/selects';
import { Switch } from '@/fsd/5-shared/ui/switch';

const MYTHIC_PARTIAL_COUNT = 5; // 5 intermediate XP levels before full rank-up

/** Diamond3+ ranks use the Mythic partial-upgrade system instead of the .5 flag. */
function isMythicUpgrade(rank: Rank): boolean {
    return rank >= Rank.Diamond3;
}

/** Returns the XP level label for D3+ partial option N (1–5) at the given rank. */
function mythicLevelLabel(rank: Rank, n: number): string {
    const baseLevel = rankToLevel[rank as Rank] ?? 0;
    return `Level ${baseLevel + n - 1}`;
}

const MYTHIC_OPTIONS = [0, ...Array.from({ length: MYTHIC_PARTIAL_COUNT }, (_, index) => index + 1)];

interface Props {
    allowedValues: Rank[];
    startingRank: Rank;
    startingPoint5: boolean;
    startingAppliedUpgrades: number;
    onStartChange: (value: Rank, point5: boolean, appliedUpgrades: number) => void;
    rank: Rank;
    point5: boolean;
    appliedUpgrades: number;
    onChange: (value: Rank, point5: boolean, appliedUpgrades: number) => void;
}

export const RankGoalSelect: React.FC<Props> = ({
    allowedValues,
    startingRank,
    rank,
    onChange,
    point5,
    startingPoint5,
    startingAppliedUpgrades,
    appliedUpgrades,
    onStartChange,
}) => {
    const [form, setForm] = useState({
        startingRank: startingRank && allowedValues.includes(startingRank) ? startingRank! : allowedValues[0],
        rank: rank && allowedValues.includes(rank) ? rank! : allowedValues[0],
        point5,
        startingPoint5,
        appliedUpgrades,
        startingAppliedUpgrades,
    });

    useEffect(() => {
        setForm(current => ({
            ...current,
            startingRank: startingRank && allowedValues.includes(startingRank) ? startingRank! : allowedValues[0],
            rank: rank && allowedValues.includes(rank) ? rank! : allowedValues[0],
        }));
    }, [allowedValues, startingRank, rank]);

    const handleRankChange = (value: number) => {
        const mythic = isMythicUpgrade(value);
        const newApplied = mythic ? form.appliedUpgrades : 0;
        const newPoint5 = mythic ? false : form.point5;
        onChange(value, newPoint5, newApplied);
        setForm(current => ({ ...current, rank: value, point5: newPoint5, appliedUpgrades: newApplied }));
    };

    const handlePoint5Change = (checked: boolean) => {
        onChange(form.rank, checked, form.appliedUpgrades);
        setForm(current => ({ ...current, point5: checked }));
    };

    const handleAppliedUpgradesChange = (value: number) => {
        onChange(form.rank, form.point5, value);
        setForm(current => ({ ...current, appliedUpgrades: value }));
    };

    const handleStartRankChange = (value: number) => {
        const mythic = isMythicUpgrade(value);
        const newApplied = mythic ? form.startingAppliedUpgrades : 0;
        const newPoint5 = mythic ? false : form.startingPoint5;
        onStartChange(value, newPoint5, newApplied);
        setForm(current => ({
            ...current,
            startingRank: value,
            startingPoint5: newPoint5,
            startingAppliedUpgrades: newApplied,
        }));
    };

    const handleStartPoint5Change = (checked: boolean) => {
        onStartChange(form.startingRank, checked, form.startingAppliedUpgrades);
        setForm(current => ({ ...current, startingPoint5: checked }));
    };

    const handleStartAppliedUpgradesChange = (value: number) => {
        onStartChange(form.startingRank, form.startingPoint5, value);
        setForm(current => ({ ...current, startingAppliedUpgrades: value }));
    };

    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <RankSelect
                label="Starting Rank"
                rankValues={allowedValues}
                value={form.startingRank}
                valueChanges={handleStartRankChange}
            />

            <div className="flex items-center gap-2">
                {isMythicUpgrade(form.startingRank) ? (
                    <div className="flex-1">
                        <Select<number>
                            label="Upgrades done"
                            options={MYTHIC_OPTIONS}
                            value={form.startingAppliedUpgrades}
                            onChange={handleStartAppliedUpgradesChange}
                            renderOption={n =>
                                n === 0 ? 'None' : `${n} of 6 — ${mythicLevelLabel(form.startingRank, n)}`
                            }
                        />
                    </div>
                ) : (
                    <Switch isSelected={form.startingPoint5} onChange={handleStartPoint5Change}>
                        Point Five
                    </Switch>
                )}
                <AccessibleTooltip title="Starting rank, defaults to your character's current rank.">
                    <Info className="size-5 text-(--primary)" />
                </AccessibleTooltip>
            </div>

            <RankSelect
                label="Target Rank"
                rankValues={allowedValues}
                value={form.rank}
                valueChanges={handleRankChange}
            />

            <div className="flex items-center gap-2">
                {isMythicUpgrade(form.rank) ? (
                    <div className="flex-1">
                        <Select<number>
                            label="Partial target"
                            options={MYTHIC_OPTIONS}
                            value={form.appliedUpgrades}
                            onChange={handleAppliedUpgradesChange}
                            renderOption={n =>
                                n === 0 ? 'None (full rank)' : `${n} of 6 — ${mythicLevelLabel(form.rank, n)}`
                            }
                        />
                    </div>
                ) : (
                    <Switch isSelected={form.point5} onChange={handlePoint5Change}>
                        Point Five
                    </Switch>
                )}
                <AccessibleTooltip
                    title={
                        isMythicUpgrade(form.rank)
                            ? 'Each Mythic upgrade unlocks at a successive XP level. Select how many to include in this goal beyond the target rank-up.'
                            : 'When you reach a target upgrade rank, you are immediately able to apply the top row of three upgrades.\r\nIf you toggle on this switch then these upgrades will be included in your daily raids plan.'
                    }>
                    <Info className="size-5 text-(--primary)" />
                </AccessibleTooltip>
            </div>
        </div>
    );
};
