import React from 'react';
import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';
import { Difficulty } from 'src/models/enums';
import { DifficultyImage } from 'src/v2/components/images/difficulty-image';
import { FlexBox } from 'src/v2/components/flex-box';

type Props = {
    value: Difficulty;
    valueChange: (value: Difficulty) => void;
};

export const BfSectionDifficultySelect: React.FC<Props> = ({ value, valueChange }) => {
    const options = GuildWarService.gwData.difficulties.map((difficulty, index) => ({
        difficultyValue: (index + 1) as Difficulty,
        difficultyLabel: (
            <FlexBox style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <DifficultyImage difficulty={(index + 1) as Difficulty} /> {difficulty}
            </FlexBox>
        ),
    }));
    return (
        <FormControl style={{ width: 120 }}>
            <InputLabel>Section difficulty</InputLabel>
            <Select<Difficulty>
                label="Section difficulty"
                value={value}
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
