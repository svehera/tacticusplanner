import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MultipleSelect } from '@/fsd/5-shared/ui/input/multiple-select';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { guildRaidBosses, guildRaidPrimes } from '@/fsd/3-features/teams/teams.constants';

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
