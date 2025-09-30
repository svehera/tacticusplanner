import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
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
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import { ColDef, IRowNode, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { uniq } from 'lodash';
import React, { ChangeEvent, useCallback, useContext, useMemo, useRef, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from 'src/reducers/store.provider';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Rarity, Alliance, DamageType, Trait, Rank, getTraitStringFromLabel } from '@/fsd/5-shared/model';
import { MultipleSelectCheckmarks, RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';

import { CharactersService, ICharacter2, RankSelect } from '@/fsd/4-entities/character';

import { useCharacters } from './characters-column-defs';

export const LearnCharacters = () => {
    const gridRef = useRef<AgGridReact<ICharacter2>>(null);

    const {
        columnDefs,
        targetRarity,
        targetStars,
        targetRank,
        rankValues,
        starValues,
        onTargetRarityChanged,
        onTargetStarsChanged,
        onTargetRankChanged,
    } = useCharacters();

    const [onlyUnlocked, setOnlyUnlocked] = useState<boolean>(false);
    const [rowCount, setRowCount] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    type Filter = {
        nameFilter: string;
        onlyUnlocked: boolean;
        minHitsFilter: number | '';
        maxHitsFilter: number | '';
        attackTypeFilter: string;
        movementFilter: number | '';
        distanceFilter: number | '';
        damageTypesFilter: DamageType[];
        traitsFilter: string[];
        allianceFilter: string[];
    };

    const [filter, setFilter] = useState<Filter>({
        nameFilter: '',
        onlyUnlocked: false,
        minHitsFilter: '',
        maxHitsFilter: '',
        attackTypeFilter: '',
        movementFilter: '',
        distanceFilter: '',
        damageTypesFilter: [],
        traitsFilter: [],
        allianceFilter: [],
    });

    const handleFilterChange = (name: string, value: string | boolean | number | string[]) => {
        console.log('name: ', name);
        console.log('value: ', value);
        setFilter({ ...filter, [name]: value });
    };

    const defaultColDef: ColDef<ICharacter2> = {
        sortable: true,
        resizable: true,
        autoHeight: true,
        wrapText: true,
    };

    const { characters } = useContext(StoreContext);

    const resolvedCharacters = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);

    const hitsOptions = uniq(resolvedCharacters.flatMap(x => [x.meleeHits, x.rangeHits ?? 1]))
        .sort((a, b) => a - b)
        .map(x => x.toString());

    const movementOptions = uniq(resolvedCharacters.map(x => x.movement))
        .sort((a, b) => a - b)
        .map(x => x.toString());

    const distanceOptions = uniq(resolvedCharacters.filter(x => !!x.rangeDistance).map(x => x.rangeDistance ?? 1))
        .sort((a, b) => a - b)
        .map(x => x.toString());

    const damageTypesOptions = uniq(resolvedCharacters.flatMap(x => x.damageTypes.all)).map(x => x.toString());
    const traitsOptions = Object.values(Trait);

    const rows = useMemo(
        () =>
            resolvedCharacters.filter(c => {
                return (
                    (c.name.toLowerCase().includes(filter.nameFilter.toLowerCase()) ||
                        c.shortName.toLowerCase().includes(filter.nameFilter.toLowerCase())) &&
                    (!onlyUnlocked || c.rank > Rank.Locked)
                );
            }),
        [filter, onlyUnlocked]
    );

    const isExternalFilterPresent = useCallback(() => {
        const hasDamageTypeFilter = filter.damageTypesFilter.length > 0;
        const hasTraitsFilter = filter.traitsFilter.length > 0;
        const hasAllianceFilter = filter.allianceFilter.length > 0;
        const hasMinHitsFilter = !!filter.minHitsFilter && filter.minHitsFilter > 0;
        const hasMaxHitsFilter = !!filter.maxHitsFilter && filter.maxHitsFilter > 0;
        const hasMovementFilter = !!filter.movementFilter && filter.movementFilter > 0;
        const hasDistanceFilter = !!filter.distanceFilter && filter.distanceFilter > 0;
        const hasAttackTypeFilter = !!filter.attackTypeFilter;
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
    }, [filter]);

    const filtersCount = useMemo(() => {
        const hasDamageTypeFilter = filter.damageTypesFilter.length > 0;
        const hasTraitsFilter = filter.traitsFilter.length > 0;
        const hasAllianceFilter = filter.allianceFilter.length > 0;
        const hasMinHitsFilter = !!filter.minHitsFilter && filter.minHitsFilter > 0;
        const hasMaxHitsFilter = !!filter.maxHitsFilter && filter.maxHitsFilter > 0;
        const hasMovementFilter = !!filter.movementFilter && filter.movementFilter > 0;
        const hasDistanceFilter = !!filter.distanceFilter && filter.distanceFilter > 0;
        const hasAttackTypeFilter = !!filter.attackTypeFilter;
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
    }, [filter]);

    const doesExternalFilterPass = useCallback(
        (node: IRowNode<ICharacter2>) => {
            const doesDamageTypeFilterPass = () => {
                if (!filter.damageTypesFilter.length) {
                    return true;
                }
                return filter.damageTypesFilter.every(type => node.data?.damageTypes.all.includes(type));
            };

            const doesTraitsFilterPass = () => {
                if (!filter.traitsFilter.length) {
                    return true;
                }

                const nodeTraits = (node.data?.traits ?? []) as unknown as string[]; // stored as enum keys
                return filter.traitsFilter.every(label => {
                    const key = getTraitStringFromLabel(label);
                    if (!key) return false;
                    if (key !== 'Mechanical') {
                        const includes = nodeTraits.includes(key);
                        return includes;
                    } else {
                        const includesMech = nodeTraits.includes('Mechanical');
                        const includesLiving = nodeTraits.includes('LivingMetal');
                        const result = includesMech || includesLiving;

                        return result;
                    }
                });
            };

            const doesAllianceFilterPass = () => {
                if (!filter.allianceFilter.length) {
                    return true;
                }
                return filter.allianceFilter.some(alliance => node.data?.alliance.includes(alliance));
            };

            const doesMinHitsFilterPass = () => {
                if (!filter.minHitsFilter) {
                    return true;
                }
                const hits = node.data?.rangeHits ?? node.data?.meleeHits ?? 0;

                return hits >= filter.minHitsFilter;
            };

            const doesMaxHitsFilterPass = () => {
                if (!filter.maxHitsFilter) {
                    return true;
                }
                const hits = node.data?.rangeHits ?? node.data?.meleeHits ?? 0;

                return hits <= filter.maxHitsFilter;
            };
            const doesMovementFilterPass = () => {
                if (!filter.movementFilter) {
                    return true;
                }
                return node.data?.movement === filter.movementFilter;
            };

            const doesDistanceFilterPass = () => {
                if (!filter.distanceFilter) {
                    return true;
                }
                return node.data?.rangeDistance === filter.distanceFilter;
            };

            const doesAttackTypeFilterPass = () => {
                switch (filter.attackTypeFilter) {
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
        [filter]
    );

    const refreshRowNumberColumn = useCallback(() => {
        const columns = [gridRef.current?.api.getColumn('rowNumber') ?? ''];
        gridRef.current?.api.refreshCells({ columns });

        const displayedRowCount = gridRef.current?.api.getDisplayedRowCount();
        setRowCount(displayedRowCount ?? 0);
    }, []);

    const resetFilters = () => {
        setFilter({
            nameFilter: '',
            onlyUnlocked: false,
            minHitsFilter: '',
            maxHitsFilter: '',
            attackTypeFilter: '',
            movementFilter: '',
            distanceFilter: '',
            damageTypesFilter: [],
            traitsFilter: [],
            allianceFilter: [],
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
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange('nameFilter', event.target.value)
                    }
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
                            <Select<number>
                                label="Min Hits"
                                value={filter.minHitsFilter}
                                onChange={(value: SelectChangeEvent<number>) =>
                                    handleFilterChange('minHitsFilter', value.target.value)
                                }>
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
                            <Select<number>
                                label="Max Hits"
                                value={filter.maxHitsFilter}
                                onChange={(value: SelectChangeEvent<number>) =>
                                    handleFilterChange('maxHitsFilter', value.target.value)
                                }>
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
                                value={filter.attackTypeFilter}
                                onChange={(value: SelectChangeEvent<string>) =>
                                    handleFilterChange('attackTypeFilter', value.target.value)
                                }>
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
                            <Select<number>
                                label="Movement"
                                value={filter.movementFilter}
                                onChange={(value: SelectChangeEvent<number>) =>
                                    handleFilterChange('movementFilter', value.target.value)
                                }>
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
                            <Select<number>
                                label="Distance"
                                value={filter.distanceFilter}
                                onChange={(value: SelectChangeEvent<number>) =>
                                    handleFilterChange('distanceFilter', value.target.value)
                                }>
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
                            selectedValues={filter.damageTypesFilter}
                            values={damageTypesOptions}
                            selectionChanges={(value: string[]) => handleFilterChange('damageTypesFilter', value)}
                        />
                        <MultipleSelectCheckmarks
                            maxWidth={250}
                            groupByFirstLetter
                            placeholder="Traits"
                            selectedValues={filter.traitsFilter}
                            values={traitsOptions}
                            selectionChanges={(value: string[]) => handleFilterChange('traitsFilter', value)}
                        />
                        <MultipleSelectCheckmarks
                            maxWidth={250}
                            placeholder="Alliance"
                            selectedValues={filter.allianceFilter}
                            values={Object.values(Alliance)}
                            selectionChanges={(value: string[]) => handleFilterChange('allianceFilter', value)}
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
                    doesExternalFilterPass={doesExternalFilterPass}
                />
            </div>
        </div>
    );
};
