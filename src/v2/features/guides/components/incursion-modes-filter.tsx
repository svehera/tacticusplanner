import React from 'react';

import { IMenuOption } from 'src/v2/models/menu-option';

import { MultipleSelect } from '@/fsd/5-shared/ui/input/multiple-select';

import { mowsData } from '@/fsd/4-entities/mow';

interface Props {
    selectedModes: string[];
    updateSelection: (value: string[]) => void;
}

export const IncursionModesFilter: React.FC<Props> = ({ selectedModes, updateSelection }) => {
    const options: IMenuOption[] = mowsData.map(m => ({
        value: m.id,
        label: m.name,
        selected: false,
    }));
    return (
        <>
            <MultipleSelect
                label="MoWs"
                selected={selectedModes}
                options={options}
                optionsChange={updateSelection}
                maxWidth={300}
            />
        </>
    );
};
