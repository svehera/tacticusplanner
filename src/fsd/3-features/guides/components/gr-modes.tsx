import React, { useEffect, useMemo, useState } from 'react';

import { Faction } from '@/fsd/5-shared/model';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MultipleSelect } from '@/fsd/5-shared/ui/input/multiple-select';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUnit } from '@/fsd/3-features/characters/characters.models';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { grEncounterToFaction, guildRaidBosses, guildRaidPrimes } from '@/fsd/3-features/teams/teams.constants';

interface Props {
    units: IUnit[];
    filterUnits: (filtered: IUnit[]) => void;
    updateSelection: (value: string[]) => void;
}

export const GuildRaidsModes: React.FC<Props> = ({ updateSelection, units, filterUnits }) => {
    const [grEncounter, setGrEncounter] = useState<string>('');

    const updateEncounter = (values: string[]) => {
        setGrEncounter(values[0]);
        updateSelection(values);
    };

    const bannedFaction: Faction = useMemo(() => grEncounterToFaction[grEncounter], [grEncounter]);

    const getFaction = (unit: IUnit): Faction => {
        return unit.faction as Faction;
    };

    const allowedUnits = useMemo(() => {
        if (bannedFaction) {
            return units.filter(x => getFaction(x) !== bannedFaction);
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
            Banned faction: <span className="font-bold">{bannedFaction}</span>
        </>
    );
};
