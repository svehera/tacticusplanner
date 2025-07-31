import { ColDef, ColGroupDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import React, { useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { RarityStars, Rarity, DamageType, Rank, Trait, RarityMapper } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2, CharacterTitle, RankIcon } from '@/fsd/4-entities/character';
import { StatCell, DamageCell, StatsCalculatorService } from '@/fsd/4-entities/unit';

export const useCharacters = () => {
    const [targetRarity, setTargetRarity] = useState<Rarity>(Rarity.Legendary);
    const [targetStars, setTargetStars] = useState<RarityStars>(RarityStars.BlueOneStar);
    const [targetRank, setTargetRank] = useState<Rank>(Rank.Diamond3);

    const minStarsMap: Map<Rarity, RarityStars> = new Map([
        [Rarity.Common, RarityStars.None],
        [Rarity.Uncommon, RarityStars.TwoStars],
        [Rarity.Rare, RarityStars.FourStars],
        [Rarity.Epic, RarityStars.RedOneStar],
        [Rarity.Legendary, RarityStars.RedThreeStars],
    ]);

    const minRank = useMemo(() => {
        return Rank.Stone1;
    }, [targetRarity]);

    const maxRank = useMemo(() => {
        return RarityMapper.toMaxRank[targetRarity];
    }, [targetRarity]);

    const minStars = useMemo(() => {
        return minStarsMap.get(targetRarity) ?? RarityStars.None;
    }, [targetRarity]);

    const maxStars = useMemo(() => {
        return minStarsMap.get(targetRarity + 1) ?? RarityStars.BlueOneStar;
    }, [targetRarity]);

    const rankValues = useMemo(() => {
        return getEnumValues(Rank).filter(x => x >= minRank && x <= maxRank);
    }, [minRank, maxRank]);

    const starValues = useMemo(() => {
        return getEnumValues(RarityStars).filter(x => x >= minStars && x <= maxStars);
    }, [minStars, maxStars]);

    const onTargetRarityChanged = (rarity: Rarity) => {
        if (rarity < targetRarity) {
            const maxRank = RarityMapper.toMaxRank[rarity];
            setTargetRarity(rarity);
            setTargetStars(minStarsMap.get(rarity + 1) ?? RarityStars.BlueOneStar);
            if (targetRank > maxRank) {
                setTargetRank(maxRank);
            }
        } else if (rarity > targetRarity) {
            setTargetRarity(rarity);
            setTargetStars(minStarsMap.get(rarity) ?? RarityStars.None);
        }
    };

    const onTargetStarsChanged = (stars: RarityStars) => {
        setTargetStars(stars);
    };

    const onTargetRankChanged = (rank: Rank) => {
        setTargetRank(rank);
    };

    const columnDefs = useMemo<Array<ColDef<ICharacter2> | ColGroupDef>>(
        () => [
            {
                headerName: 'Character',
                pinned: !isMobile,
                openByDefault: !isMobile,
                children: [
                    {
                        headerName: '#',
                        colId: 'rowNumber',
                        valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
                        maxWidth: 50,
                        width: 50,
                        pinned: !isMobile,
                    },
                    {
                        headerName: 'Name',
                        width: isMobile ? 75 : 200,
                        pinned: !isMobile,
                        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                            const character = props.data;
                            return (
                                character && (
                                    <CharacterTitle
                                        character={character}
                                        hideName={isMobile}
                                        short={true}
                                        imageSize={30}
                                    />
                                )
                            );
                        },
                    },
                    {
                        headerName: 'Rarity',
                        width: 80,
                        columnGroupShow: 'open',
                        pinned: !isMobile,
                        valueGetter: (props: ValueGetterParams<ICharacter2>) => {
                            return props.data?.rarity;
                        },
                        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                            const rarity = props.value ?? 0;
                            return <RarityIcon rarity={rarity} />;
                        },
                    },
                    {
                        headerName: 'Rank',
                        width: 80,
                        columnGroupShow: 'open',
                        pinned: !isMobile,
                        valueGetter: (props: ValueGetterParams<ICharacter2>) => {
                            return props.data?.rank;
                        },
                        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                            const rank = props.value ?? 0;
                            return <RankIcon rank={rank} />;
                        },
                    },
                    {
                        field: 'faction',
                        headerName: 'Faction',
                        width: 170,
                        columnGroupShow: 'open',
                        pinned: !isMobile,
                    },
                ],
            },

            {
                headerName: 'Current Stats',
                children: [
                    {
                        columnGroupShow: 'closed',
                        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                            return (
                                <StatCell
                                    characterId={props.data?.id ?? ''}
                                    rank={props.data?.rank ?? Rank.Stone1}
                                    rarity={props.data?.rarity ?? Rarity.Common}
                                    rarityStars={props.data?.stars ?? RarityStars.None}
                                    numHealthUpgrades={StatsCalculatorService.countHealthUpgrades(
                                        props.data as ICharacter2
                                    )}
                                    numDamageUpgrades={StatsCalculatorService.countDamageUpgrades(
                                        props.data as ICharacter2
                                    )}
                                    numArmorUpgrades={StatsCalculatorService.countArmorUpgrades(
                                        props.data as ICharacter2
                                    )}
                                />
                            );
                        },
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'Health',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatsCalculatorService.getHealth(props.data),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'Damage',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatsCalculatorService.getDamage(props.data),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'Armour',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatsCalculatorService.getArmor(props.data),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'DAMVAR',
                        cellRenderer: (props: ValueGetterParams<ICharacter2>) => {
                            return (
                                <DamageCell
                                    character={props.data as ICharacter2}
                                    rank={props.data?.rank ?? Rank.Stone1}
                                    rarity={props.data?.rarity ?? Rarity.Common}
                                    rarityStars={props.data?.stars ?? RarityStars.None}
                                    numDamageUpgrades={StatsCalculatorService.countDamageUpgrades(
                                        props.data as ICharacter2
                                    )}
                                />
                            );
                        },
                    },
                ],
            },
            {
                headerName: 'Target Stats',
                children: [
                    {
                        columnGroupShow: 'closed',
                        colId: 'Target Stats',
                        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                            return (
                                <StatCell
                                    characterId={props.data?.id ?? ''}
                                    rank={targetRank}
                                    rarity={targetRarity}
                                    rarityStars={targetStars}
                                    numHealthUpgrades={StatsCalculatorService.countHealthUpgrades(
                                        props.data as ICharacter2
                                    )}
                                    numDamageUpgrades={StatsCalculatorService.countDamageUpgrades(
                                        props.data as ICharacter2
                                    )}
                                    numArmorUpgrades={StatsCalculatorService.countArmorUpgrades(
                                        props.data as ICharacter2
                                    )}
                                />
                            );
                        },
                    },
                    {
                        columnGroupShow: 'open',
                        colId: 'Target Health',
                        headerName: 'Health',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatsCalculatorService.calculateHealth(
                                props.data?.id ?? '',
                                targetRarity,
                                targetStars,
                                targetRank,
                                0
                            ),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        colId: 'Target Damage',
                        headerName: 'Damage',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatsCalculatorService.calculateDamage(
                                props.data?.id ?? '',
                                targetRarity,
                                targetStars,
                                targetRank,
                                0
                            ),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        colId: 'Target Armour',
                        headerName: 'Armour',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatsCalculatorService.calculateArmor(
                                props.data?.id ?? '',
                                targetRarity,
                                targetStars,
                                targetRank,
                                0
                            ),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'DAMVAR',
                        cellRenderer: (props: ValueGetterParams<ICharacter2>) => {
                            return (
                                <DamageCell
                                    character={props.data as ICharacter2}
                                    rank={targetRank}
                                    rarity={targetRarity}
                                    rarityStars={targetStars}
                                    numDamageUpgrades={0}
                                />
                            );
                        },
                    },
                ],
            },
            {
                field: 'damageTypes.all',
                headerName: 'Damage Types',
                width: 120,
                cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                    const damageTypes: DamageType[] = props.value ?? [];
                    return (
                        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                            {damageTypes.map(x => (
                                <li key={x}> {x} </li>
                            ))}
                        </ul>
                    );
                },
            },
            {
                field: 'traits',
                headerName: 'Traits',
                width: 180,
                cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                    const traits: Trait[] = props.value ?? [];
                    return (
                        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                            {traits.map(x => (
                                <li key={x}> {x} </li>
                            ))}
                        </ul>
                    );
                },
            },
            {
                headerName: 'Stats',
                headerTooltip: 'Movement-Melee-Range-Distance',
                children: [
                    {
                        headerName: 'All',
                        width: 150,
                        columnGroupShow: 'closed',
                        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                            const data = props.data;
                            return (
                                data && (
                                    <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                                        <li>Movement - {data.movement} </li>
                                        <li> Melee - {data.meleeHits} </li>
                                        {data.rangeHits && <li>Range - {data.rangeHits} </li>}
                                        {data.rangeDistance && <li>Distance - {data.rangeDistance} </li>}
                                    </ul>
                                )
                            );
                        },
                    },
                    {
                        field: 'movement',
                        headerName: 'Movement',
                        width: 100,
                        columnGroupShow: 'open',
                    },
                    {
                        field: 'meleeHits',
                        headerName: 'Melee',
                        width: 100,
                        columnGroupShow: 'open',
                    },
                    {
                        field: 'rangeHits',
                        headerName: 'Range',
                        width: 100,
                        columnGroupShow: 'open',
                    },
                    {
                        field: 'rangeDistance',
                        headerName: 'Distance',
                        width: 100,
                        columnGroupShow: 'open',
                    },
                ],
            },
            {
                headerName: 'Equipment',
                children: [
                    {
                        headerName: 'All',
                        width: 180,
                        columnGroupShow: 'closed',
                        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                            const data = props.data;
                            return (
                                data && (
                                    <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                                        <li>Slot 1 - {data.equipment1} </li>
                                        <li> Slot 2 - {data.equipment2} </li>
                                        <li> Slot 3 - {data.equipment3} </li>
                                    </ul>
                                )
                            );
                        },
                    },
                    {
                        field: 'equipment1',
                        headerName: 'Slot 1',
                        width: 100,
                        columnGroupShow: 'open',
                    },
                    {
                        field: 'equipment2',
                        headerName: 'Slot 2',
                        width: 100,
                        columnGroupShow: 'open',
                    },
                    {
                        field: 'equipment3',
                        headerName: 'Slot 3',
                        width: 100,
                        columnGroupShow: 'open',
                    },
                ],
            },
            {
                headerName: 'Misc',
                children: [
                    {
                        headerName: 'All',
                        width: 180,
                        columnGroupShow: 'closed',
                        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                            const data = props.data;
                            return (
                                data && (
                                    <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                                        {data.requiredInCampaign && <li>Required for Campaigns </li>}
                                        {data.forcedSummons && <li>Forced summons</li>}
                                    </ul>
                                )
                            );
                        },
                    },
                    {
                        field: 'requiredInCampaign',
                        headerName: 'Campaign',
                        cellRenderer: 'agCheckboxCellRenderer',
                        width: 100,
                        columnGroupShow: 'open',
                    },
                    {
                        field: 'forcedSummons',
                        headerName: 'Forced Summons',
                        cellRenderer: 'agCheckboxCellRenderer',
                        width: 100,
                        columnGroupShow: 'open',
                    },
                ],
            },
        ],
        [targetRank, targetRarity, targetStars]
    );

    return {
        columnDefs,
        // Target values
        targetRarity,
        targetStars,
        targetRank,
        // Set of values for rank and stars.
        rankValues,
        starValues,
        // Target-changed callbacks.
        onTargetRarityChanged,
        onTargetStarsChanged,
        onTargetRankChanged,
    };
};
