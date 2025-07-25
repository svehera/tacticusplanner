﻿import { FormControl, FormControlLabel, MenuItem, Select, Switch, TextField, Tooltip } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { ColDef, ValueFormatterParams, ICellRendererParams, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { useFitGridOnWindowResize } from '@/fsd/5-shared/lib';
import { Rarity, RarityString, Rank, stringToRank, RarityMapper } from '@/fsd/5-shared/model';
import { MiscIcon, UnitShardIcon, RarityIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignsService, CampaignLocation, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { CharactersService, RankIcon, rankUpData } from '@/fsd/4-entities/character';
import { UpgradesService, UpgradeImage, IBaseUpgrade } from '@/fsd/4-entities/upgrade';

type Selection = 'Craftable' | 'Base Upgrades';

interface IUpgradesTableRow {
    upgradeLabel: string;
    upgradeId: string;
    upgradeIcon: string;
    faction: string;
    rarity: Rarity;
    type: string;
    locations: ICampaignBattleComposed[];
    recipe: string;
    partOf: string;
    characters: Array<{
        id: string;
        icon: string;
        ranks: Rank[];
    }>;
    craftable: boolean;
}

export const Upgrades = () => {
    const selectionOptions: Selection[] = ['Base Upgrades', 'Craftable'];
    const gridRef = useRef<AgGridReact<IUpgradesTableRow>>(null);

    const [nameFilter, setNameFilter] = useState<string>('');
    const [showCharacters, setShowCharacters] = useState<boolean>(false);
    const [selection, setSelection] = useState<Selection>('Base Upgrades');

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
                                    <UnitShardIcon icon={x.icon} name={x.id} height={30} />
                                </span>
                            </Tooltip>
                            <div>
                                {x.ranks.map(rank => (
                                    <RankIcon key={rank} rank={rank} />
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
                maxWidth: 80,
            },
            {
                field: 'faction',
                headerName: 'Faction',
                maxWidth: 150,
            },
            {
                field: 'rarity',
                headerName: 'Rarity',
                maxWidth: 70,
                cellRenderer: (params: ICellRendererParams<IUpgradesTableRow>) => {
                    const { data } = params;
                    if (data) {
                        return <RarityIcon rarity={data.rarity} />;
                    }
                },
                cellClass: params => Rarity[params.data?.rarity ?? 0].toLowerCase(),
            },
            {
                field: 'type',
                headerName: 'Stat',
                cellRenderer: (params: ICellRendererParams<IUpgradesTableRow>) => {
                    const { data } = params;
                    if (data) {
                        return <MiscIcon icon={data.type.toLowerCase() as 'damage' | 'armour' | 'health'} />;
                    }
                },
                maxWidth: 80,
            },
            {
                field: 'partOf',
                headerName: 'Component for',
                maxWidth: 250,
            },
        ];

        switch (selection) {
            case 'Base Upgrades': {
                return [
                    ...base,
                    charactersColumn,
                    {
                        field: 'locations',
                        headerName: 'Locations',
                        cellRenderer: (params: ICellRendererParams<IBaseUpgrade>) => {
                            const { data } = params;
                            if (data) {
                                return (
                                    <div className="flex-box gap5 wrap">
                                        {data.locations.map(location => (
                                            <CampaignLocation
                                                key={location.id}
                                                location={location}
                                                short={true}
                                                unlocked={true}
                                            />
                                        ))}
                                    </div>
                                );
                            }
                        },
                        minWidth: 150,
                    },
                ];
            }
            case 'Craftable': {
                return [
                    ...base,
                    charactersColumn,
                    {
                        field: 'recipe',
                        headerName: 'Recipe',
                        minWidth: 150,
                    },
                ];
            }
        }
    }, [selection, showCharacters]);

    const rowsData = useMemo(() => {
        const upgradesLocations = CampaignsService.getUpgradesLocations();
        const upgrades = Object.values(UpgradesService.recipeDataByName);

        const result: IUpgradesTableRow[] = upgrades.map(x => {
            const characters: Array<{
                id: string;
                icon: string;
                ranks: Rank[];
            }> = [];

            for (const character in rankUpData) {
                const ranks = rankUpData[character];

                for (const rank in ranks) {
                    const upgrades = ranks[rank];
                    if (upgrades.includes(x.material)) {
                        const charData = CharactersService.charactersData.find(x => x.name === character);
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

            const locations = upgradesLocations[x.material]?.map(
                (locationId: string) => CampaignsService.campaignsComposed[locationId]
            );
            const partOf = upgrades
                .filter(m => m.recipe?.some(u => u.material === x.material) ?? false)
                .map(u => u.label ?? u.material)
                .join('\r\n');
            return {
                upgradeLabel: x.label ?? x.material,
                upgradeId: x.material,
                upgradeIcon: x.icon ?? '',
                faction: x.faction ?? '',
                rarity: RarityMapper.stringToNumber[x.rarity as unknown as RarityString],
                type: x.stat,
                locations,
                partOf,
                recipe: x.recipe?.map(x => x.material + ' - ' + x.count).join('\r\n') ?? '',
                characters: characters,
                craftable: x.craftable,
            };
        });

        return result;
    }, []);

    const rows = useMemo(() => {
        return rowsData
            .filter(
                upgrade =>
                    upgrade.upgradeLabel.toLowerCase().includes(nameFilter.toLowerCase()) ||
                    upgrade.recipe.toLowerCase().includes(nameFilter.toLowerCase()) ||
                    upgrade.partOf.toLowerCase().includes(nameFilter.toLowerCase()) ||
                    upgrade.upgradeId.toLowerCase().includes(nameFilter.toLowerCase())
            )
            .filter(upgrade => {
                switch (selection) {
                    case 'Craftable': {
                        return upgrade.craftable && upgrade.type !== 'Shard';
                    }
                    case 'Base Upgrades': {
                        return !upgrade.craftable && upgrade.type !== 'Shard';
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
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
                    suppressCellFocus={true}
                    defaultColDef={{ resizable: true, sortable: true, autoHeight: true, wrapText: true }}
                    columnDefs={columnDefs}
                    rowData={rows}
                    onGridReady={useFitGridOnWindowResize(gridRef)}></AgGridReact>
            </div>
        </div>
    );
};
