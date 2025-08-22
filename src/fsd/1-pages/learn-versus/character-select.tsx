import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';

import { FlexBox, getImageUrl } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { NpcService } from '@/fsd/4-entities/npc';

interface Props {
    label: string;
    idsAndNames: string[];
    value: string;
    valueChanges: (value: string) => void;
}

/** A drop-down selector for characters. */
export const CharacterSelect: React.FC<Props> = ({ label, idsAndNames, value, valueChanges }) => {
    const getNpcPortrait = (npc: string) => {
        const imageUrl = getImageUrl(NpcService.getNpcIconPath(npc));
        return <img src={imageUrl} width={20} height={30} />;
    };
    const getImageComponent = (id: string) => {
        const unit = CharactersService.charactersData.find(unit => unit.id === id);
        if (unit != undefined) {
            return <UnitShardIcon icon={unit.roundIcon} name={unit.name} height={30} width={30} tooltip={unit.name} />;
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
