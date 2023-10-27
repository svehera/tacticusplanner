import React, { useContext, useMemo, useRef, useState } from 'react';

import {
    ICampaignBattleComposed,
    ICharacter2,
    IMaterialFull,
    IMaterialRecipeIngredientFull,
} from '../../models/interfaces';
import { StaticDataService } from '../../services';
import { fitGridOnWindowResize, getEnumValues, rankToString } from '../../shared-logic/functions';
import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { Rank, Rarity } from '../../models/enums';
import { RankImage } from '../../shared-components/rank-image';
import { CharactersAutocomplete } from '../../shared-components/characters-autocomplete';
import { StoreContext } from '../../reducers/store.provider';
import { groupBy, map, orderBy, sortBy, sum, sumBy } from 'lodash';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';

export const RankLookup = () => {
    const gridRef = useRef<AgGridReact<ICampaignBattleComposed>>(null);
    const { characters } = useContext(StoreContext);
    const charactersOptions = sortBy(characters, 'name');
    const rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
    const [character, setCharacter] = useState<ICharacter2 | null>(charactersOptions[0]);
    const [rank, setRank] = useState<Rank>(Rank.Stone1);
    const [message, setMessage] = useState<string>('Upgrades:');
    const [totalGold, setTotalGold] = useState<number>(0);

    // for debug
    // charactersOptions.forEach(x => {
    //     const characterUpgrades = StaticDataService.rankUpData[x.name];
    //     if (!characterUpgrades) {
    //         console.log(x.name);
    //     }
    // });

    const upgrades = useMemo<IMaterialFull[]>(() => {
        if (!character) {
            setMessage('Select character');
            return [];
        }

        const characterUpgrades = StaticDataService.rankUpData[character?.name ?? ''];
        if (!characterUpgrades) {
            setMessage('Upgrades not founds');
            return [];
        }

        const rankUpgrades = characterUpgrades[rankToString(rank)];

        if (!rankUpgrades) {
            setMessage('Upgrades not founds');
            return [];
        }

        const recipes = rankUpgrades.map(upgrade => {
            const recipe = StaticDataService.recipeDataFull[upgrade];
            if (!recipe) {
                console.error('Recipe for ' + upgrade + ' is not found');
            }
            return recipe;
        });

        setMessage('Upgrades:');
        return recipes.filter(x => !!x);
    }, [character?.name, rank]);

    const totalMaterials = useMemo<IMaterialEstimated[]>(() => {
        const groupedData = groupBy(
            upgrades.flatMap(x => x.allMaterials ?? []),
            'material'
        );

        const result = map(groupedData, (items, material) => ({
            material,
            count: sumBy(items, 'count'),
            rarity: items[0].rarity,
            stat: items[0].stat,
            locations: items[0].locations,
            locationsComposed: items[0].locations?.map(location => StaticDataService.campaignsComposed[location]),
        }));
        const goldIndex = result.findIndex(x => x.material === 'Gold');

        if (goldIndex > -1) {
            const [gold] = result.splice(goldIndex, 1);
            setTotalGold(gold.count);
        } else {
            setTotalGold(0);
        }
        return orderBy(result, ['rarity', 'count'], ['desc', 'desc']).map(x => {
            const itemResult: IMaterialEstimated = {
                material: x.material,
                count: x.count,
                rarity: x.rarity,
                locations: x.locations ?? [],
                expectedEnergy: 0,
                numberOfBattles: 0,
            };

            if (x.locationsComposed?.length) {
                const minEnergy = Math.min(...x.locationsComposed.map(x => x.energyPerItem));

                const locations = x.locationsComposed.filter(location => location.energyPerItem === minEnergy);

                itemResult.locations = locations.map(x => x.campaign + ' ' + x.nodeNumber);

                itemResult.expectedEnergy = parseFloat((x.count * minEnergy).toFixed(2));
                itemResult.numberOfBattles = Math.ceil(itemResult.expectedEnergy / locations[0].energyCost);
            }

            return itemResult;
        });
    }, [upgrades]);

    const totalEnergy = useMemo<number>(() => {
        return Math.round(sum(totalMaterials.map(x => x.expectedEnergy)));
    }, [totalMaterials]);

    const renderUpgradesMaterials = (materials: Array<IMaterialRecipeIngredientFull>) => (
        <ul>
            {materials.map(item => (
                <li key={item.material}>
                    <span className={Rarity[item.rarity]?.toLowerCase()}>{Rarity[item.rarity]}</span> -{' '}
                    <span>{item.material}</span> - <span style={{ fontWeight: 'bold' }}>{item.count}</span>
                    {item.recipe?.length ? renderUpgradesMaterials(item.recipe) : undefined}
                </li>
            ))}
        </ul>
    );

    const [columnDefs] = useState<Array<ColDef>>([
        {
            headerName: '#',
            colId: 'rowNumber',
            valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
            maxWidth: 50,
            width: 50,
            minWidth: 50,
            pinned: true,
        },
        {
            pinned: true,
            field: 'material',
            maxWidth: 300,
        },
        {
            field: 'count',
            maxWidth: 75,
        },
        {
            field: 'rarity',
            maxWidth: 120,
            valueFormatter: (params: ValueFormatterParams<IMaterialEstimated>) => Rarity[params.data?.rarity ?? 0],
            cellClass: params => Rarity[params.data?.rarity ?? 0].toLowerCase(),
        },
        {
            field: 'expectedEnergy',
            maxWidth: 120,
        },
        {
            headerName: '# Of Battles',
            field: 'numberOfBattles',
            maxWidth: 100,
        },
        {
            field: 'locations',
        },
    ]);

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    margin: '0 20px',
                }}>
                <CharactersAutocomplete
                    character={character}
                    characters={charactersOptions}
                    onCharacterChange={value => setCharacter(value)}
                    shortChar={true}
                />
                <FormControl style={{ width: 200, margin: 20 }}>
                    <InputLabel>Rank</InputLabel>
                    <Select label={'Rank'} value={rank} onChange={event => setRank(+event.target.value)}>
                        {rankEntries.map(value => (
                            <MenuItem key={value} value={value}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span>{rankToString(value)}</span>
                                    <RankImage rank={value} />
                                </div>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>

            <div style={{ display: 'flex' }}>
                <div style={{ flexBasis: '25%' }}>
                    <h3>{message}</h3>
                    <ul>
                        {upgrades.map(item => (
                            <li key={item.material}>
                                <span>{item.stat}</span> -{' '}
                                <span className={Rarity[item.rarity]?.toLowerCase()}>{Rarity[item.rarity]}</span> -{' '}
                                <span>{item.material}</span>
                                {item.recipe?.length ? renderUpgradesMaterials(item.recipe) : undefined}
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ flexBasis: '75%' }}>
                    <h3>Total</h3>
                    {totalGold > 0 ? <h4 style={{ paddingInlineStart: 40 }}>Gold - {totalGold}</h4> : undefined}
                    {totalEnergy > 0 ? <h4 style={{ paddingInlineStart: 40 }}>Energy - {totalEnergy}</h4> : undefined}
                    {totalEnergy > 0 ? (
                        <h4 style={{ paddingInlineStart: 40 }}>
                            Battles - {sum(totalMaterials.map(x => x.numberOfBattles))}
                        </h4>
                    ) : undefined}

                    <div
                        className="ag-theme-material"
                        style={{ height: 50 + totalMaterials.length * 30, width: '100%' }}>
                        <AgGridReact
                            ref={gridRef}
                            suppressCellFocus={true}
                            defaultColDef={{ resizable: true, sortable: true, autoHeight: true, wrapText: true }}
                            columnDefs={columnDefs}
                            rowData={totalMaterials}
                            // getRowStyle={getRowStyle}
                            onGridReady={fitGridOnWindowResize(gridRef)}></AgGridReact>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface IMaterialEstimated {
    material: string;
    count: number;
    rarity: Rarity;
    locations: string[];
    expectedEnergy: number;
    numberOfBattles: number;
}
