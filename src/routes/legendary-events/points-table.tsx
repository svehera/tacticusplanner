import React, { ChangeEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    CellClassParams,
    ColDef,
    ColGroupDef,
    ICellRendererParams,
    ITooltipParams,
    RowClassParams,
    RowStyle,
    ValueFormatterParams,
} from 'ag-grid-community';

import {
    ICharacter2,
    ILegendaryEvent,
    ILegendaryEventSelectedTeams,
    ILegendaryEventTrack,
    SelectedTeams,
} from '../../models/interfaces';
import { LegendaryEventEnum, Rank, Rarity } from '../../models/enums';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import { fitGridOnWindowResize, rankToString } from '../../shared-logic/functions';
import { sum, uniq } from 'lodash';
import { CharactersSelection, ITableRow } from './legendary-events.interfaces';
import { StoreContext } from '../../reducers/store.provider';
import { CharacterTitle } from '../../shared-components/character-title';

const PointsTable = (props: {
    legendaryEvent: ILegendaryEvent;
    selectionChange: (selection: CharactersSelection) => void;
    short: boolean;
}) => {
    const { legendaryEvent } = props;
    const { leSelectedTeams, viewPreferences } = useContext(StoreContext);
    const personalLegendaryEvent = useMemo<ILegendaryEventSelectedTeams>(() => {
        const legendaryEventPersonal = leSelectedTeams[legendaryEvent.id];
        return {
            id: legendaryEvent.id,
            name: LegendaryEventEnum[legendaryEvent.id],
            alpha: legendaryEventPersonal?.alpha ?? {},
            beta: legendaryEventPersonal?.beta ?? {},
            gamma: legendaryEventPersonal?.gamma ?? {},
        };
    }, [legendaryEvent.id]);

    const [selection, setSelection] = useState<CharactersSelection>(CharactersSelection.Selected);
    const [filter, setFilter] = useState('');

    const gridRef = useRef<AgGridReact>(null);

    const columnsDef: Array<ColDef | ColGroupDef> = useMemo(() => {
        const shortTable: Array<ColDef | ColGroupDef> = [
            {
                headerName: 'Position',
                field: 'position',
                maxWidth: 50,
                width: 50,
                minWidth: 50,
                sortable: true,
                sort: 'asc',
            },
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
                    },
                    {
                        field: 'totalSlots',
                        headerName: selection === 'selected' ? 'Times selected' : 'Slots',
                        width: 100,
                        sortable: true,
                    },
                ],
            },
        ];
        return props.short
            ? shortTable
            : [
                  {
                      headerName: 'Position',
                      field: 'position',
                      maxWidth: 50,
                      width: 50,
                      minWidth: 50,
                      sortable: true,
                      sort: 'asc',
                  },
                  {
                      field: 'name',
                      width: viewPreferences.hideNames ? 100 : 200,
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
                          },
                          {
                              field: 'totalSlots',
                              headerName: selection === 'selected' ? 'Times selected' : 'Slots',
                              width: 100,
                              sortable: true,
                          },
                      ],
                  },
                  {
                      headerName: legendaryEvent.alpha.name,
                      children: [
                          {
                              field: 'alphaPoints',
                              headerName: 'Points',
                              width: 100,
                              sortable: true,
                          },
                          {
                              field: 'alphaSlots',
                              headerName: selection === 'selected' ? 'Times selected' : 'Slots',
                              width: 100,
                              sortable: true,
                          },
                      ],
                  },
                  {
                      headerName: legendaryEvent.beta.name,
                      children: [
                          {
                              field: 'betaPoints',
                              headerName: 'Points',
                              width: 100,
                              sortable: true,
                          },
                          {
                              field: 'betaSlots',
                              headerName: selection === 'selected' ? 'Times selected' : 'Slots',
                              width: 100,
                              sortable: true,
                          },
                      ],
                  },
                  {
                      headerName: legendaryEvent.gamma.name,
                      children: [
                          {
                              field: 'gammaPoints',
                              headerName: 'Points',
                              width: 100,
                              sortable: true,
                          },
                          {
                              field: 'gammaSlots',
                              headerName: selection === 'selected' ? 'Times selected' : 'Slots',
                              width: 100,
                              sortable: true,
                          },
                      ],
                  },
              ];
    }, [selection]);

    const selectedChars = useMemo(() => {
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
    }, [personalLegendaryEvent.id]);

    const selectedCharsRows: ITableRow[] = useMemo(() => {
        const alpha = getPointsAndSlots(legendaryEvent.alpha, getRestrictionsByChar(personalLegendaryEvent.alpha));
        const beta = getPointsAndSlots(legendaryEvent.beta, getRestrictionsByChar(personalLegendaryEvent.beta));
        const gamma = getPointsAndSlots(legendaryEvent.gamma, getRestrictionsByChar(personalLegendaryEvent.gamma));

        return legendaryEvent.allowedUnits
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
                position: index + 1,
                className: Rank[x.rank].toLowerCase(),
                tooltip: x.name + ' - ' + Rank[x.rank ?? 0],
                alphaPoints: alpha[x.name]?.points ?? 0,
                alphaSlots: alpha[x.name]?.slots ?? 0,
                betaPoints: beta[x.name]?.points ?? 0,
                betaSlots: beta[x.name]?.slots ?? 0,
                gammaPoints: gamma[x.name]?.points ?? 0,
                gammaSlots: gamma[x.name]?.slots ?? 0,
                totalPoints: (alpha[x.name]?.points ?? 0) + (beta[x.name]?.points ?? 0) + (gamma[x.name]?.points ?? 0),
                totalSlots: (alpha[x.name]?.slots ?? 0) + (beta[x.name]?.slots ?? 0) + (gamma[x.name]?.slots ?? 0),
            }));

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
    }, [personalLegendaryEvent.id, filter]);

    const rows = useMemo<ITableRow[]>(() => {
        const chars =
            selection === 'all'
                ? legendaryEvent.allowedUnits
                : selection === 'unlocked'
                ? legendaryEvent.allowedUnits.filter(x => x.rank > Rank.Locked)
                : [];

        return chars
            .sort(
                (a, b) =>
                    b.legendaryEvents[legendaryEvent.id].totalPoints - a.legendaryEvents[legendaryEvent.id].totalPoints
            )
            .filter(x => (filter ? x.name.toLowerCase().includes(filter.toLowerCase()) : true))
            .map((x, index) => ({
                character: x,
                position: index + 1,
                className: Rank[x.rank].toLowerCase(),
                tooltip: x.name + ' - ' + Rank[x.rank ?? 0],
                alphaPoints: x.legendaryEvents[legendaryEvent.id].alphaPoints,
                alphaSlots: x.legendaryEvents[legendaryEvent.id].alphaSlots,

                betaPoints: x.legendaryEvents[legendaryEvent.id].betaPoints,
                betaSlots: x.legendaryEvents[legendaryEvent.id].betaSlots,

                gammaPoints: x.legendaryEvents[legendaryEvent.id].gammaPoints,
                gammaSlots: x.legendaryEvents[legendaryEvent.id].gammaSlots,

                totalPoints: x.legendaryEvents[legendaryEvent.id].totalPoints,
                totalSlots: x.legendaryEvents[legendaryEvent.id].totalSlots,
            }));
    }, [selection, filter]);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
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
                            props.selectionChange(value as CharactersSelection);
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
            </div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 150px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    tooltipShowDelay={100}
                    rowData={selection === 'selected' ? selectedCharsRows : rows}
                    columnDefs={columnsDef}
                    onSortChanged={() => gridRef.current?.api?.refreshCells()}
                    onFilterChanged={() => gridRef.current?.api?.refreshCells()}></AgGridReact>
            </div>
        </div>
    );
};

export default PointsTable;
