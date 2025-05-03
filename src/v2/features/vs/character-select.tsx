import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';

import { StaticDataService } from 'src/services';
import { getImageUrl } from 'src/shared-logic/functions';

import { FlexBox } from '@/fsd/5-shared/ui';

import { CharacterShardIcon } from '@/fsd/4-entities/character';

interface Props {
    label: string;
    idsAndNames: string[];
    value: string;
    valueChanges: (value: string) => void;
}

/** A drop-down selector for characters. */
export const CharacterSelect: React.FC<Props> = ({ label, idsAndNames, value, valueChanges }) => {
    const getNpcPortrait = (npc: string) => {
        const imageUrl = getImageUrl(StaticDataService.getNpcIconPath(npc));
        return <img src={imageUrl} width={20} height={30} />;
    };
    const getImageComponent = (id: string) => {
        const unit = StaticDataService.unitsData.find(unit => unit.id === id);
        if (unit != undefined) {
            return <CharacterShardIcon icon={unit.icon} name={unit.name} height={30} width={30} tooltip={unit.name} />;
        } else {
            return getNpcPortrait(id);
        }
    };
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<string> label={label} value={value} onChange={event => valueChanges(event.target.value)}>
                {idsAndNames.map(str => (
                    <MenuItem key={str} value={str}>
                        <FlexBox gap={5}>
                            <span>
                                {getImageComponent(str)} {str}
                            </span>
                        </FlexBox>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
