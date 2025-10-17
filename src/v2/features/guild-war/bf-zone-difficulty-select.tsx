﻿import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';

import { Difficulty } from 'src/models/enums';
import { DifficultyImage } from 'src/v2/components/images/difficulty-image';

import { Rarity } from '@/fsd/5-shared/model';
import { FlexBox } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';

import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';

type Props = {
    value: Difficulty;
    valueChange: (value: Difficulty) => void;
};

export const BfZoneDifficultySelect: React.FC<Props> = ({ value, valueChange }) => {
    const options = GuildWarService.gwData.difficulties.map((difficulty, index) => {
        const slots = GuildWarService.getDifficultyRarityCapsGrouped(index + 1);
        const rarityCaps = (
            <FlexBox gap={5}>
                {[Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
                    const slotsCount = slots[rarity];
                    if (slotsCount) {
                        return (
                            <FlexBox key={rarity} gap={3}>
                                <RarityIcon rarity={rarity} /> x{slotsCount}
                            </FlexBox>
                        );
                    }
                })}
            </FlexBox>
        );
        return {
            difficultyValue: (index + 1) as Difficulty,
            difficultyLabel: (
                <FlexBox style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <FlexBox gap={5}>
                        {difficulty} <DifficultyImage difficulty={(index + 1) as Difficulty} />
                    </FlexBox>
                    {rarityCaps}
                </FlexBox>
            ),
        };
    });

    return (
        <FormControl style={{ width: 120 }}>
            <InputLabel>Zone difficulty</InputLabel>
            <Select<Difficulty>
                label="Zone difficulty"
                value={value}
                renderValue={value => GuildWarService.gwData.difficulties[value - 1]}
                onChange={event => valueChange(+event.target.value)}>
                {options.map(option => (
                    <MenuItem key={option.difficultyValue} value={option.difficultyValue}>
                        {option.difficultyLabel}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
