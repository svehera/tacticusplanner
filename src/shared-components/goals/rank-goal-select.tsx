import { Info } from '@mui/icons-material';
import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { rankToLevel } from 'src/models/constants';

import { Rank } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { RankSelect } from '@/fsd/4-entities/character';

const ADAMANTINE_PARTIAL_COUNT = 5; // 5 intermediate XP levels before full rank-up

function isAdamantine(rank: Rank): boolean {
    return rank >= Rank.Adamantine1;
}

/** Returns the XP level label for Adamantine partial option N (1–5) at the given rank. */
function adamantineLevelLabel(rank: Rank, n: number): string {
    const baseLevel = rankToLevel[(rank - 1) as Rank] ?? 0;
    return `Level ${baseLevel + n - 1}`;
}

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
        const newApplied = isAdamantine(value) ? form.appliedUpgrades : 0;
        onChange(value, form.point5, newApplied);
        setForm(current => ({ ...current, rank: value, appliedUpgrades: newApplied }));
    };

    const handlePoint5Change = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(form.rank, event.target.checked, form.appliedUpgrades);
        setForm(current => ({ ...current, point5: event.target.checked }));
    };

    const handleAppliedUpgradesChange = (value: number) => {
        onChange(form.rank, form.point5, value);
        setForm(current => ({ ...current, appliedUpgrades: value }));
    };

    const handleStartRankChange = (value: number) => {
        const newApplied = isAdamantine(value) ? form.startingAppliedUpgrades : 0;
        onStartChange(value, form.startingPoint5, newApplied);
        setForm(current => ({ ...current, startingRank: value, startingAppliedUpgrades: newApplied }));
    };

    const handleStartPoint5Change = (event: React.ChangeEvent<HTMLInputElement>) => {
        onStartChange(form.startingRank, event.target.checked, form.startingAppliedUpgrades);
        setForm(current => ({ ...current, startingPoint5: event.target.checked }));
    };

    const handleStartAppliedUpgradesChange = (value: number) => {
        onStartChange(form.startingRank, form.startingPoint5, value);
        setForm(current => ({ ...current, startingAppliedUpgrades: value }));
    };

    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <RankSelect
                label={'Starting Rank'}
                rankValues={allowedValues}
                value={form.startingRank}
                valueChanges={handleStartRankChange}
            />

            <div className="flex items-center gap-2">
                {isAdamantine(form.startingRank) ? (
                    <FormControl size="small" className="flex-1">
                        <InputLabel id="start-applied-label">Upgrades done</InputLabel>
                        <Select
                            labelId="start-applied-label"
                            label="Upgrades done"
                            value={form.startingAppliedUpgrades}
                            onChange={event => handleStartAppliedUpgradesChange(Number(event.target.value))}>
                            <MenuItem value={0}>
                                <em>None</em>
                            </MenuItem>
                            {Array.from({ length: ADAMANTINE_PARTIAL_COUNT }, (_, index) => index + 1).map(n => (
                                <MenuItem key={n} value={n}>
                                    {n} of 6 — {adamantineLevelLabel(form.startingRank, n)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : (
                    <FormControlLabel
                        label="Point Five"
                        control={
                            <Switch
                                checked={form.startingPoint5}
                                onChange={handleStartPoint5Change}
                                inputProps={{ 'aria-label': 'controlled' }}
                            />
                        }
                    />
                )}
                <AccessibleTooltip title={"Starting rank, defaults to your character's current rank."}>
                    <Info color="primary" />
                </AccessibleTooltip>
            </div>

            <RankSelect
                label={'Target Rank'}
                rankValues={allowedValues}
                value={form.rank}
                valueChanges={handleRankChange}
            />

            <div className="flex items-center gap-2">
                {isAdamantine(form.rank) ? (
                    <FormControl size="small" className="flex-1">
                        <InputLabel id="target-applied-label">Partial target</InputLabel>
                        <Select
                            labelId="target-applied-label"
                            label="Partial target"
                            value={form.appliedUpgrades}
                            onChange={event => handleAppliedUpgradesChange(Number(event.target.value))}>
                            <MenuItem value={0}>
                                <em>None (full rank)</em>
                            </MenuItem>
                            {Array.from({ length: ADAMANTINE_PARTIAL_COUNT }, (_, index) => index + 1).map(n => (
                                <MenuItem key={n} value={n}>
                                    {n} of 6 — {adamantineLevelLabel(form.rank, n)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : (
                    <FormControlLabel
                        label="Point Five"
                        control={
                            <Switch
                                checked={form.point5}
                                onChange={handlePoint5Change}
                                inputProps={{ 'aria-label': 'controlled' }}
                            />
                        }
                    />
                )}
                <AccessibleTooltip
                    title={
                        isAdamantine(form.rank)
                            ? 'Each Adamantine upgrade unlocks at a successive XP level. Select how many to include in this goal beyond the target rank-up.'
                            : 'When you reach a target upgrade rank, you are immediately able to apply the top row of three upgrades.\r\nIf you toggle on this switch then these upgrades will be included in your daily raids plan.'
                    }>
                    <Info color="primary" />
                </AccessibleTooltip>
            </div>
        </div>
    );
};
