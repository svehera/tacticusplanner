import React, { useContext, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { CellClassParams, ColDef, ColGroupDef, ICellRendererParams, ITooltipParams } from 'ag-grid-community';

import {
    ICharacter2,
    ILegendaryEventSelectedTeams,
    ILegendaryEventTrack,
    ILreTeam,
    SelectedTeams,
} from 'src/models/interfaces';
import { LegendaryEventEnum, Rank } from 'src/models/enums';
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
import { StoreContext } from 'src/reducers/store.provider';
import { CharacterTitle } from 'src/shared-components/character-title';
import { getLegendaryEvent } from 'src/models/constants';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import { CharacterImage } from 'src/shared-components/character-image';
import OutlinedInput from '@mui/material/OutlinedInput';
import { isMobile } from 'react-device-detect';
import { StaticDataService } from 'src/services';
import { ValueGetterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import { RarityImage } from 'src/shared-components/rarity-image';
import { RankImage } from 'src/shared-components/rank-image';

export const MasterTable = () => {
    const [activeLegendaryEvents, setActiveLegendaryEvents] = React.useState<LegendaryEventEnum[]>(
        StaticDataService.activeLres.map(x => x.lre!.id)
    );

    const { leSelectedTeams, characters } = useContext(StoreContext);
    const getSelectedTeams = (eventId: LegendaryEventEnum): ILreTeam[] => {
        const { teams } = leSelectedTeams[eventId] ?? { teams: [] };
        return teams;
    };
    const [filter, setFilter] = useState('');

    const getSelectedChars = (eventId: LegendaryEventEnum) => {
        const teams = getSelectedTeams(eventId);
        return uniq(teams.flatMap(t => t.charactersIds));
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
            const teams = getSelectedTeams(eventId);
            const selectedChars = getSelectedChars(eventId);

            const alpha = getPointsAndSlots(
                legendaryEvent.alpha,
                getRestrictionsByChar(teams.filter(t => t.section === 'alpha'))
            );
            const beta = getPointsAndSlots(
                legendaryEvent.beta,
                getRestrictionsByChar(teams.filter(t => t.section === 'beta'))
            );
            const gamma = getPointsAndSlots(
                legendaryEvent.gamma,
                getRestrictionsByChar(teams.filter(t => t.section === 'gamma'))
            );

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

        function getRestrictionsByChar(selectedTeams: ILreTeam[]): Record<string, string[]> {
            const result: Record<string, string[]> = {};

            for (const team of selectedTeams) {
                team.charactersIds.forEach(character => {
                    if (!result[character]) {
                        result[character] = [];
                    }
                    result[character] = uniq([...result[character], ...team.restrictionsIds]);
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
                    points: sum(restrictions.map(x => track.getRestrictionPoints(x))),
                };
            }
            return result;
        }
    }, [filter, activeLegendaryEvents]);

    const [selection, setSelection] = useState<CharactersSelection>(
        selectedCharsRows.length ? CharactersSelection.Selected : CharactersSelection.All
    );

    const gridRef = useRef<AgGridReact>(null);

    const columnsDef: Array<ColDef | ColGroupDef> = useMemo(() => {
        return [
            {
                headerName: 'Character',
                pinned: !isMobile,
                openByDefault: !isMobile,
                cellClass: (params: CellClassParams<ITableRow>) => params.data?.className,
                tooltipValueGetter: (params: ITooltipParams<ITableRow>) => params.data?.tooltip,
                children: [
                    {
                        headerName: '#',
                        colId: 'rowNumber',
                        valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
                        maxWidth: 50,
                        width: 50,
                        pinned: !isMobile,
                    },
                    {
                        headerName: 'Name',
                        width: isMobile ? 75 : 180,
                        pinned: !isMobile,
                        cellRenderer: (props: ICellRendererParams<ITableRow>) => {
                            const character = props.data?.character;
                            if (character) {
                                return (
                                    <CharacterTitle
                                        character={character}
                                        hideName={isMobile}
                                        short={true}
                                        imageSize={30}
                                    />
                                );
                            }
                        },
                        cellClass: (params: CellClassParams<ITableRow>) => params.data?.className,
                        tooltipValueGetter: (params: ITooltipParams<ITableRow>) => params.data?.tooltip,
                    },
                    {
                        headerName: 'Rarity',
                        width: 80,
                        columnGroupShow: 'open',
                        pinned: !isMobile,
                        valueGetter: (props: ValueGetterParams<ITableRow>) => {
                            return props.data?.character.rarity;
                        },
                        cellRenderer: (props: ICellRendererParams<ITableRow>) => {
                            const rarity = props.value ?? 0;
                            return <RarityImage rarity={rarity} />;
                        },
                    },
                    {
                        headerName: 'Rank',
                        width: 80,
                        columnGroupShow: 'open',
                        pinned: !isMobile,
                        valueGetter: (props: ValueGetterParams<ITableRow>) => {
                            return props.data?.character.rank;
                        },
                        cellRenderer: (props: ICellRendererParams<ITableRow>) => {
                            const rank = props.value ?? 0;
                            return <RankImage rank={rank} />;
                        },
                    },
                ],
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
                    positions: index + 1,
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
                        value={selection}
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
                        renderValue={selected =>
                            selected
                                .map(x => {
                                    return LegendaryEventEnum[x];
                                })
                                .join(', ')
                        }>
                        {StaticDataService.activeLres.map(x => (
                            <MenuItem key={x.lre!.id} value={x.lre!.id}>
                                <Checkbox checked={activeLegendaryEvents.indexOf(x.lre!.id) > -1} />
                                <ListItemIcon>
                                    <CharacterImage icon={x.icon} imageSize={30} />
                                </ListItemIcon>
                                <ListItemText primary={x.name} />
                            </MenuItem>
                        ))}

                        <Divider />

                        {StaticDataService.inactiveLres.map(x => (
                            <MenuItem key={x.lre!.id} value={x.lre!.id}>
                                <Checkbox checked={activeLegendaryEvents.indexOf(x.lre!.id) > -1} />
                                <ListItemIcon>
                                    <CharacterImage icon={x.icon} imageSize={30} />
                                </ListItemIcon>
                                <ListItemText primary={x.name} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {selection !== CharactersSelection.Selected && (
                    <span>
                        Take this list with the grain of salt, not everyone who scores the most points is the best LRE
                        character
                    </span>
                )}
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
