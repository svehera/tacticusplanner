import React, { ChangeEvent, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';
import {
    ColDef,
    GridApi,
    RowStyle,
    RowClassParams,
    IRowNode,
    ICellRendererParams,
    ColGroupDef,
    ValueGetterParams,
    AllCommunityModule,
    themeBalham,
} from 'ag-grid-community';

import {
    Badge,
    FormControl,
    FormControlLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Switch,
    TextField,
} from '@mui/material';

import { rarityToMaxRank } from 'src/models/constants';
import { StatCalculatorService } from 'src/v2/functions/stat-calculator-service';
import { MultipleSelectCheckmarks } from './multiple-select';
import { ICharacter2 } from 'src/models/interfaces';
import { Alliance, DamageType, Rank, Rarity, RarityStars, Trait } from 'src/models/enums';
import { isMobile } from 'react-device-detect';
import { CharacterTitle } from 'src/shared-components/character-title';
import { StoreContext } from 'src/reducers/store.provider';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { useQueryState } from 'src/v2/hooks/query-state';
import { uniq } from 'lodash';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { getEnumValues } from 'src/shared-logic/functions';
import { RankSelect } from 'src/shared-components/rank-select';
import { StarsSelect } from 'src/shared-components/stars-select';
import { t } from 'i18next';
import { RaritySelect } from 'src/shared-components/rarity-select';
import { MiscIcon } from 'src/v2/components/images/misc-image';

export const Characters = () => {
    const gridRef = useRef<AgGridReact<ICharacter2>>(null);

    const [nameFilter, setNameFilter] = useState<string>('');
    const [onlyUnlocked, setOnlyUnlocked] = useState<boolean>(false);
    const [rowCount, setRowCount] = useState(0);
    const [showFilters, setShowFilters] = React.useState(false);
    const [targetRarity, setTargetRarity] = useState<Rarity>(Rarity.Legendary);
    const [targetStars, setTargetStars] = useState<RarityStars>(RarityStars.BlueStar);
    const [targetRank, setTargetRank] = useState<Rank>(Rank.Diamond3);

    const computeMinStars = (rarity: Rarity) => {
        if (rarity === Rarity.Common) return RarityStars.None;
        if (rarity === Rarity.Uncommon) return RarityStars.TwoStars;
        if (rarity === Rarity.Rare) return RarityStars.FourStars;
        if (rarity === Rarity.Epic) return RarityStars.RedOneStar;
        return RarityStars.RedThreeStars;
    };

    const computeMaxStars = (rarity: Rarity) => {
        if (rarity === Rarity.Legendary) return RarityStars.BlueStar;
        return computeMinStars(rarity + 1);
    };

    const minRank = useMemo(() => {
        return Rank.Stone1;
    }, [targetRarity]);

    const maxRank = useMemo(() => {
        return rarityToMaxRank[targetRarity];
    }, [targetRarity]);

    const minStars = useMemo(() => {
        return computeMinStars(targetRarity);
    }, [targetRarity]);

    const maxStars = useMemo(() => {
        return computeMaxStars(targetRarity);
    }, [targetRarity]);

    const rankValues = useMemo(() => {
        return getEnumValues(Rank).filter(x => x >= minRank && x <= maxRank);
    }, [minRank, maxRank]);

    const starValues = useMemo(() => {
        return getEnumValues(RarityStars).filter(x => x >= minStars && x <= maxStars);
    }, [minStars, maxStars]);

    const onTargetRarityChanged = (rarity: Rarity) => {
        if (rarity < targetRarity) {
            setTargetRarity(rarity);
            setTargetStars(computeMaxStars(rarity));
            setTargetRank(rarityToMaxRank[rarity]);
        } else if (rarity > targetRarity) {
            setTargetRarity(rarity);
            setTargetStars(computeMinStars(rarity));
        }
        console.log('refreshing grid');
        gridRef.current?.api.refreshCells();
    };

    const onTargetStarsChanged = (stars: RarityStars) => {
        setTargetStars(stars);
        console.log('refreshing grid');
        gridRef.current?.api.refreshCells();
    };

    const onTargetRankChanged = (rank: Rank) => {
        setTargetRank(rank);
        console.log('refreshing grid');
        gridRef.current?.api.refreshCells();
    };

    const [damageTypesFilter, setDamageTypesFilter] = useQueryState<DamageType[]>(
        'damage',
        filterParam => (filterParam?.split(',') as DamageType[]) ?? [],
        queryParam => queryParam?.join(',')
    );
    const [traitsFilter, setTraitsFilter] = useQueryState<Trait[]>(
        'trait',
        filterParam => (filterParam?.split(',') as Trait[]) ?? [],
        queryParam => queryParam?.join(',')
    );
    const [allianceFilter, setAllianceFilter] = useQueryState<Alliance[]>(
        'alliance',
        filterParam => (filterParam?.split(',') as Alliance[]) ?? [],
        queryParam => queryParam?.join(',')
    );
    const [minHitsFilter, setMinHitsFilter] = useQueryState<number | ''>(
        'minHits',
        filterParam => (filterParam ? Number.parseInt(filterParam) : ''),
        queryParam => (queryParam && queryParam > 0 ? queryParam?.toString() : '')
    );
    const [maxHitsFilter, setMaxHitsFilter] = useQueryState<number | ''>(
        'maxHits',
        filterParam => (filterParam ? Number.parseInt(filterParam) : ''),
        queryParam => (queryParam && queryParam > 0 ? queryParam?.toString() : '')
    );
    const [movementFilter, setMovementFilter] = useQueryState<number | ''>(
        'movement',
        filterParam => (filterParam ? Number.parseInt(filterParam) : ''),
        queryParam => (queryParam && queryParam > 0 ? queryParam?.toString() : '')
    );
    const [distanceFilter, setDistanceFilter] = useQueryState<number | ''>(
        'distance',
        filterParam => (filterParam ? Number.parseInt(filterParam) : ''),
        queryParam => (queryParam && queryParam > 0 ? queryParam?.toString() : '')
    );
    const [attackTypeFilter, setAttackTypeFilter] = useQueryState<string | ''>(
        'attackType',
        filterParam => filterParam ?? '',
        queryParam => queryParam
    );

    const defaultColDef: ColDef<ICharacter2> = {
        sortable: true,
        resizable: true,
        autoHeight: true,
        wrapText: true,
    };

    const computePierce = (damageType: DamageType) => {
        switch (damageType) {
            case DamageType.Bio:
                return 0.3;
            case DamageType.Blast:
                return 0.15;
            case DamageType.Bolter:
                return 0.2;
            case DamageType.Chain:
                return 0.15;
            case DamageType.Direct:
                return 1.0;
            case DamageType.Energy:
                return 0.3;
            case DamageType.Eviscerate:
                return 0.5;
            case DamageType.Flame:
                return 0.25;
            case DamageType.HeavyRound:
                return 0.55;
            case DamageType.Las:
                return 0.1;
            case DamageType.Melta:
                return 0.75;
            case DamageType.Molecular:
                return 0.6;
            case DamageType.Particle:
                return 0.35;
            case DamageType.Physical:
                return 0.01;
            case DamageType.Piercing:
                return 0.8;
            case DamageType.Plasma:
                return 0.6;
            case DamageType.Power:
                return 0.4;
            case DamageType.Projectile:
                return 0.15;
            case DamageType.Pulse:
                return 0.2;
            case DamageType.Psychic:
                return 1.0;
            case DamageType.Toxic:
                return 0.7;
            default:
                console.log(damageType);
                return -1;
        }
    };

    /** @returns the computed damage with this attack against infinite armor. */
    const computeDamvarInfArmour = (damage: number, hits: number, damageType: DamageType | undefined) => {
        if (damageType == undefined) return <>N/A</>;
        if (hits == 0) return <></>;
        return <>{Math.round(damage * hits * computePierce(damageType!))}</>;
    };

    const columnDefs = useMemo(
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
                            if (character) {
                                return (
                                    <CharacterTitle
                                        character={character}
                                        hideName={isMobile}
                                        short={true}
                                        imageSize={30}
                                    />
                                );
                            }
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
                            return <RarityImage rarity={rarity} />;
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
                            return <RankImage rank={rank} />;
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
                                <table>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <MiscIcon icon={'health'} width={15} height={15} />
                                            </td>
                                            <td>{StatCalculatorService.getHealth(props.data)}</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <MiscIcon icon={'damage'} width={15} height={15} />
                                            </td>
                                            <td>{StatCalculatorService.getDamage(props.data)}</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <MiscIcon icon={'armour'} width={15} height={15} />
                                            </td>
                                            <td>{StatCalculatorService.getArmor(props.data)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'Health',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatCalculatorService.getHealth(props.data),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'Damage',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatCalculatorService.getDamage(props.data),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'Armour',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatCalculatorService.getArmor(props.data),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'DAMVAR',
                        cellRenderer: (props: ValueGetterParams<ICharacter2>) => {
                            return (
                                <table>
                                    <tbody>
                                        <tr>
                                            <th></th>
                                            <th style={{ backgroundColor: '#CCCCCC' }}>
                                                {' '}
                                                vs <MiscIcon icon={'armour'} width={15} height={15} /> 0{' '}
                                            </th>
                                            <th style={{ backgroundColor: '#DDDDDD' }}>
                                                {' '}
                                                vs <MiscIcon icon={'armour'} width={15} height={15} /> &infin;{' '}
                                            </th>
                                        </tr>
                                        <tr>
                                            <th style={{ backgroundColor: '#CCCCCC' }}>melee </th>
                                            <td style={{ backgroundColor: '#FFFFFF' }}>
                                                {StatCalculatorService.getDamage(props.data) *
                                                    (props.data?.meleeHits ?? 0)}
                                            </td>
                                            <td style={{ backgroundColor: '#EEEEEE' }}>
                                                {computeDamvarInfArmour(
                                                    StatCalculatorService.getDamage(props.data),
                                                    props.data?.meleeHits ?? 0,
                                                    props.data?.damageTypes.melee ?? undefined
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th style={{ backgroundColor: '#DDDDDD' }}>range </th>
                                            <td style={{ backgroundColor: '#EEEEEE' }}>
                                                {(props.data?.rangeHits ?? 0) == 0 ? (
                                                    <>N/A</>
                                                ) : (
                                                    StatCalculatorService.getDamage(props.data) *
                                                    (props.data?.rangeHits ?? 0)
                                                )}
                                            </td>
                                            <td style={{ backgroundColor: '#FFFFFF' }}>
                                                {computeDamvarInfArmour(
                                                    StatCalculatorService.getDamage(props.data),
                                                    props.data?.rangeHits ?? 0,
                                                    props.data?.damageTypes.range ?? undefined
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
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
                        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                            return (
                                <table>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <MiscIcon icon={'health'} width={15} height={15} />
                                            </td>
                                            <td>
                                                {StatCalculatorService.calculateHealth(
                                                    props.data?.id ?? '',
                                                    targetRarity,
                                                    targetStars,
                                                    targetRank
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <MiscIcon icon={'damage'} width={15} height={15} />
                                            </td>
                                            <td>
                                                {StatCalculatorService.calculateDamage(
                                                    props.data?.id ?? '',
                                                    targetRarity,
                                                    targetStars,
                                                    targetRank
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <MiscIcon icon={'armour'} width={15} height={15} />
                                            </td>
                                            <td>
                                                {StatCalculatorService.calculateArmor(
                                                    props.data?.id ?? '',
                                                    targetRarity,
                                                    targetStars,
                                                    targetRank
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        },
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'Health',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatCalculatorService.calculateHealth(
                                props.data?.id ?? '',
                                targetRarity,
                                targetStars,
                                targetRank
                            ),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'Damage',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatCalculatorService.calculateDamage(
                                props.data?.id ?? '',
                                targetRarity,
                                targetStars,
                                targetRank
                            ),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'Armour',
                        valueGetter: (props: ValueGetterParams<ICharacter2>) =>
                            StatCalculatorService.calculateArmor(
                                props.data?.id ?? '',
                                targetRarity,
                                targetStars,
                                targetRank
                            ),
                        width: 80,
                    },
                    {
                        columnGroupShow: 'open',
                        headerName: 'DAMVAR',
                        cellRenderer: (props: ValueGetterParams<ICharacter2>) => {
                            return (
                                <table>
                                    <tbody>
                                        <tr>
                                            <th></th>
                                            <th style={{ backgroundColor: '#CCCCCC' }}>
                                                {' '}
                                                vs <MiscIcon icon={'armour'} width={15} height={15} /> 0{' '}
                                            </th>
                                            <th style={{ backgroundColor: '#DDDDDD' }}>
                                                {' '}
                                                vs <MiscIcon icon={'armour'} width={15} height={15} /> &infin;{' '}
                                            </th>
                                        </tr>
                                        <tr>
                                            <th style={{ backgroundColor: '#CCCCCC' }}>melee </th>
                                            <td style={{ backgroundColor: '#FFFFFF' }}>
                                                {StatCalculatorService.calculateDamage(
                                                    props.data?.id ?? '',
                                                    targetRarity,
                                                    targetStars,
                                                    targetRank
                                                ) * (props.data?.meleeHits ?? 0)}
                                            </td>
                                            <td style={{ backgroundColor: '#EEEEEE' }}>
                                                {computeDamvarInfArmour(
                                                    StatCalculatorService.calculateDamage(
                                                        props.data?.id ?? '',
                                                        targetRarity,
                                                        targetStars,
                                                        targetRank
                                                    ),
                                                    props.data?.meleeHits ?? 0,
                                                    props.data?.damageTypes.melee ?? undefined
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th style={{ backgroundColor: '#DDDDDD' }}>range </th>
                                            <td style={{ backgroundColor: '#EEEEEE' }}>
                                                {(props.data?.rangeHits ?? 0) == 0 ? (
                                                    <>N/A</>
                                                ) : (
                                                    StatCalculatorService.calculateDamage(
                                                        props.data?.id ?? '',
                                                        targetRarity,
                                                        targetStars,
                                                        targetRank
                                                    ) *
                                                    (props.data?.meleeHits ?? 0) *
                                                    (props.data?.rangeHits ?? 0)
                                                )}
                                            </td>
                                            <td style={{ backgroundColor: '#FFFFFF' }}>
                                                {computeDamvarInfArmour(
                                                    StatCalculatorService.calculateDamage(
                                                        props.data?.id ?? '',
                                                        targetRarity,
                                                        targetStars,
                                                        targetRank
                                                    ),
                                                    props.data?.rangeHits ?? 0,
                                                    props.data?.damageTypes.range ?? undefined
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
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
                                <li key={x}>{x}</li>
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
                                <li key={x}>{x}</li>
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
                                        <li>Movement - {data.movement}</li>
                                        <li>Melee - {data.meleeHits}</li>
                                        {data.rangeHits && <li>Range - {data.rangeHits}</li>}
                                        {data.rangeDistance && <li>Distance - {data.rangeDistance}</li>}
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
                                        <li>Slot 1 - {data.equipment1}</li>
                                        <li>Slot 2 - {data.equipment2}</li>
                                        <li>Slot 3 - {data.equipment3}</li>
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
                                        {data.requiredInCampaign && <li>Required for Campaigns</li>}
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

    const { characters } = useContext(StoreContext);

    const hitsOptions = uniq(characters.flatMap(x => [x.meleeHits, x.rangeHits ?? 1]))
        .sort((a, b) => a - b)
        .map(x => x.toString());

    const movementOptions = uniq(characters.map(x => x.movement))
        .sort((a, b) => a - b)
        .map(x => x.toString());

    const distanceOptions = uniq(characters.filter(x => !!x.rangeDistance).map(x => x.rangeDistance ?? 1))
        .sort((a, b) => a - b)
        .map(x => x.toString());

    const damageTypesOptions = uniq(characters.flatMap(x => x.damageTypes.all)).map(x => x.toString());
    const traitsOptions = uniq(characters.flatMap(x => x.traits)).map(x => x.toString());

    const rows = useMemo(
        () =>
            characters.filter(
                c => c.name.toLowerCase().includes(nameFilter.toLowerCase()) && (!onlyUnlocked || c.rank > Rank.Locked)
            ),
        [nameFilter, onlyUnlocked]
    );

    const onFilterTextBoxChanged = useCallback((change: ChangeEvent<HTMLInputElement>) => {
        setNameFilter(change.target.value);
    }, []);

    const damageTypeFilterChanged = useCallback((newValue: string[]) => {
        setDamageTypesFilter(newValue as DamageType[]);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const traitsFilterChanged = useCallback((newValue: string[]) => {
        setTraitsFilter(newValue as Trait[]);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const allianceFilterChanged = useCallback((newValue: string[]) => {
        setAllianceFilter(newValue as Alliance[]);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const minHitsFilterChange = useCallback((event: SelectChangeEvent<number>) => {
        setMinHitsFilter(+event.target.value);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const maxHitsFilterChange = useCallback((event: SelectChangeEvent<number>) => {
        setMaxHitsFilter(+event.target.value);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const movementFilterChange = useCallback((event: SelectChangeEvent<number>) => {
        setMovementFilter(+event.target.value);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const distanceFilterChange = useCallback((event: SelectChangeEvent<number>) => {
        setDistanceFilter(+event.target.value);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const attackTypeFilterChange = useCallback((event: SelectChangeEvent) => {
        setAttackTypeFilter(event.target.value);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const isExternalFilterPresent = useCallback(() => {
        const hasDamageTypeFilter = damageTypesFilter.length > 0;
        const hasTraitsFilter = traitsFilter.length > 0;
        const hasAllianceFilter = allianceFilter.length > 0;
        const hasMinHitsFilter = !!minHitsFilter && minHitsFilter > 0;
        const hasMaxHitsFilter = !!maxHitsFilter && maxHitsFilter > 0;
        const hasMovementFilter = !!movementFilter && movementFilter > 0;
        const hasDistanceFilter = !!distanceFilter && distanceFilter > 0;
        const hasAttackTypeFilter = !!attackTypeFilter;
        return (
            hasMovementFilter ||
            hasDistanceFilter ||
            hasDamageTypeFilter ||
            hasTraitsFilter ||
            hasAllianceFilter ||
            hasMinHitsFilter ||
            hasMaxHitsFilter ||
            hasAttackTypeFilter
        );
    }, [damageTypesFilter, traitsFilter, allianceFilter, minHitsFilter, maxHitsFilter]);

    const filtersCount = useMemo(() => {
        const hasDamageTypeFilter = damageTypesFilter.length > 0;
        const hasTraitsFilter = traitsFilter.length > 0;
        const hasAllianceFilter = allianceFilter.length > 0;
        const hasMinHitsFilter = !!minHitsFilter && minHitsFilter > 0;
        const hasMaxHitsFilter = !!maxHitsFilter && maxHitsFilter > 0;
        const hasMovementFilter = !!movementFilter && movementFilter > 0;
        const hasDistanceFilter = !!distanceFilter && distanceFilter > 0;
        const hasAttackTypeFilter = !!attackTypeFilter;
        return (
            +hasMovementFilter +
            +hasDistanceFilter +
            +hasDamageTypeFilter +
            +hasTraitsFilter +
            +hasAllianceFilter +
            +hasMinHitsFilter +
            +hasMaxHitsFilter +
            +hasAttackTypeFilter
        );
    }, [damageTypesFilter, traitsFilter, allianceFilter, minHitsFilter, maxHitsFilter]);

    const doesExternalFilterPass = useCallback(
        (node: IRowNode<ICharacter2>) => {
            const doesDamageTypeFilterPass = () => {
                if (!damageTypesFilter.length) {
                    return true;
                }
                return damageTypesFilter.every(type => node.data?.damageTypes.all.includes(type));
            };

            const doesTraitsFilterPass = () => {
                if (!traitsFilter.length) {
                    return true;
                }
                return traitsFilter.every(type => {
                    if (type !== Trait.Mechanical) {
                        return node.data?.traits.includes(type);
                    } else {
                        return (
                            node.data?.traits.includes(Trait.Mechanical) ||
                            node.data?.traits.includes(Trait.LivingMetal)
                        );
                    }
                });
            };

            const doesAllianceFilterPass = () => {
                if (!allianceFilter.length) {
                    return true;
                }
                return allianceFilter.some(alliance => node.data?.alliance.includes(alliance));
            };

            const doesMinHitsFilterPass = () => {
                if (!minHitsFilter) {
                    return true;
                }
                const hits = node.data?.rangeHits ?? node.data?.meleeHits ?? 0;

                return hits >= minHitsFilter;
            };

            const doesMaxHitsFilterPass = () => {
                if (!maxHitsFilter) {
                    return true;
                }
                const hits = node.data?.rangeHits ?? node.data?.meleeHits ?? 0;

                return hits <= maxHitsFilter;
            };
            const doesMovementFilterPass = () => {
                if (!movementFilter) {
                    return true;
                }
                return node.data?.movement === movementFilter;
            };

            const doesDistanceFilterPass = () => {
                if (!distanceFilter) {
                    return true;
                }
                return node.data?.rangeDistance === distanceFilter;
            };

            const doesAttackTypeFilterPass = () => {
                switch (attackTypeFilter) {
                    case 'melee': {
                        return !node.data?.rangeHits;
                    }
                    case 'range': {
                        return !!node.data?.rangeHits;
                    }
                    default: {
                        return true;
                    }
                }
            };

            if (node.data) {
                return (
                    doesDamageTypeFilterPass() &&
                    doesTraitsFilterPass() &&
                    doesAllianceFilterPass() &&
                    doesMinHitsFilterPass() &&
                    doesMaxHitsFilterPass() &&
                    doesAttackTypeFilterPass() &&
                    doesMovementFilterPass() &&
                    doesDistanceFilterPass()
                );
            }
            return true;
        },
        [
            damageTypesFilter,
            traitsFilter,
            allianceFilter,
            minHitsFilter,
            maxHitsFilter,
            attackTypeFilter,
            movementFilter,
            distanceFilter,
        ]
    );

    const refreshRowNumberColumn = useCallback(() => {
        const columns = [gridRef.current?.api.getColumn('rowNumber') ?? ''];
        gridRef.current?.api.refreshCells({ columns });

        const displayedRowCount = gridRef.current?.api.getDisplayedRowCount();
        setRowCount(displayedRowCount ?? 0);
    }, []);

    const resetFilters = () => {
        setNameFilter('');
        allianceFilterChanged([]);
        damageTypeFilterChanged([]);
        traitsFilterChanged([]);
        minHitsFilterChange({ target: { value: '' } } as any);
        maxHitsFilterChange({ target: { value: '' } } as any);
        movementFilterChange({ target: { value: '' } } as any);
        distanceFilterChange({ target: { value: '' } } as any);
        attackTypeFilterChange({ target: { value: '' } } as any);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    };

    return (
        <div>
            <div className="flex-box gap20 wrap">
                <FormControlLabel
                    label="Only unlocked"
                    control={
                        <Switch
                            checked={onlyUnlocked}
                            onChange={event => setOnlyUnlocked(event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    }
                />
                <TextField
                    style={{ minWidth: 140 }}
                    label="Quick Filter"
                    variant="outlined"
                    onChange={onFilterTextBoxChanged}
                />
                <div className="flex-box gap10">
                    {filtersCount > 0 ? (
                        <>
                            <Badge badgeContent={filtersCount} color="warning">
                                <IconButton onClick={() => setShowFilters(value => !value)}>
                                    <FilterAltIcon />
                                </IconButton>
                            </Badge>
                            <Button color="error" onClick={resetFilters}>
                                Clear Filters
                            </Button>
                        </>
                    ) : (
                        <Button variant="outlined" onClick={() => setShowFilters(value => !value)}>
                            Filter <FilterAltOutlinedIcon />
                        </Button>
                    )}
                    <span>
                        ({rowCount} of {rows.length})
                    </span>
                </div>
            </div>
            <br />
            {showFilters && (
                <>
                    <div className="flex-box gap10 wrap">
                        <FormControl style={{ minWidth: '110px' }}>
                            <InputLabel>Min Hits</InputLabel>
                            <Select<number> label="Min Hits" value={minHitsFilter} onChange={minHitsFilterChange}>
                                <MenuItem value="">
                                    <span>Any</span>
                                </MenuItem>
                                {hitsOptions.map(hit => (
                                    <MenuItem key={hit} value={hit}>
                                        <span>{hit}</span>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl style={{ minWidth: '110px' }}>
                            <InputLabel>Max Hits</InputLabel>
                            <Select<number> label="Max Hits" value={maxHitsFilter} onChange={maxHitsFilterChange}>
                                <MenuItem value="">
                                    <span>Any</span>
                                </MenuItem>
                                {hitsOptions.map(hit => (
                                    <MenuItem key={hit} value={hit}>
                                        <span>{hit}</span>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl style={{ minWidth: '130px' }}>
                            <InputLabel>Attack Type</InputLabel>
                            <Select<string>
                                label="Attack Type"
                                value={attackTypeFilter}
                                onChange={attackTypeFilterChange}>
                                <MenuItem value="">
                                    <span>Any</span>
                                </MenuItem>
                                <MenuItem value="melee">
                                    <span>Melee Only</span>
                                </MenuItem>
                                <MenuItem value="range">
                                    <span>Range Only</span>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl style={{ minWidth: '120px' }}>
                            <InputLabel>Movement</InputLabel>
                            <Select<number> label="Movement" value={movementFilter} onChange={movementFilterChange}>
                                <MenuItem value="">
                                    <span>Any</span>
                                </MenuItem>
                                {movementOptions.map(hit => (
                                    <MenuItem key={hit} value={hit}>
                                        <span>{hit}</span>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl style={{ minWidth: '110px' }}>
                            <InputLabel>Distance</InputLabel>
                            <Select<number> label="Distance" value={distanceFilter} onChange={distanceFilterChange}>
                                <MenuItem value="">
                                    <span>Any</span>
                                </MenuItem>
                                {distanceOptions.map(hit => (
                                    <MenuItem key={hit} value={hit}>
                                        <span>{hit}</span>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <MultipleSelectCheckmarks
                            maxWidth={250}
                            groupByFirstLetter
                            placeholder="Damage Types"
                            selectedValues={damageTypesFilter}
                            values={damageTypesOptions}
                            selectionChanges={damageTypeFilterChanged}
                        />
                        <MultipleSelectCheckmarks
                            maxWidth={250}
                            groupByFirstLetter
                            placeholder="Traits"
                            selectedValues={traitsFilter}
                            values={traitsOptions}
                            selectionChanges={traitsFilterChanged}
                        />
                        <MultipleSelectCheckmarks
                            maxWidth={250}
                            placeholder="Alliance"
                            selectedValues={allianceFilter}
                            values={Object.values(Alliance)}
                            selectionChanges={allianceFilterChanged}
                        />
                    </div>
                    <br />
                </>
            )}

            <div className="flex gap-[3px] justify-left">
                <div style={{ width: 200 }}>
                    <RaritySelect
                        label={'Target Rarity'}
                        rarityValues={getEnumValues(Rarity)}
                        value={targetRarity}
                        valueChanges={value => onTargetRarityChanged(value)}
                    />
                </div>
                <div style={{ width: 200 }}>
                    <StarsSelect
                        label={'Target Stars'}
                        starsValues={starValues}
                        value={targetStars}
                        valueChanges={value => onTargetStarsChanged(value)}
                    />
                </div>
                <div style={{ width: 200 }}>
                    <RankSelect
                        label={'Target Rank'}
                        rankValues={rankValues}
                        value={targetRank}
                        valueChanges={value => onTargetRankChanged(value)}
                    />
                </div>
            </div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 180px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
                    suppressCellFocus={true}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    rowData={rows}
                    onSortChanged={refreshRowNumberColumn}
                    onFilterChanged={refreshRowNumberColumn}
                    isExternalFilterPresent={isExternalFilterPresent}
                    doesExternalFilterPass={doesExternalFilterPass}></AgGridReact>
            </div>
        </div>
    );
};
