import React, { useContext, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    ICharacter,
    ILegendaryEvent,
    ILegendaryEventTrack,
    ILegendaryEventTrackRestriction,
    ITableRow, LegendaryEventSection
} from '../../store/static-data/interfaces';
import {
    CellClassParams,
    CellClickedEvent,
    ColDef,
    ColGroupDef,
    IHeaderParams,
    ITooltipParams,
    ValueFormatterParams
} from 'ag-grid-community';
import { IAutoTeamsPreferences, IViewPreferences, Rank } from '../../store/personal-data/personal-data.interfaces';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button
} from '@mui/material';
import PointsTable from './points-table';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import { ViewSettingsContext } from '../../contexts/view-settings.context';
import { sortBy } from 'lodash';
import { AutoTeamsSettingsContext } from '../../contexts/auto-teams-settings.context';
import CustomTableHeader from './custom-table-header';

const LegendaryEvent = (props: {
    legendaryEvent: ILegendaryEvent;
    selectedTeamsChange: (selectedTeams: Array<ITableRow>) => void;
}) => {
    const gridRef = useRef<AgGridReact>(null);
    const gridRef2 = useRef<AgGridReact>(null);
    const gridRef3 = useRef<AgGridReact>(null);
    const viewPreferences = useContext(ViewSettingsContext);
    const autoTeamsPreferences = useContext(AutoTeamsSettingsContext);
    const { legendaryEvent, selectedTeamsChange } = props;
    const components = useMemo(() => {
        return {
            agColumnHeader: CustomTableHeader,
        };
    }, []);

    const [selectedTeams, setSelectedTeams] = useState<Array<ITableRow>>(legendaryEvent.selectedTeams);

    const [columnsDefs] = useState<Array<ColGroupDef & { section?: LegendaryEventSection }>>([
        {
            headerName: legendaryEvent.alphaTrack.name + ' - ' + legendaryEvent.alphaTrack.killPoints,
            headerClass: 'alpha',
            children: getSectionColumns(legendaryEvent.alphaTrack.unitsRestrictions, '(Alpha)'),
            openByDefault: true,
            section: '(Alpha)'
        },
        {
            headerName: legendaryEvent.betaTrack.name + ' - ' + legendaryEvent.betaTrack.killPoints,
            headerClass: 'beta',
            children: getSectionColumns(legendaryEvent.betaTrack.unitsRestrictions, '(Beta)'),
            openByDefault: true,
            section: '(Beta)'
        },
        {
            headerName: legendaryEvent.gammaTrack.name + ' - ' + legendaryEvent.gammaTrack.killPoints,
            headerClass: 'gamma',
            children: getSectionColumns(legendaryEvent.gammaTrack.unitsRestrictions, '(Gamma)'),
            openByDefault: true,
            section: '(Gamma)'
        }
    ]);

    const rows: Array<ITableRow> = useMemo(() => getRows(legendaryEvent, viewPreferences), [viewPreferences]);

    const teamSize = 5;

    const suggestedTeams: Array<ITableRow> = useMemo(() => getSuggestedTeams(legendaryEvent, autoTeamsPreferences), [autoTeamsPreferences]);

    function updateSelectedChars(columnId: string, selectedChar: ICharacter) {
        if (!selectedTeams.length) {
            selectedTeams.push(...[{}, {}, {}, {}, {}]);
        }
        const currentTeam = selectedTeams.map(row => row[columnId]);
        const isTeamFull = currentTeam.filter(char => !!char).length === teamSize;
        const isAlreadyInTeam = currentTeam.some(char => typeof char === 'string' ? false : char?.name === selectedChar.name);
        if (!isTeamFull && !isAlreadyInTeam) {
            for (const row of selectedTeams) {
                if (!row[columnId]) {
                    row[columnId] = selectedChar;
                    selectedChar.leSelection |= legendaryEvent.id;
                    break;
                }
            }
        }
    }

    const updateSelectedTeams = (selected: ITableRow[]) => {
        setSelectedTeams(selected);
        selectedTeamsChange(selected);
    };

    const alignChars = () => {
        const columnNames = Object.keys(selectedTeams[0]);

        // Create an object for each column, initially empty
        const columns: Record<string, Array<ICharacter | string | undefined>> = columnNames.reduce((columns, columnName) => {
            columns[columnName] = [];
            return columns;
        }, {} as Record<string, Array<ICharacter | string | undefined>>);

        // Populate the columns with data
        selectedTeams.forEach(row => {
            columnNames.forEach(columnName => {
                columns[columnName].push(row[columnName]);
            });
        });

        const selectedChars = legendaryEvent.allowedUnits.filter(x => (x.leSelection & legendaryEvent.id) === legendaryEvent.id);
        const alignedSelectedTeams: Array<ITableRow> = [];
        selectedChars.forEach(char => {
            const newRow: ITableRow = {};

            for (const columnsKey in columns) {
                const selectedTeam = columns[columnsKey];
                if (selectedTeam.some(x => typeof x !== 'string' && x?.name === char.name)) {
                    newRow[columnsKey] = char;
                } else {
                    newRow[columnsKey] = '';
                }
            }
            alignedSelectedTeams.push(newRow);
        });
        updateSelectedTeams(alignedSelectedTeams);
    };

    const compactChars = () => {
        const columnNames = Object.keys(selectedTeams[0]);

        // Create an object for each column, initially empty
        const columns: Record<string, Array<ICharacter | string | undefined>> = columnNames.reduce((columns, columnName) => {
            columns[columnName] = [];
            return columns;
        }, {} as Record<string, Array<ICharacter | string | undefined>>);

        // Populate the columns with data
        selectedTeams.forEach(row => {
            columnNames.forEach(columnName => {
                columns[columnName].push(row[columnName]);
            });
        });

        for (const columnsKey in columns) {
            columns[columnsKey] = sortBy(columns[columnsKey], 'name');
        }

        const compactChars: ITableRow[] = [{}, {}, {}, {}, {}];

        Object.entries(columns).forEach(([key, value]) => {
            for (let i = 0; i < teamSize; i++) {
                compactChars[i][key] = value[i] ?? '';

            }
        });

        updateSelectedTeams(compactChars);
    };

    const handleMainTableCellClick = (event: CellClickedEvent) => {
        const columnId = event.column.getColId();
        const selectedChar = event.value as ICharacter;
        updateSelectedChars(columnId, selectedChar);

        updateSelectedTeams([...selectedTeams]);
    };

    function deselectCharacter(columnId: string, selectedChar: ICharacter) {
        for (const row of selectedTeams) {

            const value = row[columnId];
            if (typeof value === 'string' ? false : value.name === selectedChar.name) {
                row[columnId] = '';
                const allSelectedChars = selectedTeams.flatMap(x => Object.values(x)).filter(x => typeof x !== 'string') as ICharacter[];
                const isStillSelected = allSelectedChars.some(char => char.name === selectedChar.name);
                if (!isStillSelected) {
                    selectedChar.leSelection &= ~legendaryEvent.id;
                }
                break;
            }
        }
    }

    const handleTeamsTableCellClick = (event: CellClickedEvent) => {
        const columnId = event.column.getColId();
        const selectedChar = event.value as ICharacter;
        deselectCharacter(columnId, selectedChar);
        updateSelectedTeams([...selectedTeams]);
    };

    React.useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 768) {
                gridRef.current?.api.sizeColumnsToFit();
                gridRef2.current?.api.sizeColumnsToFit();
                gridRef3.current?.api.sizeColumnsToFit();
            }
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);

        };
    });

    return (
        <div>
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                >
                    <Typography>Event Details (Click on character to add it to selected teams)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div className="ag-theme-material" style={{ height: 'calc(100vh - 420px)', width: '100%' }}>
                        <AgGridReact
                            ref={gridRef}
                            tooltipShowDelay={100}
                            rowData={rows}
                            columnDefs={columnsDefs}
                            onGridReady={() => gridRef.current?.api.sizeColumnsToFit()}
                            onCellClicked={handleMainTableCellClick}
                        >
                        </AgGridReact>
                    </div>
                </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded={true} TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                >
                    <Typography>Auto-Generated Teams (Click on character to add it to selected teams)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div className="ag-theme-material" style={{ height: '250px', width: '100%' }}>
                        <AgGridReact
                            ref={gridRef3}
                            tooltipShowDelay={100}
                            components={components}
                            rowData={suggestedTeams}
                            defaultColDef={{
                                headerComponentParams: {
                                    onHeaderClick: (params: IHeaderParams) => {
                                        const columnId = params.column.getColId();
                                        suggestedTeams.forEach(row => {
                                            const char = row[columnId];
                                            if (typeof char !== 'string') {
                                                updateSelectedChars(columnId, char);
                                                updateSelectedTeams([...selectedTeams]);
                                            }
                                        });
                                    }
                                }
                            }}
                            columnDefs={columnsDefs}
                            onGridReady={() => gridRef3.current?.api.sizeColumnsToFit()}
                            onCellClicked={handleMainTableCellClick}
                        >
                        </AgGridReact>
                    </div>
                </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded={true} TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                >
                    <Typography>Your Selected Teams (Click on character to remove it from selected teams)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button onClick={() => updateSelectedTeams([])}>Clear All</Button>
                    <Button onClick={alignChars}>Align Chars</Button>
                    <Button onClick={compactChars}>Compact</Button>
                    <div className="ag-theme-material" style={{ height: '250px', width: '100%' }}>
                        <AgGridReact
                            ref={gridRef2}
                            tooltipShowDelay={100}
                            rowData={selectedTeams}
                            components={components}
                            defaultColDef={{
                                headerComponentParams: {
                                    onHeaderClick: (params: IHeaderParams) => {
                                        const columnId = params.column.getColId();
                                        const chars = selectedTeams.map(row => row[columnId]);
                                        chars.forEach(char => {
                                            if (typeof char !== 'string') {
                                                deselectCharacter(columnId, char);
                                            }
                                        });
                                        updateSelectedTeams([...selectedTeams]);
                                    }
                                }
                            }}
                            columnDefs={columnsDefs}
                            overlayNoRowsTemplate={'Select characters on Event Details'}
                            onGridReady={() => gridRef2.current?.api.sizeColumnsToFit()}
                            onCellClicked={handleTeamsTableCellClick}
                        >
                        </AgGridReact>
                    </div>
                </AccordionDetails>
            </Accordion>

            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                >
                    <Typography>Event Best characters table</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <PointsTable legendaryEvent={legendaryEvent}/>
                </AccordionDetails>
            </Accordion>

        </div>
    );
};

function getSectionColumns(unitsRestrictions: ILegendaryEventTrackRestriction[], suffix: LegendaryEventSection): Array<ColDef> {
    return unitsRestrictions.map((u) => ({
        field: u.name + suffix,
        headerName: `(${u.points}) ${u.name}`,
        headerTooltip: `(${u.points}) ${u.name}`,
        valueFormatter: (params: ValueFormatterParams) => typeof params.value === 'string' ? params.value : params.value?.name,
        cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
        tooltipValueGetter: (params: ITooltipParams) => typeof params.value === 'string' ? params.value : params.value?.name + ' - ' + Rank[params.value?.rank ?? 0],
        section: suffix,
    }));
}

function getSuggestedTeams(legendaryEvent: ILegendaryEvent, settings: IAutoTeamsPreferences): Array<ITableRow> {
    const rows: Array<ITableRow> = [{}, {}, {}, {}, {}];

    const alphaTeams = legendaryEvent.alphaTrack.suggestTeams(legendaryEvent.id, settings);
    const betaTeams = legendaryEvent.betaTrack.suggestTeams(legendaryEvent.id, settings);
    const gammaTeams = legendaryEvent.gammaTrack.suggestTeams(legendaryEvent.id, settings);

    rows.forEach((row, index) => {
        alphaTeams.forEach((team, teamIndex) => {
            const char = team[index];
            const teamName = legendaryEvent.alphaTrack.unitsRestrictions[teamIndex].name + '(Alpha)';
            row[teamName] = char;
        });

        betaTeams.forEach((team, teamIndex) => {
            const char = team[index];
            const teamName = legendaryEvent.betaTrack.unitsRestrictions[teamIndex].name + '(Beta)';
            row[teamName] = char;
        });

        gammaTeams.forEach((team, teamIndex) => {
            const char = team[index];
            const teamName = legendaryEvent.gammaTrack.unitsRestrictions[teamIndex].name + '(Gamma)';
            row[teamName] = char;
        });
    });


    return rows;
}

function getRows(legendaryEvent: ILegendaryEvent, viewPreferences: IViewPreferences): Array<ITableRow> {
    const rows: Array<ITableRow> = [];
    const allowedUnits = legendaryEvent.allowedUnits.filter(char => (viewPreferences.onlyUnlocked ? char.unlocked : true) && (viewPreferences.usedInCampaigns ? char.requiredInCampaign : true));

    allowedUnits.forEach(unit => {
        const row: ITableRow = {};

        populateCells('(Alpha)', legendaryEvent.alphaTrack, unit, row);
        populateCells('(Beta)', legendaryEvent.betaTrack, unit, row);
        populateCells('(Gamma)', legendaryEvent.gammaTrack, unit, row);

        rows.push(row);
    });

    return rows;
}

function populateCells(suffix: LegendaryEventSection, section: ILegendaryEventTrack, character: ICharacter, row: ITableRow): void {
    section.unitsRestrictions.forEach(re => {
        row[re.name + suffix] = re.units.some(u => u.name === character.name) ? character : '';
    });
}

export default LegendaryEvent;