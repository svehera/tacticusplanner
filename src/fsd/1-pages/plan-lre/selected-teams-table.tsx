import {
    AllCommunityModule,
    CellClickedEvent,
    ColDef,
    ICellRendererParams,
    RowClassParams,
    RowStyle,
    themeBalham,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useContext, useEffect, useMemo, useRef } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { useFitGridOnWindowResize } from '@/fsd/5-shared/lib';

import { ICharacterUpgradeMow, ICharacterUpgradeRankGoal } from '@/fsd/4-entities/goal';

import { ILegendaryEventTrack, ILegendaryEventTrackRequirement } from '@/fsd/3-features/lre';

import { LreTile } from './lre-tile';
import { ITableRow } from './lre.models';
import { ISelectedTeamTableCell } from './selected-teams-table.utils';

interface Props {
    track: ILegendaryEventTrack;
    rows: ITableRow<ISelectedTeamTableCell | string>[];
    upgradeRankOrMowGoals: (ICharacterUpgradeRankGoal | ICharacterUpgradeMow)[];
    editTeam: (teamId: string) => void;
    deleteTeam: (teamId: string) => void;
}

const isSelectedTeamCell = (value: unknown): value is ISelectedTeamTableCell => {
    return !!value && typeof value === 'object' && 'character' in value && 'teamId' in value;
};

const getRowStyle = (params: RowClassParams): RowStyle => {
    return params.node.rowIndex && params.node.rowIndex % 5 === 0 ? { borderTop: '5px dashed' } : {};
};

export const SelectedTeamsTable: React.FC<Props> = ({ rows, upgradeRankOrMowGoals, editTeam, deleteTeam, track }) => {
    const { viewPreferences } = useContext(StoreContext);
    const gridReference = useRef<AgGridReact>(null);

    const defaultColumnDefinition: ColDef<ITableRow<ISelectedTeamTableCell | string>> = {
        headerClass: 'center-header-text',
        resizable: true,
        sortable: false,
        suppressMovable: true,
        wrapHeaderText: true,
        cellRenderer: (props: ICellRendererParams<ISelectedTeamTableCell>) => {
            const character = isSelectedTeamCell(props.value) ? props.value.character : null;
            if (character) {
                return (
                    <LreTile
                        character={character}
                        upgradeRankOrMowGoals={upgradeRankOrMowGoals}
                        settings={viewPreferences}
                    />
                );
            }
        },
        colSpan: params => {
            const indexOfCurrentCol = track.unitsRestrictions.findIndex(x => x.name === params.colDef.field);
            const restOfRestrictions = track.unitsRestrictions.slice(indexOfCurrentCol).map(x => x.name);
            if (restOfRestrictions.length === 1) {
                return 1;
            }

            const teamIds = restOfRestrictions.map(restriction => {
                const value = params.data?.[restriction];
                if (isSelectedTeamCell(value)) {
                    return value.teamId ?? '';
                }
                return '';
            });

            let result = 1;
            let currentTeamId = teamIds.shift();
            while (currentTeamId && currentTeamId === teamIds[0]) {
                result++;
                currentTeamId = teamIds.shift();
            }

            return result;
        },
    };

    const columnsDefs = useMemo<Array<ColDef>>(
        () => getSectionColumns(track.unitsRestrictions.filter(x => !x.hide)),
        [track.eventId]
    );

    function getSectionColumns(unitsRestrictions: ILegendaryEventTrackRequirement[]): Array<ColDef> {
        return unitsRestrictions.map(u => ({
            field: u.name,
            headerName: u.name,
        }));
    }

    const handleCellClick = (
        cellClicked: CellClickedEvent<ITableRow<ISelectedTeamTableCell | string>, ISelectedTeamTableCell>
    ) => {
        const value = isSelectedTeamCell(cellClicked.value) ? cellClicked.value.teamId : '';

        if (value) {
            if ((cellClicked.event as MouseEvent).shiftKey) {
                deleteTeam(value);
            } else {
                editTeam(value);
            }
        }
    };

    useEffect(() => {
        gridReference.current?.api?.sizeColumnsToFit();
    }, []);

    return (
        <div
            className="ag-theme-material auto-teams min-h-[230px] w-full border-2 border-solid border-black"
            style={{ height: rows.length * 35, minWidth: isMobile ? '750px' : '' }}>
            <AgGridReact
                modules={[AllCommunityModule]}
                theme={themeBalham}
                ref={gridReference}
                rowData={rows}
                rowHeight={35}
                getRowStyle={getRowStyle}
                defaultColDef={defaultColumnDefinition}
                columnDefs={columnsDefs}
                onCellClicked={handleCellClick}
                onGridReady={useFitGridOnWindowResize(gridReference)}></AgGridReact>
        </div>
    );
};
