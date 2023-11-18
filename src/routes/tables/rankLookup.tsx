import React, { useContext, useMemo, useState } from 'react';

import {
    ICharacter2,
    IMaterialEstimated2,
    IMaterialFull,
    IMaterialRecipeIngredientFull,
} from '../../models/interfaces';
import { StaticDataService } from '../../services';
import { getEnumValues } from '../../shared-logic/functions';
import { Rank, Rarity } from '../../models/enums';
import { CharactersAutocomplete } from '../../shared-components/characters-autocomplete';
import { StoreContext } from '../../reducers/store.provider';
import { orderBy, sortBy, sum } from 'lodash';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { isMobile } from 'react-device-detect';
import { useSearchParams } from 'react-router-dom';
import { defaultCampaignsProgress } from '../../models/constants';
import { UpgradeImage } from '../../shared-components/upgrade-image';
import { RankSelect } from '../../shared-components/rank-select';

export const RankLookup = () => {
    const { characters } = useContext(StoreContext);
    const [searchParams, setSearchParams] = useSearchParams();

    const charactersOptions = sortBy(characters, 'name');
    const rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
    const [character, setCharacter] = useState<ICharacter2 | null>(() => {
        const queryParamsCharacter = searchParams.get('character');

        return characters.find(x => x.name === queryParamsCharacter) ?? charactersOptions[0];
    });

    const [rankStart, setRankStart] = useState<Rank>(() => {
        const queryParamsRank = searchParams.get('rankStart');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return queryParamsRank ? Rank[queryParamsRank] ?? Rank.Stone1 : Rank.Stone1;
    });
    const [rankEnd, setRankEnd] = useState<Rank>(() => {
        const queryParamsRank = searchParams.get('rankEnd');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return queryParamsRank ? Rank[queryParamsRank] ?? Rank.Stone2 : Rank.Stone2;
    });

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

        setMessage('Upgrades:');
        return StaticDataService.getUpgrades({
            id: character.name,
            rankStart,
            rankEnd,
            appliedUpgrades: [],
        });
    }, [character?.name, rankStart, rankEnd]);

    const allMaterials = useMemo<IMaterialRecipeIngredientFull[]>(() => {
        const result: IMaterialRecipeIngredientFull[] = StaticDataService.groupBaseMaterials(upgrades, true);
        const goldIndex = result.findIndex(x => x.material === 'Gold');

        if (goldIndex > -1) {
            const [gold] = result.splice(goldIndex, 1);
            setTotalGold(gold.count);
        } else {
            setTotalGold(0);
        }
        return orderBy(result, ['rarity', 'count'], ['desc', 'desc']);
    }, [upgrades]);

    const totalMaterials = useMemo<IMaterialEstimated2[]>(() => {
        return orderBy(
            StaticDataService.getAllMaterials(
                {
                    completedLocations: [],
                    campaignsProgress: defaultCampaignsProgress,
                    dailyEnergy: 0,
                    upgrades: {},
                },
                upgrades
            ),
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className={Rarity[item.rarity]?.toLowerCase()}>{Rarity[item.rarity]}</span> -{' '}
                        <UpgradeImage material={item.material} iconPath={item.iconPath} size={30} /> -{' '}
                        <span style={{ fontWeight: 'bold' }}>{item.count}</span>
                    </div>
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
        },
        {
            headerName: 'Icon',
            cellRenderer: (params: ICellRendererParams<IMaterialEstimated2>) => {
                const { data } = params;
                if (data) {
                    return <UpgradeImage material={data.material} iconPath={data.iconPath} />;
                }
            },
            equals: () => true,
            sortable: false,
            width: 80,
        },
        {
            field: 'material',
            maxWidth: isMobile ? 125 : 300,
        },
        {
            field: 'count',
            maxWidth: 75,
        },
        {
            field: 'rarity',
            maxWidth: 120,
            valueFormatter: (params: ValueFormatterParams<IMaterialEstimated2>) => Rarity[params.data?.rarity ?? 0],
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
            headerName: 'Days Of Battles',
            field: 'daysOfBattles',
            maxWidth: 100,
        },
        {
            field: 'locationsString',
            headerName: 'Locations',
            minWidth: 300,
            flex: 1,
        },
    ]);

    const updateRankStart = (value: number) => {
        setRankStart(value);

        setSearchParams(curr => {
            curr.set('rankStart', Rank[value]);
            return curr;
        });
    };

    const updateRankEnd = (value: number) => {
        setRankEnd(value);

        setSearchParams(curr => {
            curr.set('rankEnd', Rank[value]);
            return curr;
        });
    };

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
                <div style={{ width: 200 }}>
                    <RankSelect
                        label={'Rank Start'}
                        rankValues={rankEntries.slice(0, rankEntries.length - 1)}
                        value={rankStart}
                        valueChanges={value => {
                            updateRankStart(value);
                            if (rankEnd <= value) {
                                updateRankEnd(value + 1);
                            }
                        }}
                    />
                </div>
                <div style={{ width: 200 }}>
                    <RankSelect
                        label={'Rank End'}
                        rankValues={rankEntries.slice(1)}
                        value={rankEnd}
                        valueChanges={value => {
                            updateRankEnd(value);
                            if (rankStart >= value) {
                                updateRankStart(value - 1);
                            }
                        }}
                    />
                </div>
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
                        defaultColDef={{ suppressMovable: true, sortable: true, wrapText: true }}
                        rowHeight={60}
                        rowBuffer={3}
                        columnDefs={columnDefs}
                        rowData={totalMaterials}
                    />
                </div>
                <div>
                    <h3>{message}</h3>
                    <ul>
                        {upgrades.map((item, index) => (
                            <li key={item.material + index}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span>{item.stat}</span> -{' '}
                                    <span className={Rarity[item.rarity]?.toLowerCase()}>{Rarity[item.rarity]}</span> -{' '}
                                    <UpgradeImage material={item.material} iconPath={item.iconPath} size={30} />
                                </div>
                                {item.recipe?.length ? renderUpgradesMaterials(item.recipe) : undefined}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
