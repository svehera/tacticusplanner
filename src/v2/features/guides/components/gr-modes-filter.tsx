import React from 'react';
import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { guildRaidBosses, guildRaidPrimes } from 'src/v2/features/teams/teams.constants';

interface Props {
    selectedModes: string[];
    updateSelection: (value: string[]) => void;
}

export const GuildRaidsModesFilter: React.FC<Props> = ({ selectedModes, updateSelection }) => {
    return (
        <>
            <MultipleSelect
                label="Guild Raid Boss"
                selected={selectedModes}
                options={guildRaidBosses}
                optionsChange={updateSelection}
                minWidth={200}
                maxWidth={200}
            />
            <MultipleSelect
                label="Mows"
                selected={selectedModes}
                options={guildRaidPrimes}
                optionsChange={updateSelection}
                maxWidth={300}
            />
        </>
    );
};
