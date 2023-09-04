import React, { useCallback, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, RowDragEndEvent, RowStyle } from 'ag-grid-community';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import Typography from '@mui/material/Typography';
import { ICharacter } from '../../models/interfaces';
import { GlobalService, PersonalDataService } from '../../services';
import { isMobile } from 'react-device-detect';
import { Rank, Rarity, RarityStars } from '../../models/enums';
import SelectorCell from '../../shared-components/selector-cell';
import { charsProgression, rarityToStars } from '../../models/constants';

export const Progression = () => {
    const gridRef = useRef<AgGridReact<ICharacter>>(null);
    
    const defaultColDef: ColDef<ICharacter> = {
        suppressMovable: true,
    };
    
    const [columnDefs] = useState<Array<ColDef<ICharacter> | ColGroupDef<ICharacter>>>([
        {
            headerName: 'Priority',
            colId: 'priority',
            valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
            maxWidth: 100,
            width: 100,
            minWidth: 100,
            rowDrag: true,
        },
        {
            field: 'name',
            headerName: 'Name',
            maxWidth: 150,
            width: 150,
            minWidth: 150,
        },
        {
            headerName: 'Current Stats',
            valueGetter: (params) => {
                const value = params.data;
                return Rarity[value?.rarity ?? 0] + ' - ' + RarityStars[value?.rarityStars ?? 0] + ' - ' + Rank[value?.rank ?? 0];
            },
            width: 200,
            maxWidth: 200,
            minWidth: 200,
        },
        {
            headerName: 'Current Shards',
            field: 'currentShards',
            maxWidth: 150,
            width: 150,
            minWidth: 150,
            editable: true,
            cellEditorPopup: true
        },
        {
            headerName: 'Target Rarity',
            editable: true,
            cellRenderer: SelectorCell,
            cellRendererParams: {
                editProperty: 'targetRarity',
                enumObject: Rarity
            },
            field: 'targetRarity',
            width: 150,
            minWidth: 150,
            maxWidth: 150,
            cellStyle: { padding: 0 },
        },
        {
            headerName: 'Timeline',
            openByDefault: true,
            children: [
                {
                    headerName: 'Days Left',
                    valueGetter: (params) => {
                        const data = params.data;
                        if (!data) {
                            return '';
                        }
                        const currentRarity = data.rarity + data.rarityStars;
                        const targetRarity = data.targetRarity + rarityToStars[data.targetRarity];
                        const targetShards = getTargetShards(currentRarity, targetRarity);
                        const daysToGet =  calculateDaysToGetShards(data?.currentShards ?? 0, targetShards, 0.33, 10);
                        return daysToGet;
                    }
                },
                {
                    headerName: 'Shards Left',
                    columnGroupShow: 'open',
                    valueGetter: (params) => {
                        const data = params.data;
                        if (!data) {
                            return '';
                        }
                        const currentRarity = data.rarity + data.rarityStars;
                        const targetRarity = data.targetRarity + rarityToStars[data.targetRarity];
                        const targetShards = getTargetShards(currentRarity, targetRarity);
                        const currentShards = data?.currentShards ?? 0;
                        if (currentShards >= targetShards) {
                            return 0; 
                        }
                        return targetShards - currentShards;
                    }
                },
                {
                    headerName: 'Energy Left',
                    columnGroupShow: 'open',
                    valueGetter: (params) => {
                        const data = params.data;
                        if (!data) {
                            return 0;
                        }
                        const currentRarity = data.rarity + data.rarityStars;
                        const targetRarity = data.targetRarity + rarityToStars[data.targetRarity];
                        const targetShards = getTargetShards(currentRarity, targetRarity);
                        const daysToGet =  calculateDaysToGetShards(data?.currentShards ?? 0, targetShards, 0.33, 10);
                        return daysToGet * 10 * 6;
                    }
                },
                {
                    headerName: 'Estimated Date',
                    columnGroupShow: 'open',
                    valueGetter: (params) => {
                        const data = params.data;
                        if (!data) {
                            return '';
                        }
                        const currentRarity = data.rarity + data.rarityStars;
                        const targetRarity = data.targetRarity + rarityToStars[data.targetRarity];
                        const targetShards = getTargetShards(currentRarity, targetRarity);
                        const daysToGet =  calculateDaysToGetShards(data?.currentShards ?? 0, targetShards, 0.33, 10);
                        const currentDate = new Date();
                        const numValue = currentDate.setDate(currentDate.getDate() + daysToGet);
                        const formattedDate = new Date(numValue).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        });
                        return formattedDate;
                    }
                }
            ]
        },
    ]);

    const [rowsData] = useState<ICharacter[]>(PersonalDataService.data.charactersPriorityList
        .map(name => GlobalService.characters.find(x => x.progress && x.name === name))
        .filter(x => !!x) as ICharacter[]
    );

    const getRowStyle = (params: RowClassParams): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'lightsteelblue' : 'white' };
    };

    React.useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 768) {
                gridRef.current?.api.sizeColumnsToFit();
            }
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);

        };
    });

    const handleDragEnd = useCallback((event: RowDragEndEvent<ICharacter>) => {
        const newPriority: string[] = [];
        event.api.forEachNode(node => {
            newPriority.push(node.data?.name ?? '');
        });
        PersonalDataService.data.charactersPriorityList = newPriority;
        PersonalDataService.save();
        const columns = [gridRef.current?.columnApi.getColumn('priority') ?? ''];
        gridRef.current?.api.refreshCells({ columns });
    }, []);

    const saveChanges = () => {
        rowsData.forEach(row => {
            const existingChar = PersonalDataService.data.characters.find(char => char.name === row.name);
            if(existingChar) {
                existingChar.currentShards = +row.currentShards;
                existingChar.targetRarity = row.targetRarity;
                existingChar.targetRarityStars = row.targetRarityStars;
            }
        });
        PersonalDataService.save();
        gridRef.current?.api.refreshCells();
    };

    function calculateDaysToGetShards(
        currentShards: number,
        targetShards: number,
        probability: number,
        triesPerDay: number,
        isElite = false
    ): number {
        if (currentShards >= targetShards) {
            return 0; // Already reached the target
        }

        const remainingShards = targetShards - currentShards;
        let days: number;

        if (isElite) {
            const averageShardsPerTry = 1 + 0.04; // 1 shard + 4% chance of 1 more shard
            const triesNeeded = Math.ceil(remainingShards / averageShardsPerTry);
            days = Math.ceil(triesNeeded / triesPerDay);
        } else {
            const attemptsPerShard = 1 / probability;
            const totalAttemptsNeeded = remainingShards * attemptsPerShard;
            days = Math.ceil(totalAttemptsNeeded / triesPerDay);
        }

        return days;
    }
    
    function getTargetShards(charCurrentRarity: number, charTargetRarity: number): number {
        let targetShards = 0;
        for (const charsProgressionKey in charsProgression) {
            if (+charsProgressionKey > charCurrentRarity && +charsProgressionKey <= charTargetRarity) {
                targetShards += charsProgression[charsProgressionKey].shards;
            }
        }
        return targetShards;
    }


    return (
        <div>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
               Characters Progression
            </Typography>

            <div className="ag-theme-material" style={{ height: 'calc(100vh - 130px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    suppressCellFocus={true}
                    rowDragManaged={true}
                    onRowDragEnd={handleDragEnd}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    rowData={rowsData}
                    getRowStyle={getRowStyle}
                    onCellEditingStopped={() => saveChanges()}
                    onGridReady={() => !isMobile ? gridRef.current?.api.sizeColumnsToFit() : undefined}
                >
                </AgGridReact>
            </div>
        </div>
    );
};
