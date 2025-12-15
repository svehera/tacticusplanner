import { Info } from '@mui/icons-material';
import { FormControlLabel, Switch } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { Rank } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { RankSelect } from '@/fsd/4-entities/character';

interface Props {
    allowedValues: Rank[];
    startingRank: Rank;
    startingPoint5: boolean;
    onStartChange: (value: Rank, point5: boolean) => void;
    rank: Rank;
    point5: boolean;
    onChange: (value: Rank, point5: boolean) => void;
}

export const RankGoalSelect: React.FC<Props> = ({
    allowedValues,
    startingRank,
    rank,
    onChange,
    point5,
    startingPoint5,
    onStartChange,
}) => {
    const [form, setForm] = useState({
        startingRank: startingRank && allowedValues.includes(startingRank) ? startingRank! : allowedValues[0],
        rank: rank && allowedValues.includes(rank) ? rank! : allowedValues[0],
        point5,
        startingPoint5,
    });

    useEffect(() => {
        setForm(curr => ({
            ...curr,
            startingRank: startingRank && allowedValues.includes(startingRank) ? startingRank! : allowedValues[0],
            rank: rank && allowedValues.includes(rank) ? rank! : allowedValues[0],
        }));
    }, [allowedValues]);

    const handleRankChange = (value: number) => {
        onChange(value, form.point5);
        setForm(curr => ({ ...curr, rank: value }));
    };

    const handlePoint5Change = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(form.rank, event.target.checked);
        setForm(curr => ({ ...curr, point5: event.target.checked }));
    };

    const handleStartRankChange = (value: number) => {
        onStartChange(value, form.startingPoint5);
        setForm(curr => ({ ...curr, startingRank: value }));
    };

    const handleStartPoint5Change = (event: React.ChangeEvent<HTMLInputElement>) => {
        onStartChange(form.startingRank, event.target.checked);
        setForm(curr => ({ ...curr, startingPoint5: event.target.checked }));
    };

    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <RankSelect
                label={'Starting Rank'}
                rankValues={allowedValues}
                value={form.startingRank}
                valueChanges={handleStartRankChange}
            />

            <div className="flex items-center">
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
            <div className="flex items-center">
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
                <AccessibleTooltip
                    title={
                        'When you reach a target upgrade rank, you are immediately able to apply the top row of three upgrades.\r\nIf you toggle on this switch then these upgrades will be included in your daily raids plan.'
                    }>
                    <Info color="primary" />
                </AccessibleTooltip>
            </div>
        </div>
    );
};
