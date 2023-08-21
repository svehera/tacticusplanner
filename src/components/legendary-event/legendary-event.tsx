import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    ICharacter,
    ILegendaryEvent,
    ILegendaryEventTrack,
    ILegendaryEventTrackRestriction,
    ITableRow
} from '../../store/static-data/interfaces';
import {
    CellClassParams,
    CellClickedEvent,
    ColDef,
    ColGroupDef,
    ITooltipParams,
    ValueFormatterParams
} from 'ag-grid-community';
import { LegendaryEvents, Rank } from '../../store/personal-data/personal-data.interfaces';
import { Accordion, AccordionDetails, AccordionSummary, Button, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import PointsTable from '../points-table/points-table';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import { ViewSettingsContext } from '../../contexts/view-settings.context';

type LegendaryEventSection = '(Alpha)' | '(Beta)' | '(Gamma)';

const LegendaryEvent = (props: { legendaryEvent: ILegendaryEvent; selectedTeamsChange: (selectedTeams: Array<ITableRow>) => void; }) => {
    const gridRef = useRef<AgGridReact>(null);
    const gridRef2 = useRef<AgGridReact>(null);
    const viewPreferences = useContext(ViewSettingsContext);
    const { legendaryEvent, selectedTeamsChange } = props;

    const [selectedTeams, setSelectedTeams] = useState<Array<ITableRow>>(legendaryEvent.selectedTeams);


    const [columnsDefs] = useState<Array<ColGroupDef<ICharacter | string> & { section?: LegendaryEventSection }>>([
        {
            headerName: legendaryEvent.alphaTrack.name,
            headerClass: 'alpha',
            children: getSectionColumns(legendaryEvent.alphaTrack.unitsRestrictions, '(Alpha)'),
            openByDefault: true,
            section: '(Alpha)'
        },
        {
            headerName: legendaryEvent.betaTrack.name,
            headerClass: 'beta',
            children: getSectionColumns(legendaryEvent.betaTrack.unitsRestrictions, '(Beta)'),
            openByDefault: true,
            section: '(Beta)'
        },
        {
            headerName: legendaryEvent.gammaTrack.name,
            headerClass: 'gamma',
            children: getSectionColumns(legendaryEvent.gammaTrack.unitsRestrictions, '(Gamma)'),
            openByDefault: true,
            section: '(Gamma)'
        }
    ]);

    const rows: Array<ITableRow> = useMemo(() => getRows(legendaryEvent, viewPreferences.onlyUnlocked, viewPreferences.usedInCampaigns), [viewPreferences.onlyUnlocked, viewPreferences.usedInCampaigns]);

    const teamSize = 5;

    function updateSelectedChars(columnId: string, selectedChar: ICharacter) {
        if(!selectedTeams.length) {
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
        selectedTeamsChange(selectedTeams);
    };

    const handleMainTableCellClick = (event: CellClickedEvent) => {
        const columnId = event.column.getColId();
        const selectedChar = event.value as ICharacter;
        updateSelectedChars(columnId, selectedChar);

        updateSelectedTeams([...selectedTeams]);
    };


    const handleTeamsTableCellClick = (event: CellClickedEvent) => {
        const columnId = event.column.getColId();
        const selectedChar = event.value as ICharacter;

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

        updateSelectedTeams([...selectedTeams]);
    };

    React.useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 768) {
                gridRef.current?.api.sizeColumnsToFit();
                gridRef2.current?.api.sizeColumnsToFit();
            }
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);

        };
    });

    return (
        <div>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                >
                    <Typography>Event Details (Click on character to add it to selected teams)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div className="ag-theme-material" style={{ height: 'calc(100vh - 420px)', width: '100%' }}>
                        <AgGridReact
                            ref={gridRef}
                            tooltipShowDelay={100}
                            rowData={rows as any}
                            columnDefs={columnsDefs}
                            onGridReady={() => gridRef.current?.api.sizeColumnsToFit()}
                            onCellClicked={handleMainTableCellClick}
                        >
                        </AgGridReact>
                    </div>
                </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded={true}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                >
                    <Typography>Your Selected Teams (Click on character to remove it from selected teams)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button onClick={() => updateSelectedTeams([])}>Clear All</Button>
                    <div className="ag-theme-material" style={{ height: '170px', width: '100%' }}>
                        <AgGridReact
                            ref={gridRef2}
                            tooltipShowDelay={100}
                            rowData={selectedTeams as any}
                            headerHeight={0}
                            columnDefs={columnsDefs}
                            overlayNoRowsTemplate={'Select characters on Event Details'}
                            onGridReady={() => gridRef2.current?.api.sizeColumnsToFit()}
                            onCellClicked={handleTeamsTableCellClick}
                        >
                        </AgGridReact>
                    </div>
                </AccordionDetails>
            </Accordion>
            <Accordion>
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
    return unitsRestrictions.map((u, index) => ({
        field: u.name + suffix,
        headerName: u.name + ' - ' + u.points,
        headerTooltip: u.name + ' - ' + u.points,
        valueFormatter: (params: ValueFormatterParams) => typeof params.value === 'string' ? params.value : params.value?.name,
        cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
        tooltipValueGetter: (params: ITooltipParams) => typeof params.value === 'string' ? params.value : params.value?.name + ' - ' + Rank[params.value?.rank ?? 0],
        section: suffix
    }));
}

function getRows(legendaryEvent: ILegendaryEvent, unlockedOnly: boolean, usedInCampaigns: boolean): Array<ITableRow> {
    const rows: Array<ITableRow> = [];
    const allowedUnits = legendaryEvent.getAllowedUnits().filter(char => (unlockedOnly ? char.unlocked : true) && (usedInCampaigns ? char.requiredInCampaign : true));

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