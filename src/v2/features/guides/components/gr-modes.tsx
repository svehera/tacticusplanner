import React, { useEffect, useMemo, useState } from 'react';

import { Faction } from 'src/models/enums';
import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { grEncounterToFaction, guildRaidBosses, guildRaidPrimes } from 'src/v2/features/teams/teams.constants';

interface Props {
    units: IUnit[];
    filterUnits: (filtered: IUnit[]) => void;
    selectedModes: string[];
    updateSelection: (value: string[]) => void;
}

export const GuildRaidsModes: React.FC<Props> = ({ selectedModes, updateSelection, units, filterUnits }) => {
    const [grEncounter, setGrEncounter] = useState<string>('');

    const updateEncounter = (values: string[]) => {
        setGrEncounter(values[0]);
        updateSelection(values);
    };

    const bannedFaction: Faction = useMemo(() => grEncounterToFaction[grEncounter], [grEncounter]);

    const allowedUnits = useMemo(() => {
        if (bannedFaction) {
            return units.filter(x => x.faction !== bannedFaction);
        }
        return units;
    }, [bannedFaction]);

    useEffect(() => {
        return filterUnits(allowedUnits);
    }, [allowedUnits]);

    return (
        <>
            <div className="flex-box gap5">
                <MultipleSelect
                    multiple={false}
                    label="Guild Raid Boss"
                    selected={[grEncounter]}
                    options={guildRaidBosses}
                    optionsChange={updateEncounter}
                    minWidth={150}
                />
                <span>OR</span>
                <MultipleSelect
                    multiple={false}
                    selected={[grEncounter]}
                    label="Guild Raid Prime"
                    options={guildRaidPrimes}
                    optionsChange={updateEncounter}
                    minWidth={150}
                />
            </div>
            Banned faction: <span className="bold">{bannedFaction}</span>
        </>
    );
};
