import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { CellClickedEvent, ColDef, ICellRendererParams, RowStyle } from 'ag-grid-community';

import {
    ICharacter2,
    ILegendaryEventSelectedRequirements,
    ILegendaryEventTrack,
    ILegendaryEventTrackRequirement,
    ILreTeam,
    ITableRow,
    LreTrackId,
} from 'src/models/interfaces';
import { LegendaryEventEnum } from 'src/models/enums';

import CustomTableHeader from './custom-table-header';
import { fitGridOnWindowResize } from 'src/shared-logic/functions';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { isMobile } from 'react-device-detect';
import InfoIcon from '@mui/icons-material/Info';
import { LreTile } from 'src/v2/features/lre/lre-tile';
import { SelectedTeamsTable } from 'src/v2/features/lre/selected-teams-table';
import Button from '@mui/material/Button';

interface Props {
    track: ILegendaryEventTrack;
    teams: ILreTeam[];
    startAddTeam: (section: LreTrackId, requirements: string[]) => void;
    completedRequirements: string[];
    editTeam: (team: ILreTeam) => void;
}

export const LreTeamsTable: React.FC<Props> = ({
    track,
    startAddTeam,
    completedRequirements,
    teams: selectedTeams,
    editTeam,
}) => {
    const gridRef = useRef<AgGridReact>(null);

    const { viewPreferences, autoTeamsPreferences, leSelectedRequirements, selectedTeamOrder } =
        useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const restrictions = useMemo(() => {
        const event: ILegendaryEventSelectedRequirements = leSelectedRequirements[track.eventId] ?? {
            id: track.eventId,
            name: LegendaryEventEnum[track.eventId],
            alpha: {},
            beta: {},
            gamma: {},
        };
        const section = event[track.section];
        const result: string[] = [];

        track.unitsRestrictions.forEach(x => {
            const selected = section[x.name] !== undefined ? section[x.name] : x.selected;
            if (selected && !completedRequirements.includes(x.name)) {
                result.push(x.name);
            }
        });

        return result;
    }, [leSelectedRequirements, completedRequirements]);

    const defaultColumnDef: ColDef & { section: LreTrackId } = {
        resizable: true,
        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
            const character = props.value;
            if (character) {
                return <LreTile character={character} settings={viewPreferences} />;
            }
        },
        section: track.section,
        suppressMovable: true,
        wrapHeaderText: true,
        autoHeaderHeight: true,
    };

    const components = useMemo(() => {
        return {
            agColumnHeader: CustomTableHeader,
        };
    }, []);

    const columnsDefs = useMemo<Array<ColDef>>(
        () => [...getSectionColumns(track.unitsRestrictions, restrictions, completedRequirements)],
        [track.eventId, restrictions, completedRequirements]
    );

    const suggestedTeams = useMemo(
        () => track.suggestTeams(autoTeamsPreferences, viewPreferences.onlyUnlocked, restrictions),
        [autoTeamsPreferences, restrictions, viewPreferences.onlyUnlocked, selectedTeamOrder]
    );

    const rows: Array<ITableRow> = useMemo(() => getRows(suggestedTeams), [suggestedTeams]);

    const selectedTeamsRows: Array<ITableRow> = useMemo(() => {
        const teamRecord: Record<string, Array<ICharacter2 | string>> = {};

        selectedTeams.forEach(team => {
            // For each team, map charactersIds to either ICharacter2 or keep as string if not found
            team.restrictionsIds.forEach(id => {
                const existingCharacters = teamRecord[id] ?? [];
                const newTeam = Array.from({ length: 5 }, (_, index) => {
                    return team.characters?.[index] ?? '';
                });
                teamRecord[id] = [...existingCharacters, ...newTeam];
            });
        });

        return getRows(teamRecord);
    }, [selectedTeams]);

    useEffect(() => {
        gridRef.current?.api?.sizeColumnsToFit();
    }, [
        viewPreferences.showAlpha,
        viewPreferences.showBeta,
        viewPreferences.showGamma,
        track.eventId,
        viewPreferences.hideCompleted,
    ]);

    const handleChange = (selected: boolean, restrictionName: string) => {
        dispatch.leSelectedRequirements({
            type: 'Update',
            eventId: track.eventId,
            section: track.section,
            restrictionName,
            selected,
        });
    };

    const getRowStyle = (params: RowClassParams): RowStyle => {
        return params.node.rowIndex === 5 ? { borderTop: '5px dashed' } : {};
    };

    const addNewTeam = (cellClicked: CellClickedEvent<ITableRow[], ICharacter2>) => {
        startAddTeam(
            track.section,
            restrictions.includes(cellClicked.colDef.field!) ? restrictions : [cellClicked.colDef.field!]
        );
    };

    const editExistingTeam = (teamId: string) => {
        const team = selectedTeams.find(t => t.id === teamId);
        if (team) {
            editTeam(team);
        }
    };

    function getSectionColumns(
        unitsRestrictions: ILegendaryEventTrackRequirement[],
        selectedRequirements: string[],
        completedRestrictions: string[]
    ): Array<ColDef> {
        const columns = unitsRestrictions.map((u, index) => ({
            field: u.name,
            colSpan: () => {
                return index === 0 ? selectedRequirements.length : 1;
            },
            headerName: `(${u.points}) ${u.name}`,
            hide: completedRestrictions.includes(u.name),
            headerComponentParams: {
                onCheckboxChange: (selected: boolean) => handleChange(selected, u.name),
                checked: selectedRequirements.includes(u.name),
                restriction: u,
            },
        }));

        // Create a lookup table to get the order from `columnIds`
        const columnOrder: Record<string, number> = selectedRequirements.reduce(
            (order, id, index) => {
                order[id] = index;
                return order;
            },
            {} as Record<string, number>
        );

        // Sort `columns` by using the order from `columnIds`, keeping unspecified columns in original order
        return columns.sort((a, b) => {
            const orderA = columnOrder[a.field] !== undefined ? columnOrder[a.field] : Infinity;
            const orderB = columnOrder[b.field] !== undefined ? columnOrder[b.field] : Infinity;
            return orderA - orderB;
        });
    }

    function getRows(teams: Record<string, Array<ICharacter2 | string | undefined>>): Array<ITableRow> {
        const size = Math.max(...Object.values(teams).map(x => x.length));
        const rows: Array<ITableRow> = Array.from({ length: size }, () => ({}));

        rows.forEach((row, index) => {
            for (const team in teams) {
                const char = teams[team][index];
                row[team] = char ?? '';
            }
        });

        return rows;
    }

    const clearSelection = () => {
        dispatch.leSelectedRequirements({
            type: 'ClearAll',
            eventId: track.eventId,
            section: track.section,
        });
    };

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <div className="flex-box between">
                <div className="flex-box gap10">
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{track.name + ' - ' + track.killPoints}</span>
                    <div className="flex-box gap5">
                        <span style={{ fontStyle: 'italic', fontSize: '1rem' }}> vs {track.enemies.label}</span>
                        <a href={track.enemies.link} target={'_blank'} rel="noreferrer">
                            <InfoIcon color={'primary'} />
                        </a>
                    </div>
                </div>
                {!!restrictions.length && (
                    <Button size="small" onClick={clearSelection}>
                        Clear selection
                    </Button>
                )}
            </div>
            <div
                className="ag-theme-material auto-teams"
                style={{
                    height: isMobile ? '350px' : 'calc((100vh - 100px) / 2)',
                    width: '100%',
                    minWidth: isMobile ? '750px' : '',
                    border: '2px solid black',
                }}>
                <AgGridReact
                    ref={gridRef}
                    defaultColDef={defaultColumnDef}
                    columnDefs={columnsDefs}
                    components={components}
                    rowData={rows}
                    headerHeight={60}
                    rowHeight={35}
                    getRowStyle={getRowStyle}
                    onGridReady={fitGridOnWindowResize(gridRef)}
                    onCellClicked={addNewTeam}></AgGridReact>
            </div>
            {selectedTeams.length ? (
                <>
                    <h3>Selected Teams ({selectedTeams.length})</h3>
                    <SelectedTeamsTable
                        track={track}
                        rows={selectedTeamsRows}
                        editTeam={editExistingTeam}
                        completedRequirements={[]}
                    />
                </>
            ) : (
                <div>Click on any cell in the table above to start adding teams</div>
            )}
        </div>
    );
};
