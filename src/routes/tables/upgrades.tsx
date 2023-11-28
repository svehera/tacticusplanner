import React, { useMemo, useRef, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueFormatterParams, ICellRendererParams } from 'ag-grid-community';

import { StaticDataService } from '../../services';
import { fitGridOnWindowResize, stringToRank } from '../../shared-logic/functions';
import { FormControl, FormControlLabel, MenuItem, Select, Switch, TextField, Tooltip } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { Rank, Rarity, RarityString } from '../../models/enums';
import { rarityStringToNumber } from '../../models/constants';
import { CharacterImage } from '../../shared-components/character-image';
import { RankImage } from '../../shared-components/rank-image';
import { UpgradeImage } from '../../shared-components/upgrade-image';
import { isMobile } from 'react-device-detect';

type Selection = 'Craftable' | 'Non Craftable' | 'Shards';

interface IUpgradesTableRow {
    upgradeLabel: string;
    upgradeIcon: string;
    faction: string;
    rarity: Rarity;
    type: string;
    locations: string;
    recipe: string;
    characters: Array<{
        id: string;
        icon: string;
        ranks: Rank[];
    }>;
    craftable: boolean;
}

export const Upgrades = () => {
    const selectionOptions: Selection[] = ['Craftable', 'Non Craftable', 'Shards'];
    const gridRef = useRef<AgGridReact<IUpgradesTableRow>>(null);

    const [nameFilter, setNameFilter] = useState<string>('');
    const [showCharacters, setShowCharacters] = useState<boolean>(true);
    const [selection, setSelection] = useState<Selection>('Non Craftable');

    const columnDefs = useMemo<Array<ColDef<IUpgradesTableRow>>>(() => {
        const charactersColumn: ColDef<IUpgradesTableRow> = {
            field: 'characters',
            headerName: 'Characters',
            minWidth: 150,
            hide: !showCharacters,
            cellRenderer: (params: ICellRendererParams<IUpgradesTableRow>) => {
                const characters = params.data?.characters;
                if (characters) {
                    return characters.map(x => (
                        <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Tooltip title={x.id}>
                                <span>
                                    <CharacterImage icon={x.icon} name={x.id} imageSize={30} />
                                </span>
                            </Tooltip>
                            <div>
                                {x.ranks.map(rank => (
                                    <RankImage key={rank} rank={rank} />
                                ))}
                            </div>
                        </div>
                    ));
                }
            },
        };

        const base: Array<ColDef> = [
            {
                headerName: '#',
                colId: 'rowNumber',
                valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
                maxWidth: 55,
                width: 55,
                minWidth: 55,
                sortable: false,
            },
            {
                headerName: 'Upgrade',
                valueFormatter: (params: ValueFormatterParams<IUpgradesTableRow>) => params.data?.upgradeLabel ?? '',
                cellRenderer: (params: ICellRendererParams<IUpgradesTableRow>) => {
                    const { data } = params;
                    if (data) {
                        return <UpgradeImage material={data.upgradeLabel} iconPath={data.upgradeIcon} />;
                    }
                },
                equals: () => true,
                sortable: false,
                width: 80,
                minWidth: 80,
            },
            {
                field: 'faction',
                headerName: 'Faction',
                maxWidth: 150,
                width: 150,
                minWidth: 150,
            },
            {
                field: 'rarity',
                headerName: 'Rarity',
                maxWidth: 100,
                width: 100,
                minWidth: 100,
                valueFormatter: (params: ValueFormatterParams<IUpgradesTableRow>) => Rarity[params.value],
            },
            {
                field: 'type',
                headerName: 'Type',
                maxWidth: 80,
                width: 80,
                minWidth: 80,
            },
        ];

        switch (selection) {
            case 'Shards':
            case 'Non Craftable': {
                return [
                    ...base,

                    {
                        field: 'locations',
                        headerName: 'Locations',
                        minWidth: 150,
                    },
                    charactersColumn,
                ];
            }
            case 'Craftable': {
                return [
                    ...base,
                    {
                        field: 'recipe',
                        headerName: 'Recipe',
                        minWidth: 150,
                    },
                    charactersColumn,
                ];
            }
        }
    }, [selection, showCharacters]);

    const rowsData = useMemo(() => {
        const upgradesLocations = StaticDataService.getUpgradesLocations();

        const result: IUpgradesTableRow[] = Object.values(StaticDataService.recipeData).map(x => {
            const characters: Array<{
                id: string;
                icon: string;
                ranks: Rank[];
            }> = [];

            for (const character in StaticDataService.rankUpData) {
                const ranks = StaticDataService.rankUpData[character];

                for (const rank in ranks) {
                    const upgrades = ranks[rank];
                    if (upgrades.includes(x.material)) {
                        const charData = StaticDataService.unitsData.find(x => x.name === character);
                        const existingChar = characters.find(x => x.id === character);
                        if (existingChar) {
                            existingChar.ranks.push(stringToRank(rank));
                        } else {
                            characters.push({
                                id: character,
                                icon: charData?.icon ?? '',
                                ranks: [stringToRank(rank)],
                            });
                        }
                    }
                }
            }

            const locations = upgradesLocations[x.material]
                ?.map(x => StaticDataService.campaignsComposed[x])
                .map(x => x?.campaign + ' ' + x?.nodeNumber)
                .join(', ');
            return {
                upgradeLabel: x.material,
                upgradeIcon: x.icon ?? '',
                faction: x.faction ?? '',
                rarity: rarityStringToNumber[x.rarity as unknown as RarityString],
                type: x.stat,
                locations,
                recipe: x.recipe?.map(x => x.material + ' - ' + x.count).join('\r\n') ?? '',
                characters: characters,
                craftable: x.craftable,
            };
        });

        return result;
    }, []);

    const rows = useMemo(() => {
        return rowsData
            .filter(upgrade => upgrade.upgradeLabel.toLowerCase().includes(nameFilter.toLowerCase()))
            .filter(upgrade => {
                switch (selection) {
                    case 'Craftable': {
                        return upgrade.craftable && upgrade.type !== 'Shard';
                    }
                    case 'Non Craftable': {
                        return !upgrade.craftable && upgrade.type !== 'Shard';
                    }
                    case 'Shards': {
                        return upgrade.type === 'Shard';
                    }
                }
            });
    }, [selection, nameFilter]);

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: 'center',
                    gap: '20px',
                    margin: '0 20px',
                }}>
                <TextField
                    label="Quick Filter"
                    variant="outlined"
                    onChange={change => setNameFilter(change.target.value)}
                />
                <FormControl style={{ width: 250, margin: 20 }}>
                    <InputLabel>Selection</InputLabel>
                    <Select
                        label={'Selection'}
                        value={selection}
                        onChange={event => setSelection(event.target.value as Selection)}>
                        {selectionOptions.map(value => (
                            <MenuItem key={value} value={value}>
                                {value}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControlLabel
                    control={
                        <Switch
                            checked={showCharacters}
                            value={showCharacters}
                            onChange={event => setShowCharacters(event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    }
                    label="Show Characters"
                />
            </div>

            <div className="ag-theme-material" style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
                <AgGridReact
                    key={selection}
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={{ resizable: true, sortable: true, autoHeight: true, wrapText: true }}
                    columnDefs={columnDefs}
                    rowData={rows}
                    // getRowStyle={getRowStyle}
                    onGridReady={fitGridOnWindowResize(gridRef)}></AgGridReact>
            </div>
        </div>
    );
};
