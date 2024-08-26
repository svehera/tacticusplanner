import React, { useMemo, useState } from 'react';
import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { IMenuOption } from 'src/v2/models/menu-option';
import { getLre, lreCharacters } from 'src/v2/features/guides/guides.contstants';
import { LreCharacter } from 'src/v2/features/guides/guides.enums';
import { anyOption, lreSections } from 'src/v2/features/teams/teams.constants';

interface Props {
    selectedModes: string[];
    updateSelection: (value: string[]) => void;
}

export const LreModesFilter: React.FC<Props> = ({ selectedModes, updateSelection }) => {
    const [legendaryEvent, setLegendaryEvent] = useState<LreCharacter | 'any'>(() => {
        return (lreCharacters.find(x => x.value === selectedModes[0])?.value as LreCharacter) ?? 'any';
    });

    const [section, setSection] = useState<string | 'any'>(() => {
        return lreSections.find(x => selectedModes.some(m => m.endsWith(x.value)))?.value ?? 'any';
    });

    const [tracks, setTracks] = useState<string[]>(
        selectedModes.filter(x => ['0', '1', '2', '3', '4'].includes(x[x.length - 1]))
    );

    const lre = legendaryEvent !== 'any' ? getLre(legendaryEvent) : null;
    const lreTracks = useMemo<IMenuOption[]>(() => {
        if (!lre) {
            return [];
        }

        switch (section) {
            case '_alpha':
                return [
                    ...lre.alpha.unitsRestrictions.map((r, index) => ({
                        value: legendaryEvent + '_alpha_' + index,
                        label: `${r.name} (${r.points})`,
                        selected: false,
                    })),
                ];
            case '_beta':
                return [
                    ...lre.beta.unitsRestrictions.map((r, index) => ({
                        value: legendaryEvent + '_beta_' + index,
                        label: `${r.name} (${r.points})`,
                        selected: false,
                    })),
                ];

            case '_gamma':
                return [
                    ...lre.gamma.unitsRestrictions.map((r, index) => ({
                        value: legendaryEvent + '_gamma_' + index,
                        label: `${r.name} (${r.points})`,
                        selected: false,
                    })),
                ];

            default:
                return [];
        }
    }, [section, legendaryEvent]);

    const handleLegendaryEventChange = ([value]: string[]) => {
        if (value === 'any') {
            setLegendaryEvent('any');
            setSection('any');
            setTracks([]);
            updateSelection([]);
        } else {
            setLegendaryEvent(value as LreCharacter);
            setSection('any');
            setTracks([]);
            updateSelection([value]);
        }
    };

    const handleSectionChange = ([value]: string[]) => {
        if (value === 'any') {
            setSection('any');
            setTracks([]);
            updateSelection([legendaryEvent]);
        } else {
            setSection(value);
            setTracks([]);
            updateSelection([legendaryEvent + value]);
        }
    };

    const handleTrackChange = (value: string[]) => {
        setTracks(value);
        if (value.length) {
            updateSelection(value);
        } else {
            updateSelection([legendaryEvent + section]);
        }
    };

    return (
        <>
            <MultipleSelect
                multiple={false}
                label="Legendary Event"
                selected={[legendaryEvent]}
                options={[anyOption, ...lreCharacters]}
                optionsChange={handleLegendaryEventChange}
                minWidth={150}
            />
            {legendaryEvent !== 'any' && (
                <MultipleSelect
                    multiple={false}
                    label="Section"
                    selected={[section]}
                    options={[anyOption, ...lreSections]}
                    optionsChange={handleSectionChange}
                    minWidth={150}
                />
            )}
            {section !== 'any' && (
                <MultipleSelect
                    multiple={true}
                    selected={tracks}
                    label="Tracks"
                    options={lreTracks}
                    optionsChange={handleTrackChange}
                    minWidth={150}
                />
            )}
        </>
    );
};
