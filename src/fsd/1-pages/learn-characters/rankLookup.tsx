﻿import { ArrowForward, Info } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import { FormControlLabel, Popover, Switch } from '@mui/material';
import { AllCommunityModule, themeBalham, ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { orderBy, sum } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Rarity, Rank, RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignLocation } from '@/fsd/4-entities/campaign';
import { RankSelect, RankIcon, ICharacter2 } from '@/fsd/4-entities/character';
import { UnitsAutocomplete } from '@/fsd/4-entities/unit';
import {
    IMaterialFull,
    IMaterialRecipeIngredientFull,
    UpgradeImage,
    IMaterialEstimated2,
    UpgradesService,
} from '@/fsd/4-entities/upgrade';

import { RankLookupService } from './rank-lookup.service';

export const RankLookup = () => {
    const { characters, campaignsProgress, inventory } = useContext(StoreContext);
    const [searchParams, setSearchParams] = useSearchParams();

    const rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
    const [character, setCharacter] = useState<ICharacter2 | null>(() => {
        const queryParamsCharacter = searchParams.get('character');

        return characters.find(x => x.name === queryParamsCharacter) ?? characters[0];
    });

    const [rankStart, setRankStart] = useState<Rank>(() => {
        const queryParamsRank = searchParams.get('rankStart');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return queryParamsRank ? (Rank[queryParamsRank] ?? Rank.Stone1) : Rank.Stone1;
    });
    const [rankEnd, setRankEnd] = useState<Rank>(() => {
        const queryParamsRank = searchParams.get('rankEnd');

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return queryParamsRank ? (Rank[queryParamsRank] ?? Rank.Stone2) : Rank.Stone2;
    });
    const [rankPoint5, setRankPoint5] = useState<boolean>(() => {
        const queryParamsRankPoint5 = searchParams.get('rankPoint5');

        return !!queryParamsRankPoint5 && queryParamsRankPoint5 === 'true';
    });

    const [anchorEl2, setAnchorEl2] = React.useState<HTMLElement | null>(null);
    const [materialRecipe, setMaterialRecipe] = React.useState<IMaterialFull | null>(null);

    /**
     * Holds the set of uncraftable upgrade materials needed to rank up this
     * character.
     */
    const upgrades = useMemo<IMaterialFull[]>(() => {
        if (!character) {
            return [];
        }

        return RankLookupService.getUpgradeMaterialsToRankUp({
            unitId: character.snowprintId ?? '',
            unitName: character.id,
            rankStart,
            rankEnd,
            appliedUpgrades: [],
            rankPoint5,
            upgradesRarity: [],
        });
    }, [character?.id, rankStart, rankEnd, rankPoint5]);

    const message = (function () {
        if (!character) {
            return 'Select character';
        }

        return 'Upgrades:';
    })();

    const groupByRanks = useMemo(() => {
        const result: Array<{
            rank1: Rank;
            rank2: Rank;
            materials: IMaterialFull[];
        }> = [];

        let currRank = rankStart < Rank.Stone1 ? Rank.Stone1 : rankStart;
        const endRank = rankEnd < rankStart ? rankStart : rankEnd > Rank.Adamantine1 ? Rank.Adamantine1 : rankEnd;
        const upgradesCopy = upgrades.slice();

        while (currRank !== endRank) {
            const rankUpgrades = upgradesCopy.splice(0, 6);
            result.push({ rank1: currRank, rank2: currRank + 1, materials: rankUpgrades });
            currRank++;
        }

        if (rankPoint5 && upgradesCopy.length) {
            result.push({
                rank1: endRank,
                rank2: endRank,
                materials: upgradesCopy,
            });
        }

        return result;
    }, [upgrades, rankStart]);

    const totalMaterials = useMemo<IMaterialEstimated2[]>(() => {
        return orderBy(RankLookupService.getAllMaterials(campaignsProgress, {}, upgrades), ['rarity'], ['desc']);
    }, [upgrades]);

    const renderUpgradesMaterials = (materials: Array<IMaterialRecipeIngredientFull>) => (
        <ul>
            {materials.map(item => (
                <li key={item.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className={Rarity[item.rarity]?.toLowerCase()}>{Rarity[item.rarity]}</span> -{' '}
                        <UpgradeImage
                            material={item.label}
                            iconPath={item.iconPath}
                            rarity={RarityMapper.rarityToRarityString(item.rarity)}
                            size={30}
                        />{' '}
                        - <span style={{ fontWeight: 'bold' }}>{item.count}</span>
                    </div>
                    {item.recipe?.length ? renderUpgradesMaterials(item.recipe) : undefined}
                </li>
            ))}
        </ul>
    );

    const [columnDefs] = useState<Array<ColDef<IMaterialEstimated2>>>([
        {
            headerName: '#',
            colId: 'rowNumber',
            valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
            maxWidth: 50,
        },
        {
            headerName: 'Material',
            cellRenderer: (params: ICellRendererParams<IMaterialEstimated2>) => {
                const { data } = params;
                if (data) {
                    return (
                        <UpgradeImage
                            material={data.label}
                            iconPath={data.iconPath}
                            rarity={RarityMapper.rarityToRarityString(data.rarity)}
                        />
                    );
                }
            },
            equals: () => true,
            sortable: false,
            width: 80,
        },
        {
            headerName: 'Name',
            cellRenderer: (params: ICellRendererParams<IMaterialEstimated2>) => {
                const { data } = params;
                if (data) return data.label;
            },
            equals: () => true,
            sortable: false,
            width: 80,
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
            headerName: 'Locations',
            minWidth: 300,
            flex: 1,
            cellRenderer: (params: ICellRendererParams<IMaterialEstimated2>) => {
                const { data } = params;
                if (data) {
                    return (
                        <div className="flex-box wrap" style={{ gap: '5px' }}>
                            {data.possibleLocations.map(location => (
                                <CampaignLocation
                                    key={location.id}
                                    location={location}
                                    short={true}
                                    unlocked={data.unlockedLocations.includes(location.id)}
                                />
                            ))}
                        </div>
                    );
                }
            },
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

    const updateRankPoint5 = (value: boolean) => {
        setRankPoint5(value);

        setSearchParams(curr => {
            curr.set('rankPoint5', value + '');
            return curr;
        });
    };

    const renderMaterials = (materials: IMaterialFull[]) => {
        const healthUpgrades: IMaterialFull[] = materials.filter(x => x.stat === 'Health');
        const damageUpgrades: IMaterialFull[] = materials.filter(x => x.stat === 'Damage');
        const armourUpgrades: IMaterialFull[] = materials.filter(x => x.stat === 'Armour');

        const handleRecipeClick = (target: HTMLElement, material: IMaterialFull) => {
            setAnchorEl2(target);
            setMaterialRecipe(material);
        };

        return (
            <div style={{ display: 'flex' }}>
                <div className="flex-box column gap5">
                    <MiscIcon icon={'health'} height={30} />
                    {healthUpgrades.map((x, index) => {
                        return (
                            <div key={x.id + index} onClick={event => handleRecipeClick(event.currentTarget, x)}>
                                <UpgradeImage
                                    material={x.label}
                                    iconPath={x.iconPath}
                                    rarity={RarityMapper.rarityToRarityString(x.rarity)}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="flex-box column gap5">
                    <MiscIcon icon={'damage'} height={30} />
                    {damageUpgrades.map((x, index) => (
                        <div key={x.id + index} onClick={event => handleRecipeClick(event.currentTarget, x)}>
                            <UpgradeImage
                                material={x.label}
                                iconPath={x.iconPath}
                                rarity={RarityMapper.rarityToRarityString(x.rarity)}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex-box column gap5">
                    <MiscIcon icon={'armour'} height={30} />
                    {armourUpgrades.map((x, index) => (
                        <div key={x.id + index} onClick={event => handleRecipeClick(event.currentTarget, x)}>
                            <UpgradeImage
                                material={x.label}
                                iconPath={x.iconPath}
                                rarity={RarityMapper.rarityToRarityString(x.rarity)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '20px',
                }}>
                <UnitsAutocomplete
                    label="Chracters"
                    style={{ maxWidth: 300 }}
                    unit={character}
                    options={characters}
                    onUnitChange={value => {
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
                <div className="flex gap-5 items-center flex-wrap">
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
                    <div className="flex-box">
                        <FormControlLabel
                            label="Point Five"
                            control={
                                <Switch
                                    checked={rankPoint5}
                                    onChange={value => updateRankPoint5(value.target.checked)}
                                    inputProps={{ 'aria-label': 'controlled' }}
                                />
                            }
                        />
                        <AccessibleTooltip
                            title={
                                'When you reach a target upgrade rank, you are immediately able to apply the top row of three upgrades.\r\nIf you toggle on this switch then these upgrades will be included in your daily raids plan.'
                            }>
                            <Info color="primary" />
                        </AccessibleTooltip>
                    </div>
                </div>
            </div>

            <div>
                <div
                    className="ag-theme-material"
                    style={{ height: 50 + totalMaterials.length * 30, maxHeight: '40vh', width: '100%' }}>
                    <AgGridReact
                        modules={[AllCommunityModule]}
                        theme={themeBalham}
                        suppressCellFocus={true}
                        defaultColDef={{ suppressMovable: true, sortable: true, wrapText: true, autoHeight: true }}
                        rowHeight={60}
                        rowBuffer={3}
                        columnDefs={columnDefs}
                        rowData={totalMaterials}
                    />
                </div>

                <h3>{message}</h3>
                <div className="flex-box gap5">
                    <InfoIcon color="primary" />
                    <span>Click on the upgrade to view recipe</span>
                </div>
                <div className="flex gap-5 flex-wrap">
                    {groupByRanks.map((x, index) => (
                        <div key={index}>
                            <div className="flex gap-[3px] justify-center">
                                <RankIcon rank={x.rank1} /> <ArrowForward />
                                <RankIcon
                                    rank={x.rank2}
                                    rankPoint5={x.rank1 === rankEnd && x.rank2 === rankEnd && rankPoint5}
                                />
                            </div>
                            {renderMaterials(x.materials)}
                        </div>
                    ))}
                    <Popover
                        open={!!materialRecipe}
                        anchorEl={anchorEl2}
                        onClose={() => setMaterialRecipe(null)}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}>
                        {materialRecipe && (
                            <div style={{ margin: 20, width: 300 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <MiscIcon icon={materialRecipe.stat.toLowerCase() as any} />
                                    <span className={Rarity[materialRecipe.rarity]?.toLowerCase()}>
                                        {Rarity[materialRecipe.rarity]}
                                    </span>{' '}
                                    -{' '}
                                    <UpgradeImage
                                        material={materialRecipe.label}
                                        iconPath={materialRecipe.iconPath}
                                        rarity={RarityMapper.rarityToRarityString(materialRecipe.rarity)}
                                        size={30}
                                    />
                                </div>
                                {materialRecipe.recipe?.length
                                    ? renderUpgradesMaterials(materialRecipe.recipe)
                                    : undefined}
                            </div>
                        )}
                    </Popover>
                </div>
            </div>
        </div>
    );
};
