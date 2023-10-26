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

export const RankLookup = () => {
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

    const totalMaterials = useMemo<IMaterialRecipeIngredientFull[]>(() => {
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
        return orderBy(result, ['rarity', 'count'], ['desc', 'desc']);
    }, [upgrades]);

    const totalEnergy = useMemo<number>(() => {
        const total = totalMaterials.map(x => {
            const minEnergy = x.locationsComposed?.length
                ? Math.min(...x.locationsComposed.map(x => 1 / (x.dropRate / x.energyCost)))
                : 0;
            return parseFloat((x.count * minEnergy).toFixed(2));
        });
        return Math.round(sum(total));
    }, [totalMaterials]);

    const renderUpgradesMaterials = (materials: Array<IMaterialRecipeIngredientFull>, locations = false) => (
        <ul>
            {materials.map(item => (
                <li key={item.material}>
                    <span className={Rarity[item.rarity]?.toLowerCase()}>{Rarity[item.rarity]}</span> -{' '}
                    <span>{item.material}</span> - <span style={{ fontWeight: 'bold' }}>{item.count}</span>
                    {locations ? (
                        <span style={{ fontStyle: 'italic' }}> - {item.locations?.join(', ')}</span>
                    ) : // <span>{item.locationsComposed?.map(x => `${x.campaign} ${x.nodeNumber}`).join(', ')}</span>
                    undefined}
                    {item.recipe?.length ? renderUpgradesMaterials(item.recipe) : undefined}
                </li>
            ))}
        </ul>
    );

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

            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
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
                <div>
                    <h3>Total</h3>
                    {totalGold > 0 ? <h4 style={{ paddingInlineStart: 40 }}>Gold - {totalGold}</h4> : undefined}
                    {totalEnergy > 0 ? <h4 style={{ paddingInlineStart: 40 }}>Energy - {totalEnergy}</h4> : undefined}

                    {renderUpgradesMaterials(totalMaterials, true)}
                </div>
            </div>
        </div>
    );
};
