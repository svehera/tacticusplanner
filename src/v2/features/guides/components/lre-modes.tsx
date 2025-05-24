import React, { useEffect, useMemo, useState } from 'react';

import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { IMenuOption } from 'src/v2/models/menu-option';

import { isCharacter } from '@/fsd/4-entities/unit/units.functions';

import { IUnit } from 'src/v2/features/characters/characters.models';
import { getLre, getLreGuideData, lreCharacters } from 'src/v2/features/guides/guides.contstants';
import { LreCharacter } from 'src/v2/features/guides/guides.enums';
import { lreSections } from 'src/v2/features/teams/teams.constants';

interface Props {
    units: IUnit[];
    filterUnits: (filtered: IUnit[]) => void;
    selectedModes: string[];
    updateSelection: (value: string[]) => void;
}

export const LreModes: React.FC<Props> = ({ selectedModes, updateSelection, units, filterUnits }) => {
    const [character, setCharacter] = useState<LreCharacter>(() => {
        return (lreCharacters.find(x => x.value === selectedModes[0])?.value as LreCharacter) ?? LreCharacter.vitruvius;
    });
    const [section, setSection] = useState<string>(() => {
        return selectedModes[1]?.replace(character, '') ?? '_alpha';
    });
    const [tracks, setTracks] = useState<string[]>(selectedModes.filter(x => x.includes(character + '_')));
    const { allowedUnits } = useMemo(
        () => getLreGuideData([character, character + section, ...tracks], units.filter(isCharacter)),
        [character, section, tracks]
    );

    const lre = getLre(character);
    const lreTracks = useMemo<IMenuOption[]>(() => {
        switch (section) {
            case '_alpha':
                return [
                    ...lre.alpha.unitsRestrictions.map((r, index) => ({
                        value: character + '_alpha_' + index,
                        label: `${r.name} (${r.points})`,
                        selected: false,
                    })),
                ];
            case '_beta':
                return [
                    ...lre.beta.unitsRestrictions.map((r, index) => ({
                        value: character + '_beta_' + index,
                        label: `${r.name} (${r.points})`,
                        selected: false,
                    })),
                ];

            case '_gamma':
                return [
                    ...lre.gamma.unitsRestrictions.map((r, index) => ({
                        value: character + '_gamma_' + index,
                        label: `${r.name} (${r.points})`,
                        selected: false,
                    })),
                ];

            default:
                return [];
        }
    }, [section, character]);

    const handleCharacterChange = (value: string[]) => {
        setTracks([]);
        updateSelection([]);
        setCharacter(value[0] as LreCharacter);
    };

    const handleSectionChange = (value: string[]) => {
        setTracks([]);
        setSection(value[0]);
        updateSelection([]);
    };

    const handleTrackChange = (value: string[]) => {
        setTracks(value);
        if (value.length) {
            updateSelection([character, character + section, ...value]);
        } else {
            updateSelection([]);
        }
    };

    useEffect(() => {
        filterUnits(units.filter(x => allowedUnits.includes(x.id)));
    }, [allowedUnits]);

    return (
        <>
            <div className="flex-box gap5">
                <MultipleSelect
                    multiple={false}
                    label="Event"
                    selected={[character]}
                    options={lreCharacters}
                    optionsChange={handleCharacterChange}
                    minWidth={150}
                />
                <MultipleSelect
                    multiple={false}
                    label="Section"
                    selected={[section]}
                    options={lreSections}
                    optionsChange={handleSectionChange}
                    minWidth={150}
                />
                <MultipleSelect
                    multiple={true}
                    selected={tracks}
                    label="Tracks"
                    options={lreTracks}
                    optionsChange={handleTrackChange}
                    minWidth={150}
                />
            </div>
            {!!allowedUnits.length && <span>Available characters - {allowedUnits.length}</span>}
        </>
    );
};
