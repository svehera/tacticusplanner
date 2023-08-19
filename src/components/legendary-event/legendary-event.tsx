import React, { useMemo, useRef, useState } from 'react';
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
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { PersonalDataService } from '../../store/personal-data/personal-data.service';
import PointsTable from '../points-table/points-table';

type IRow = Record<string, ICharacter | string>;
type LegendaryEventSection = '(Alpha)' | '(Beta)' | '(Gamma)';

const LegendaryEvent = (props: { input: ILegendaryEvent }) => {
    const gridRef = useRef<AgGridReact>(null);
    const gridRef2 = useRef<AgGridReact>(null);
    const [viewPreferences] = useState(PersonalDataService.data.viewPreferences);

    const [unlockedOnly, setUnlockedOnly] = useState(viewPreferences.onlyUnlocked);
    const [usedInCampaings, setUsedInCampaings] = useState(viewPreferences.usedInCampaigns);
    const [fitToScreen, setFitToScreen] = useState(viewPreferences.fitToScreen);

    const [selectedTeams, setSelectedTeams] = useState<Array<IRow>>(PersonalDataService.data.legendaryEvents.jainZar.selectedTeams);

    const [legendaryEvent] = useState(props.input);

    // const chars =  (selectedTeams.flatMap(row => Object.values(row).filter(x => !!x));
    // const uniq = uniqBy(chars)
    // console.log);

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

    const rows: Array<IRow> = useMemo(() => getRows(legendaryEvent, unlockedOnly, usedInCampaings), [unlockedOnly, usedInCampaings]);

    const teamSize = 5;

    function updateSelectedChars(columnId: string, selectedChar: ICharacter) {
        const currentTeam = selectedTeams.map(row => row[columnId]);
        const isTeamFull = currentTeam.filter(char => !!char).length === teamSize;
        const isAlreadyInTeam = currentTeam.some(char => typeof char === 'string' ? false : char?.name === selectedChar.name);
        if (!isTeamFull && !isAlreadyInTeam) {
            for (const row of selectedTeams) {
                if (!row[columnId]) {
                    row[columnId] = selectedChar;
                    const storedChar = PersonalDataService.data.characters.find(char => char.name === selectedChar.name);
                    if(storedChar) {
                        storedChar.leSelection |= LegendaryEvents.JainZar;
                        selectedChar.leSelection |= LegendaryEvents.JainZar;
                    }
                    break;
                }
            }
        }
    }
    
    const updateSelectedTeams = (selected: ITableRow[]) => {
        setSelectedTeams(selected);
        PersonalDataService.data.legendaryEvents.jainZar.selectedTeams = selected;
        PersonalDataService.save();
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
                const storedChar = PersonalDataService.data.characters.find(char => char.name === selectedChar.name);
                if(!isStillSelected && storedChar) {
                    storedChar.leSelection &= ~LegendaryEvents.JainZar;
                    selectedChar.leSelection &= ~LegendaryEvents.JainZar;
                }
                break;
            }
        }

        updateSelectedTeams([...selectedTeams]);
    };

    const updateOnlyUnlocked = (checked: boolean) => {
        setUnlockedOnly(checked);
        PersonalDataService.data.viewPreferences.onlyUnlocked = checked;
        PersonalDataService.save();
    };

    const updateUsedInCampaigns = (checked: boolean) => {
        setUsedInCampaings(checked);
        PersonalDataService.data.viewPreferences.usedInCampaigns = checked;
        PersonalDataService.save();
    };

    const updateFitToScreen = (checked: boolean) => {
        if (checked) {
            gridRef.current?.api.sizeColumnsToFit();
            gridRef2.current?.api.sizeColumnsToFit();
        } else {
            gridRef.current?.columnApi.autoSizeAllColumns();
            gridRef2.current?.columnApi.autoSizeAllColumns();
        }
        setFitToScreen(checked);
        PersonalDataService.data.viewPreferences.fitToScreen = checked;
        PersonalDataService.save();
    };
    
    return (
        <div>
            <FormGroup style={{ display: 'flex', flexDirection: 'row' }}>
                <FormControlLabel control={<Checkbox
                    checked={unlockedOnly}
                    onChange={(event) => updateOnlyUnlocked(event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />} label="Unlocked Only"/>
                <FormControlLabel control={<Checkbox
                    checked={fitToScreen}
                    onChange={(event) => updateFitToScreen(event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />} label="Fit To Screen"/>
                <FormControlLabel control={<Checkbox
                    checked={usedInCampaings}
                    onChange={(event) => updateUsedInCampaigns(event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />} label="Used in Campaigns"/>
            </FormGroup>

            <div className="ag-theme-material" style={{ height: 'calc(100vh - 420px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    alignedGrids={gridRef2.current ? [gridRef2.current] : undefined}
                    tooltipShowDelay={100}
                    rowData={rows as any}
                    rowHeight={25}
                    columnDefs={columnsDefs}
                    onGridReady={() => updateFitToScreen(viewPreferences.fitToScreen)}
                    onCellClicked={handleMainTableCellClick}
                >
                </AgGridReact>
            </div>
            <h4 style={{ margin: 0 }}> Selected teams</h4>
            <div className="ag-theme-material" style={{ height: '150px', width: '100%' }}>
                <AgGridReact
                    ref={gridRef2}
                    alignedGrids={gridRef.current ? [gridRef.current] : undefined}
                    tooltipShowDelay={100}
                    rowData={selectedTeams as any}
                    headerHeight={1}
                    rowHeight={25}
                    columnDefs={columnsDefs}
                    onGridReady={() => updateFitToScreen(viewPreferences.fitToScreen)}
                    onCellClicked={handleTeamsTableCellClick}
                >
                </AgGridReact>
            </div>

            <PointsTable legendaryEvent={legendaryEvent} />
        </div>
    );
};

function getSectionColumns(unitsRestrictions: ILegendaryEventTrackRestriction[], suffix: LegendaryEventSection): Array<ColDef> {
    return unitsRestrictions.map((u, index) => ({
        field: u.name + suffix,
        headerName: u.name + ' - ' + u.points,
        headerTooltip: u.name + ' - ' + u.points,
        columnGroupShow: index === 0 ? undefined : 'open',
        valueFormatter: (params: ValueFormatterParams) => typeof params.value === 'string' ? params.value : params.value?.name,
        cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
        tooltipValueGetter: (params: ITooltipParams) => typeof params.value === 'string' ? params.value : params.value?.name + ' - ' + Rank[params.value?.rank ?? 0],
        section: suffix
    }));
}

function getRows(legendaryEvent: ILegendaryEvent, unlockedOnly: boolean, usedInCampaigns: boolean): Array<IRow> {
    const rows: Array<IRow> = [];
    const allowedUnits = legendaryEvent.getAllowedUnits().filter(char => (unlockedOnly ? char.unlocked : true) && (usedInCampaigns ? char.requiredInCampaign : true));

    allowedUnits.forEach(unit => {
        const row: IRow = {};

        populateCells('(Alpha)', legendaryEvent.alphaTrack, unit, row);
        populateCells('(Beta)', legendaryEvent.betaTrack, unit, row);
        populateCells('(Gamma)', legendaryEvent.gammaTrack, unit, row);

        rows.push(row);
    });

    return rows;
}

function populateCells(suffix: LegendaryEventSection, section: ILegendaryEventTrack, character: ICharacter, row: IRow): void {
    section.unitsRestrictions.forEach(re => {
        row[re.name + suffix] = re.units.some(u => u.name === character.name) ? character : '';
    });
}

export default LegendaryEvent;