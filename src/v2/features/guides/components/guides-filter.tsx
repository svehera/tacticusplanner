import { TextField } from '@mui/material';
import Button from '@mui/material/Button';
import React, { ChangeEvent, useCallback, useState } from 'react';

import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { UnitsAutocomplete } from 'src/v2/components/inputs/units-autocomplete';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { GuildRaidsModesFilter } from 'src/v2/features/guides/components/gr-modes-filter';
import { IncursionModesFilter } from 'src/v2/features/guides/components/incursion-modes-filter';
import { LreModesFilter } from 'src/v2/features/guides/components/lre-modes-filter';
import { IGuideFilter } from 'src/v2/features/guides/guides.models';
import { anyOption, gameModesForGuides, gwSubModes, taSubModes } from 'src/v2/features/teams/teams.constants';
import { GameMode } from 'src/v2/features/teams/teams.enums';

interface Props {
    units: IUnit[];
    filter: IGuideFilter;
    applyFilters: (filter: IGuideFilter) => void;
}

export const GuidesFilter: React.FC<Props> = ({ units, applyFilters, filter }) => {
    const [filtersChanged, setFiltersChanged] = useState<boolean>(false);

    const [nameFilter, setNameFilter] = useState<string>(filter.createdBy ?? '');
    const [gameMode, setGameMode] = useState<GameMode | 'any'>(filter.primaryMod ?? 'any');
    const [selectedSubModes, setSelectedSubModes] = useState<string[]>(filter.subMods ?? []);
    const [selectedUnits, setSelectedUnits] = useState<IUnit[]>(
        (filter.unitIds?.map(x => units.find(unit => unit.id === x)) as IUnit[]) ?? []
    );

    const apply = () => {
        applyFilters({
            createdBy: nameFilter ? nameFilter : undefined,
            primaryMod: gameMode !== 'any' ? gameMode : undefined,
            subMods: selectedSubModes.length ? selectedSubModes : undefined,
            unitIds: selectedUnits.length ? selectedUnits.map(x => x.id) : undefined,
        });
        setFiltersChanged(false);
    };

    const updateSelectedMod = (values: string[]) => {
        if (values[0] !== gameMode) {
            setGameMode(values[0] as GameMode);
            setSelectedSubModes([]);
            setFiltersChanged(true);
        }
    };

    const updateSelectedSubMods = (values: string[]) => {
        setSelectedSubModes(values);
        setFiltersChanged(true);
    };

    const updateSelectedUnits = (values: IUnit[]) => {
        setSelectedUnits(values);
        setFiltersChanged(true);
    };

    const onFilterTextBoxChanged = useCallback((change: ChangeEvent<HTMLInputElement>) => {
        setNameFilter(change.target.value);
        setFiltersChanged(true);
    }, []);

    return (
        <div className="flex-box gap10 wrap">
            <TextField
                style={{ minWidth: 200 }}
                label="Created By"
                variant="outlined"
                onChange={onFilterTextBoxChanged}
            />
            <UnitsAutocomplete
                label="Chracters & MoWs"
                style={{ maxWidth: 250 }}
                unit={selectedUnits}
                options={units}
                onUnitsChange={updateSelectedUnits}
                multiple
            />

            <MultipleSelect
                label="Game mode"
                selected={[gameMode]}
                options={[anyOption, ...gameModesForGuides]}
                multiple={false}
                optionsChange={updateSelectedMod}
                minWidth={200}
                maxWidth={200}
            />
            {gameMode === GameMode.guildRaids && (
                <GuildRaidsModesFilter selectedModes={selectedSubModes} updateSelection={updateSelectedSubMods} />
            )}

            {gameMode === GameMode.tournamentArena && (
                <MultipleSelect
                    label="TA mode"
                    selected={selectedSubModes}
                    options={taSubModes}
                    optionsChange={updateSelectedSubMods}
                    minWidth={250}
                    maxWidth={250}
                />
            )}

            {gameMode === GameMode.guildWar && (
                <MultipleSelect
                    label="GW mode"
                    selected={selectedSubModes}
                    options={gwSubModes}
                    optionsChange={updateSelectedSubMods}
                    minWidth={200}
                    maxWidth={200}
                />
            )}

            {gameMode === GameMode.legendaryRelease && (
                <LreModesFilter selectedModes={selectedSubModes} updateSelection={updateSelectedSubMods} />
            )}

            {gameMode === GameMode.incursion && (
                <IncursionModesFilter selectedModes={selectedSubModes} updateSelection={updateSelectedSubMods} />
            )}

            <Button onClick={apply} disabled={!filtersChanged}>
                Apply filters
            </Button>
        </div>
    );
};
