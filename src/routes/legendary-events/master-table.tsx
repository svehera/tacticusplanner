import React, { useContext, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { CellClassParams, ColDef, ColGroupDef, ICellRendererParams, ITooltipParams } from 'ag-grid-community';

import {
    ICharacter2,
    ILegendaryEventSelectedTeams,
    ILegendaryEventTrack,
    SelectedTeams,
} from '../../models/interfaces';
import { LegendaryEventEnum, Rank } from '../../models/enums';
import {
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    FormLabel,
    ListItemIcon,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    SelectChangeEvent,
    TextField,
} from '@mui/material';
import { groupBy, map, sum, uniq } from 'lodash';
import { CharactersSelection, ITableRow } from './legendary-events.interfaces';
import { StoreContext } from '../../reducers/store.provider';
import { CharacterTitle } from '../../shared-components/character-title';
import { getLegendaryEvent } from '../../models/constants';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import { CharacterImage } from '../../shared-components/character-image';
import OutlinedInput from '@mui/material/OutlinedInput';
import { isMobile } from 'react-device-detect';

export const MasterTable = () => {
    const [activeLegendaryEvents, setActiveLegendaryEvents] = React.useState<LegendaryEventEnum[]>([
        LegendaryEventEnum.Ragnar,
        LegendaryEventEnum.Vitruvius,
    ]);

    const { leSelectedTeams, viewPreferences, characters } = useContext(StoreContext);
    const getPersonalLegendaryEvent = (eventId: LegendaryEventEnum): ILegendaryEventSelectedTeams => {
        const legendaryEventPersonal = leSelectedTeams[eventId];
        return {
            id: eventId,
            name: LegendaryEventEnum[eventId],
            alpha: legendaryEventPersonal?.alpha ?? {},
            beta: legendaryEventPersonal?.beta ?? {},
            gamma: legendaryEventPersonal?.gamma ?? {},
        };
    };

    const [selection, setSelection] = useState<CharactersSelection>(CharactersSelection.Selected);
    const [filter, setFilter] = useState('');

    const gridRef = useRef<AgGridReact>(null);

    const columnsDef: Array<ColDef | ColGroupDef> = useMemo(() => {
        return [
            {
                field: 'name',
                width: viewPreferences.hideNames ? 150 : 250,
                sortable: true,
                cellRenderer: (props: ICellRendererParams<ITableRow>) => {
                    const row = props.data;
                    if (row) {
                        return (
                            <CharacterTitle
                                character={row.character}
                                imageSize={30}
                                hideName={viewPreferences.hideNames}
                            />
                        );
                    }
                },
                cellClass: (params: CellClassParams<ITableRow>) => params.data?.className,
                tooltipValueGetter: (params: ITooltipParams<ITableRow>) => params.data?.tooltip,
            },
            {
                headerName: 'Total',
                children: [
                    {
                        field: 'totalPoints',
                        headerName: 'Points',
                        width: 100,
                        sortable: true,
                        sort: 'desc',
                        cellStyle: { textAlign: 'right' },
                    },
                    {
                        field: 'totalSlots',
                        headerName: selection === 'selected' ? 'Times selected' : 'Slots',
                        width: 100,
                        sortable: true,
                    },
                ],
            },
            ...activeLegendaryEvents.map(eventId => ({
                headerName: LegendaryEventEnum[eventId],
                children: [
                    {
                        field: eventId + 'points',
                        headerName: 'Points',
                        width: 100,
                        sortable: true,
                        cellStyle: { textAlign: 'right' },
                    },
                    {
                        field: eventId + 'slots',
                        headerName: selection === 'selected' ? 'Times selected' : 'Slots',
                        width: 100,
                        sortable: true,
                    },
                ],
            })),
        ];
    }, [selection, activeLegendaryEvents]);

    const getSelectedChars = (eventId: LegendaryEventEnum) => {
        const legendaryEvent = getLegendaryEvent(eventId, characters);
        const personalLegendaryEvent = getPersonalLegendaryEvent(eventId);
        const alphaSection = legendaryEvent.alpha.unitsRestrictions.map(x => x.name);
        const betaSection = legendaryEvent.beta.unitsRestrictions.map(x => x.name);
        const gammaSection = legendaryEvent.gamma.unitsRestrictions.map(x => x.name);

        const alphaChars = Object.entries(personalLegendaryEvent.alpha)
            .filter(([key]) => alphaSection.includes(key))
            .map(([_, value]) => value)
            .flat();
        const betaChars = Object.entries(personalLegendaryEvent.beta)
            .filter(([key]) => betaSection.includes(key))
            .map(([_, value]) => value)
            .flat();
        const gammaChars = Object.entries(personalLegendaryEvent.gamma)
            .filter(([key]) => gammaSection.includes(key))
            .map(([_, value]) => value)
            .flat();

        return uniq([...alphaChars, ...betaChars, ...gammaChars]);
    };

    const selectedCharsRows: ITableRow[] = useMemo(() => {
        const temp: Array<{
            character: ICharacter2;
            characterId: string;
            eventId: LegendaryEventEnum;
            points: number;
            slots: number;
        }> = [];
        activeLegendaryEvents.forEach(eventId => {
            const legendaryEvent = getLegendaryEvent(eventId, characters);
            const personalLegendaryEvent = getPersonalLegendaryEvent(eventId);
            const selectedChars = getSelectedChars(eventId);

            const alpha = getPointsAndSlots(legendaryEvent.alpha, getRestrictionsByChar(personalLegendaryEvent.alpha));
            const beta = getPointsAndSlots(legendaryEvent.beta, getRestrictionsByChar(personalLegendaryEvent.beta));
            const gamma = getPointsAndSlots(legendaryEvent.gamma, getRestrictionsByChar(personalLegendaryEvent.gamma));

            const eventCharacters = legendaryEvent.allowedUnits
                .filter(x => selectedChars.includes(x.name))
                .sort((a, b) => {
                    const aTotal =
                        (alpha[a.name]?.points ?? 0) + (beta[a.name]?.points ?? 0) + (gamma[a.name]?.points ?? 0);
                    const bTotal =
                        (alpha[b.name]?.points ?? 0) + (beta[b.name]?.points ?? 0) + (gamma[b.name]?.points ?? 0);

                    return bTotal - aTotal;
                })
                .filter(x => (filter ? x.name.toLowerCase().includes(filter.toLowerCase()) : true))
                .map((x, index) => ({
                    character: x,
                    characterId: x.name,
                    eventId,
                    // className: Rank[x.rank].toLowerCase(),
                    // tooltip: x.name + ' - ' + Rank[x.rank ?? 0],
                    points: (alpha[x.name]?.points ?? 0) + (beta[x.name]?.points ?? 0) + (gamma[x.name]?.points ?? 0),
                    slots: (alpha[x.name]?.slots ?? 0) + (beta[x.name]?.slots ?? 0) + (gamma[x.name]?.slots ?? 0),
                }));

            temp.push(...eventCharacters);
        });

        const grouped = groupBy(temp, 'characterId');

        return map(grouped, items => {
            const charData = {
                character: items[0].character,
                className: Rank[items[0].character.rank].toLowerCase(),
                tooltip: items[0].character.name + ' - ' + Rank[items[0].character.rank ?? 0],
                totalPoints: sum(items.map(x => x.points)),
                totalSlots: sum(items.map(x => x.slots)),
            };
            items.forEach(item => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                charData[`${item.eventId}points`] = item.points;
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                charData[`${item.eventId}slots`] = item.slots;
            });

            return charData;
        }) as any;

        function getRestrictionsByChar(selectedTeams: SelectedTeams): Record<string, string[]> {
            const result: Record<string, string[]> = {};

            for (const key in selectedTeams) {
                const values = selectedTeams[key];
                values.forEach(value => {
                    if (!result[value]) {
                        result[value] = [];
                    }
                    result[value].push(key);
                });
            }
            return result;
        }

        function getPointsAndSlots(
            track: ILegendaryEventTrack,
            restrictionsByChar: Record<string, string[]>
        ): Record<
            string,
            {
                name: string;
                slots: number;
                points: number;
            }
        > {
            const result: Record<
                string,
                {
                    name: string;
                    slots: number;
                    points: number;
                }
            > = {};

            for (const key in restrictionsByChar) {
                const restrictions = restrictionsByChar[key];
                result[key] = {
                    name: key,
                    slots: restrictionsByChar[key].length,
                    points: sum(restrictions.map(x => track.getRestrictionPoints(x))) + track.killPoints,
                };
            }
            return result;
        }
    }, [filter, activeLegendaryEvents]);

    const rows = useMemo<ITableRow[]>(() => {
        const temp: Array<{
            character: ICharacter2;
            characterId: string;
            eventId: LegendaryEventEnum;
            points: number;
            slots: number;
        }> = [];

        activeLegendaryEvents.forEach(eventId => {
            const legendaryEvent = getLegendaryEvent(eventId, characters);
            const chars =
                selection === 'all'
                    ? legendaryEvent.allowedUnits
                    : selection === 'unlocked'
                    ? legendaryEvent.allowedUnits.filter(x => x.rank > Rank.Locked)
                    : [];
            const eventCharacters = chars
                .sort(
                    (a, b) =>
                        b.legendaryEvents[legendaryEvent.id].totalPoints -
                        a.legendaryEvents[legendaryEvent.id].totalPoints
                )
                .filter(x => (filter ? x.name.toLowerCase().includes(filter.toLowerCase()) : true))
                .map((x, index) => ({
                    character: x,
                    characterId: x.name,
                    eventId,
                    // className: Rank[x.rank].toLowerCase(),
                    // tooltip: x.name + ' - ' + Rank[x.rank ?? 0],
                    points: x.legendaryEvents[legendaryEvent.id].totalPoints,
                    slots: x.legendaryEvents[legendaryEvent.id].totalSlots,
                }));

            temp.push(...eventCharacters);
        });
        const grouped = groupBy(temp, 'characterId');

        return map(grouped, items => {
            const charData = {
                character: items[0].character,
                className: Rank[items[0].character.rank].toLowerCase(),
                tooltip: items[0].character.name + ' - ' + Rank[items[0].character.rank ?? 0],
                totalPoints: sum(items.map(x => x.points)),
                totalSlots: sum(items.map(x => x.slots)),
            };
            items.forEach(item => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                charData[`${item.eventId}points`] = item.points;
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                charData[`${item.eventId}slots`] = item.slots;
            });

            return charData;
        }) as any;
    }, [selection, filter, activeLegendaryEvents]);

    const handleLESelectChange = (event: SelectChangeEvent<typeof activeLegendaryEvents>) => {
        const {
            target: { value },
        } = event;
        if (Array.isArray(value)) {
            setActiveLegendaryEvents(value);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, flexDirection: isMobile ? 'column' : 'row' }}>
                <TextField
                    sx={{ margin: '10px', width: '300px' }}
                    label="Quick Filter"
                    variant="outlined"
                    onChange={event => setFilter(event.target.value)}
                />
                <FormControl>
                    <FormLabel id="demo-radio-buttons-group-label" style={{ fontWeight: 700 }}>
                        Characters Selection
                    </FormLabel>
                    <RadioGroup
                        style={{ display: 'flex', flexDirection: 'row' }}
                        aria-labelledby="demo-radio-buttons-group-label"
                        defaultValue={CharactersSelection.Selected}
                        onChange={(_, value) => {
                            setSelection(value as CharactersSelection);
                        }}
                        name="radio-buttons-group">
                        <FormControlLabel
                            value={CharactersSelection.Selected}
                            control={<Radio />}
                            label="Only selected"
                        />
                        <FormControlLabel
                            value={CharactersSelection.Unlocked}
                            control={<Radio />}
                            label="Only unlocked"
                        />
                        <FormControlLabel value={CharactersSelection.All} control={<Radio />} label="All" />
                    </RadioGroup>
                </FormControl>
                <FormControl style={{ width: 300 }}>
                    <InputLabel>Legendary Events</InputLabel>
                    <Select
                        value={activeLegendaryEvents}
                        onChange={handleLESelectChange}
                        multiple
                        input={<OutlinedInput label="Legendary Events" />}
                        renderValue={selected => selected.map(x => LegendaryEventEnum[x]).join(', ')}>
                        <MenuItem value={LegendaryEventEnum.Ragnar}>
                            <Checkbox checked={activeLegendaryEvents.indexOf(LegendaryEventEnum.Ragnar) > -1} />
                            <ListItemIcon>
                                <CharacterImage icon={'Ragnar.png'} imageSize={30} />
                            </ListItemIcon>
                            <ListItemText primary={LegendaryEventEnum[LegendaryEventEnum.Ragnar]} />
                        </MenuItem>
                        <MenuItem value={LegendaryEventEnum.Vitruvius}>
                            <Checkbox checked={activeLegendaryEvents.indexOf(LegendaryEventEnum.Vitruvius) > -1} />
                            <ListItemIcon>
                                <CharacterImage icon={'vitruvius.png'} imageSize={30} />
                            </ListItemIcon>
                            <ListItemText primary={LegendaryEventEnum[LegendaryEventEnum.Vitruvius]} />
                        </MenuItem>
                        <Divider />
                        <MenuItem value={LegendaryEventEnum.Shadowsun}>
                            <Checkbox checked={activeLegendaryEvents.indexOf(LegendaryEventEnum.Shadowsun) > -1} />
                            <ListItemIcon>
                                <CharacterImage icon={'ShadowSun.png'} imageSize={30} />
                            </ListItemIcon>
                            <ListItemText primary={LegendaryEventEnum[LegendaryEventEnum.Shadowsun]} />
                        </MenuItem>
                        <MenuItem value={LegendaryEventEnum.AunShi}>
                            <Checkbox checked={activeLegendaryEvents.indexOf(LegendaryEventEnum.AunShi) > -1} />
                            <ListItemIcon>
                                <CharacterImage icon={'Aun-shi.png'} imageSize={30} />
                            </ListItemIcon>
                            <ListItemText primary={LegendaryEventEnum[LegendaryEventEnum.AunShi]} />
                        </MenuItem>
                    </Select>
                </FormControl>
            </div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 150px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    tooltipShowDelay={100}
                    rowData={selection === 'selected' ? selectedCharsRows : rows}
                    columnDefs={columnsDef}
                    defaultColDef={{
                        suppressMovable: true,
                    }}
                    onSortChanged={() => gridRef.current?.api?.refreshCells()}
                    onFilterChanged={() => gridRef.current?.api?.refreshCells()}></AgGridReact>
            </div>
        </div>
    );
};
