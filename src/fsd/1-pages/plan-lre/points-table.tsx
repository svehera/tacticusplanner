import { Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import {
    AllCommunityModule,
    CellClassParams,
    ColDef,
    ColGroupDef,
    ICellRendererParams,
    ITooltipParams,
    ValueGetterParams,
    themeBalham,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { sum, uniq } from 'lodash';
import { useContext, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { useQueryState } from '@/fsd/5-shared/lib';
import { Rank, rankToString, Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, CharacterTitle, RankIcon } from '@/fsd/4-entities/character';

import { ILegendaryEvent, ILegendaryEventTrack, ILreTeam } from '@/fsd/3-features/lre';

import { useLreProgress } from './le-progress.hooks';
import { CharactersSelection, ITableRow, PointsCalculation } from './legendary-events.interfaces';
import { LreService } from './lre.service';

const PointsTable = (props: { legendaryEvent: ILegendaryEvent }) => {
    const { legendaryEvent } = props;
    const { leSelectedTeams } = useContext(StoreContext);
    const { model: leProgress } = useLreProgress(legendaryEvent);

    const { teams } = leSelectedTeams[legendaryEvent.id] ?? { teams: [] };

    const selectedChars = useMemo(() => {
        return uniq(
            teams.flatMap(t => t.charSnowprintIds ?? t.charactersIds ?? []).map(x => CharactersService.canonicalName(x))
        );
    }, [legendaryEvent.id, teams]);
    const [pointsCalculation, setPointsCalculation] = useQueryState<PointsCalculation>(
        'pointsCalculation',
        stringValue => (stringValue as PointsCalculation) ?? PointsCalculation.unearned,
        value => value
    );

    const [selection, setSelection] = useState<CharactersSelection>(
        selectedChars.length ? CharactersSelection.Selected : CharactersSelection.All
    );
    const [filter, setFilter] = useState('');

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
                        headerName: 'Position',
                        field: 'position',
                        pinned: !isMobile,
                        maxWidth: 50,
                        width: 50,
                        minWidth: 50,
                        sortable: true,
                        sort: 'asc',
                    },
                    {
                        headerName: 'Name',
                        colId: 'name',
                        width: isMobile ? 75 : 180,
                        pinned: !isMobile,
                        cellRenderer: (props: ICellRendererParams<ITableRow>) => {
                            const character = props.data?.character;
                            if (character) {
                                return (
                                    <CharacterTitle
                                        character={character}
                                        hideName={isMobile}
                                        imageSize={30}
                                        hideRarity
                                        hideRank
                                    />
                                );
                            }
                        },
                        valueGetter: (params: ValueGetterParams<ITableRow>) => params.data?.character?.shortName,
                        cellClass: (params: CellClassParams<ITableRow>) => params.data?.className,
                        tooltipValueGetter: (params: ITooltipParams<ITableRow>) => params.data?.tooltip,
                    },
                    {
                        headerName: 'Rarity',
                        colId: 'rarity',
                        width: 80,
                        columnGroupShow: 'open',
                        pinned: !isMobile,
                        valueGetter: (props: ValueGetterParams<ITableRow>) => {
                            return props.data?.character.rarity;
                        },
                        cellRenderer: (props: ICellRendererParams<ITableRow>) => {
                            const rarity = props.value ?? Rarity.Common;
                            return <RarityIcon rarity={rarity} />;
                        },
                    },
                    {
                        headerName: 'Rank',
                        colId: 'rank',
                        width: 80,
                        columnGroupShow: 'open',
                        pinned: !isMobile,
                        valueGetter: (props: ValueGetterParams<ITableRow>) => {
                            return props.data?.character.rank;
                        },
                        cellRenderer: (props: ICellRendererParams<ITableRow>) => {
                            const rank = props.value ?? 0;
                            return <RankIcon rank={rank} />;
                        },
                    },
                ],
            },
            {
                headerName: 'Total',
                children: [
                    {
                        colId: 'totalPoints',
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

    const selectedCharsRows: ITableRow[] = useMemo(() => {
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

        return legendaryEvent.allowedUnits
            .filter(x => selectedChars.includes(x.snowprintId!))
            .sort((a, b) => {
                const aTotal =
                    (alpha[a.name]?.points ?? 0) + (beta[a.name]?.points ?? 0) + (gamma[a.name]?.points ?? 0);
                const bTotal =
                    (alpha[b.name]?.points ?? 0) + (beta[b.name]?.points ?? 0) + (gamma[b.name]?.points ?? 0);

                return bTotal - aTotal;
            })
            .filter(x => (filter ? x.shortName.toLowerCase().includes(filter.toLowerCase()) : true))
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

        function getRestrictionsByChar(selectedTeams: ILreTeam[]): Record<string, string[]> {
            const result: Record<string, string[]> = {};

            for (const team of selectedTeams) {
                let chars = team.charSnowprintIds ?? [];
                if (chars.length === 0) {
                    chars = (team.charactersIds ?? []).map(
                        x => CharactersService.resolveCharacter(x)?.snowprintId ?? x
                    );
                }
                chars.forEach(character => {
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

            let progressByRequirement: Record<string, number> = {};

            if (pointsCalculation === PointsCalculation.unearned || pointsCalculation === PointsCalculation.estimated) {
                const trackProgress = leProgress.tracksProgress.filter(x => x.trackId === track.section)[0];
                if (trackProgress) {
                    progressByRequirement = LreService.getReqProgressPerTrack(trackProgress);
                }
            }

            for (const key in restrictionsByChar) {
                const restrictions = restrictionsByChar[key];
                result[key] = {
                    name: key,
                    slots: restrictionsByChar[key].length,
                    points: sum(
                        restrictions.map(requirement => {
                            if (pointsCalculation === PointsCalculation.all) {
                                return track.getRestrictionPoints(requirement) * track.battlesPoints.length;
                            }

                            if (pointsCalculation === PointsCalculation.unearned) {
                                const progress = progressByRequirement[requirement] ?? 0;
                                const battlesLeft = track.battlesPoints.length - progress;
                                return track.getRestrictionPoints(requirement) * battlesLeft;
                            }

                            if (pointsCalculation === PointsCalculation.estimated) {
                                const progress = progressByRequirement[requirement] ?? 0;
                                // Use the user's estimated clears for this team/restriction if available
                                // Find the team that includes this character and restriction
                                let battlesLeft = track.battlesPoints.length - progress;
                                const expectedClears = teams
                                    .filter(t => t.section === track.section)
                                    .find(
                                        t =>
                                            (t.charSnowprintIds ?? t.charactersIds ?? []).some(
                                                id =>
                                                    CharactersService.canonicalName(id) === key ||
                                                    CharactersService.resolveCharacter(id)?.snowprintId === key
                                            ) && t.restrictionsIds.includes(requirement)
                                    )?.expectedBattleClears;
                                if (
                                    typeof expectedClears === 'number' &&
                                    expectedClears >= 0 &&
                                    expectedClears < track.battlesPoints.length
                                ) {
                                    battlesLeft = Math.max(0, expectedClears - progress);
                                }
                                return track.getRestrictionPoints(requirement) * battlesLeft;
                            }

                            return 0;
                        })
                    ),
                };
            }
            return result;
        }
    }, [legendaryEvent.id, filter, pointsCalculation, teams, leProgress]);

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
    }, [selection, filter, legendaryEvent]);

    return (
        <div>
            <div className="flex items-center gap-[15px]">
                <TextField
                    size="small"
                    sx={{ margin: '10px', width: '300px' }}
                    label="Quick Filter"
                    variant="outlined"
                    onChange={event => setFilter(event.target.value)}
                />
                <Button
                    size="small"
                    variant={'contained'}
                    onClick={() => {
                        const gridApi = gridRef.current?.api;
                        if (gridApi) {
                            const csv = gridApi.getDataAsCsv({
                                columnKeys: ['name', 'rarity', 'rank', 'totalPoints'],
                                processCellCallback: params => {
                                    if (params.column.getColId() === 'rarity') {
                                        return RarityMapper.rarityToRarityString(params.value) ?? 'Common';
                                    }
                                    if (params.column.getColId() === 'rank') {
                                        return rankToString(params.value) ?? 'Locked';
                                    }
                                    return params.value;
                                },
                            });
                            navigator.clipboard.writeText(csv ?? '');
                        }
                    }}>
                    Copy To Clipboard
                </Button>
                <FormControl>
                    <FormLabel id="demo-radio-buttons-group-label" className="font-bold">
                        Characters Selection
                    </FormLabel>
                    <RadioGroup
                        className="flex flex-row"
                        aria-labelledby="demo-radio-buttons-group-label"
                        value={selection}
                        onChange={(_, value) => setSelection(value as CharactersSelection)}
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
                {selection === CharactersSelection.Selected ? (
                    <FormControl>
                        <FormLabel id="points-calculation-label" className="font-bold">
                            Points Calculation
                        </FormLabel>
                        <RadioGroup
                            className="flex flex-row"
                            aria-labelledby="points-calculation-label"
                            value={pointsCalculation}
                            onChange={(_, value) => setPointsCalculation(value as PointsCalculation)}
                            name="radio-buttons-group">
                            <FormControlLabel
                                value={PointsCalculation.unearned}
                                control={<Radio />}
                                label="Unearned Points Only"
                            />
                            <FormControlLabel value={PointsCalculation.all} control={<Radio />} label="All Points" />
                            <FormControlLabel
                                value={PointsCalculation.estimated}
                                control={<Radio />}
                                label="Estimated Points"
                            />
                        </RadioGroup>
                    </FormControl>
                ) : (
                    <span>
                        Take this list with the grain of salt, not everyone who scores the most points is the best LRE
                        character
                    </span>
                )}
            </div>
            <div className="ag-theme-material h-[calc(100vh-250px)] w-full">
                <AgGridReact
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
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
