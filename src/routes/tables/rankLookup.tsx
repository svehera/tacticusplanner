import React, { useContext, useMemo, useState } from 'react';

import { ICharacter2, IMaterialFull, IMaterialRecipeIngredientFull } from '../../models/interfaces';
import { StaticDataService } from '../../services';
import { getEnumValues, rankToString } from '../../shared-logic/functions';
import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { Rank, Rarity } from '../../models/enums';
import { RankImage } from '../../shared-components/rank-image';
import { CharactersAutocomplete } from '../../shared-components/characters-autocomplete';
import { StoreContext } from '../../reducers/store.provider';
import { groupBy, map, orderBy, sortBy, sum, sumBy } from 'lodash';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { isMobile } from 'react-device-detect';
import { useSearchParams } from 'react-router-dom';

export const RankLookup = () => {
    const { characters } = useContext(StoreContext);
    const [searchParams, setSearchParams] = useSearchParams();

    const charactersOptions = sortBy(characters, 'name');
    const rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
    const [character, setCharacter] = useState<ICharacter2 | null>(() => {
        const queryParamsCharacter = searchParams.get('character');

        return characters.find(x => x.name === queryParamsCharacter) ?? charactersOptions[0];
    });

    const [rank, setRank] = useState<Rank>(() => {
        const queryParamsRank = searchParams.get('rank');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return queryParamsRank ? Rank[queryParamsRank] ?? Rank.Stone1 : Rank.Stone1;
    });
    const [message, setMessage] = useState<string>('Upgrades:');
    const [totalGold, setTotalGold] = useState<number>(0);

    // setSearchParams();
    // location.
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
        return orderBy(
            result.map(x => {
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
            }),
            ['rarity', 'count', 'expectedEnergy'],
            ['desc', 'desc', 'desc']
        );
    }, [upgrades]);

    const totalEnergy = useMemo<number>(() => {
        return Math.ceil(sum(totalMaterials.map(x => x.expectedEnergy)));
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
            pinned: true,
        },
        {
            field: 'material',
            maxWidth: isMobile ? 125 : 300,
            pinned: true,
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
            minWidth: 300,
            flex: 1,
        },
    ]);

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '20px',
                    margin: '20px',
                }}>
                <CharactersAutocomplete
                    character={character}
                    characters={charactersOptions}
                    onCharacterChange={value => {
                        setCharacter(value);

                        setSearchParams(curr => {
                            if (value) {
                                curr.set('character', value.name);
                            } else {
                                curr.delete('character');
                            }

                            return curr;
                        });
                    }}
                    shortChar={true}
                />
                <FormControl style={{ width: 200 }}>
                    <InputLabel>Rank</InputLabel>
                    <Select
                        label={'Rank'}
                        value={rank}
                        onChange={event => {
                            setRank(+event.target.value);

                            setSearchParams(curr => {
                                curr.set('rank', Rank[+event.target.value]);
                                return curr;
                            });
                        }}>
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

            <div>
                <div style={{ display: 'flex' }}>
                    <h3>Total</h3>
                    {totalGold > 0 ? <h4 style={{ paddingInlineStart: 40 }}>Gold - {totalGold}</h4> : undefined}
                    {totalEnergy > 0 ? <h4 style={{ paddingInlineStart: 40 }}>Energy - {totalEnergy}</h4> : undefined}
                    {totalEnergy > 0 ? (
                        <h4 style={{ paddingInlineStart: 40 }}>
                            Battles - {sum(totalMaterials.map(x => x.numberOfBattles))}
                        </h4>
                    ) : undefined}
                </div>

                <div
                    className="ag-theme-material"
                    style={{ height: 50 + totalMaterials.length * 30, maxHeight: '40vh', width: '100%' }}>
                    <AgGridReact
                        suppressCellFocus={true}
                        defaultColDef={{ suppressMovable: true, sortable: true, autoHeight: true, wrapText: true }}
                        columnDefs={columnDefs}
                        rowData={totalMaterials}
                    />
                </div>
                <div>
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
