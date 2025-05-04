import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { orderBy } from 'lodash';
import React, { useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDebounceValue } from 'usehooks-ts';

import { ICharacter2 } from 'src/models/interfaces';
import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { IMenuOption } from 'src/v2/models/menu-option';

import { Rarity, Alliance } from '@/fsd/5-shared/model';

import { IMow, IUnit } from 'src/v2/features/characters/characters.models';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { isCharacter, isMow } from 'src/v2/features/characters/units.functions';
import { TeamView } from 'src/v2/features/teams/components/team-view';

type Props = {
    units: IUnit[];
    team: ICharacter2[];
    activeMow: IMow | null;
    rarityCap: Rarity;
    onClose: (team: ICharacter2[], mow: IMow | null) => void;
};

type OrderBy = 'rank' | 'faction' | 'power';
type FilterBy = 'none' | 'xenos' | 'chaos' | 'imperial' | 'mows';

export const SelectTeamDialog: React.FC<Props> = ({ onClose, team, units, activeMow, rarityCap }) => {
    const [lineup, setLineup] = useState(team);
    const [mow, setMow] = useState(activeMow);
    const [quickFilter, setQuickFilter] = useDebounceValue('', 300);
    const [orderByVar, setOrderByVar] = useState<OrderBy>('power');
    const [filterByVar, setFilterByVar] = useState<FilterBy>('none');

    const cancel = () => onClose(team, activeMow);
    const select = () => onClose(lineup, mow);

    const handleCharacterSelect = (unit: IUnit) => {
        setLineup(curr => {
            if (curr.some(x => x.name === unit.name)) {
                return curr.filter(x => x.name !== unit.name);
            } else {
                if (lineup.length === 5) {
                    return curr;
                }

                const newChar = units.find(x => x.name === unit.id);

                if (newChar && isCharacter(newChar)) {
                    return [...curr, newChar];
                }

                return curr;
            }
        });

        if (isMow(unit)) {
            if (mow && mow.id) {
                if (mow.id !== unit.id) {
                    setMow(unit);
                } else {
                    setMow(null);
                }
            } else {
                setMow(unit);
            }
        }
    };

    const filteredUnits = useMemo(() => {
        const filterUnits = () => {
            const nameFiltered = !quickFilter
                ? units
                : units.filter(x => x.name.toLowerCase().includes(quickFilter.toLowerCase()));

            switch (filterByVar) {
                case 'xenos':
                    return nameFiltered.filter(x => x.alliance === Alliance.Xenos);
                case 'chaos':
                    return nameFiltered.filter(x => x.alliance === Alliance.Chaos);
                case 'imperial':
                    return nameFiltered.filter(x => x.alliance === Alliance.Imperial);
                case 'mows':
                    return nameFiltered.filter(x => isMow(x));
                case 'none':
                default:
                    return nameFiltered;
            }
        };

        const filtered = filterUnits();

        switch (orderByVar) {
            case 'rank':
                return orderBy(filtered, ['rank'], ['desc']);
            case 'power':
                return orderBy(filtered, ['power'], ['desc']);
            case 'faction':
            default:
                return filtered;
        }
    }, [units, quickFilter, orderByVar, filterByVar]);

    const orderByOptions: IMenuOption[] = [
        {
            value: 'power',
            label: 'Power',
            selected: true,
        },
        {
            value: 'rank',
            label: 'Rank',
            selected: false,
        },
        {
            value: 'faction',
            label: 'Faction',
            selected: false,
        },
    ];

    const filterByOptions: IMenuOption[] = [
        {
            value: 'none',
            label: 'None',
            selected: true,
        },
        {
            value: 'chaos',
            label: 'Chaos',
            selected: false,
        },
        {
            value: 'imperial',
            label: 'Imperial',
            selected: false,
        },
        {
            value: 'xenos',
            label: 'Xenos',
            selected: false,
        },
        {
            value: 'mows',
            label: 'MoWs',
            selected: false,
        },
    ];

    const changeOrder = (value: string[]): void => {
        setOrderByVar(value[0] as OrderBy);
    };

    const changeFilter = (value: string[]): void => {
        setFilterByVar(value[0] as FilterBy);
    };

    return (
        <Dialog open={true} onClose={cancel} fullWidth fullScreen={isMobile}>
            <DialogTitle>
                Select team
                <TeamView characters={lineup} mow={mow} onClick={handleCharacterSelect} withMow />
            </DialogTitle>
            <DialogContent>
                <br />
                <div className="flex-box gap10">
                    <TextField
                        size="small"
                        sx={{ margin: '10px', minWidth: 100, width: 220 }}
                        label="Quick Search"
                        variant="outlined"
                        onChange={event => setQuickFilter(event.target.value)}
                    />
                    <MultipleSelect
                        label="Order by"
                        multiple={false}
                        options={orderByOptions}
                        optionsChange={changeOrder}
                        size="small"
                        minWidth={100}
                    />
                    <MultipleSelect
                        label="Filter by"
                        multiple={false}
                        options={filterByOptions}
                        optionsChange={changeFilter}
                        size="small"
                        minWidth={100}
                    />
                </div>
                <CharactersGrid
                    characters={filteredUnits.map(x =>
                        isCharacter(x)
                            ? CharactersService.capCharacterAtRarity(x, rarityCap)
                            : CharactersService.capMowAtRarity(x, rarityCap)
                    )}
                    onAvailableCharacterClick={handleCharacterSelect}
                    onLockedCharacterClick={handleCharacterSelect}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={cancel}>Cancel</Button>
                <Button onClick={select}>Select</Button>
            </DialogActions>
        </Dialog>
    );
};
