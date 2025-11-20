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
import { ChangeEvent, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from 'src/reducers/store.provider';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Rarity, Alliance, DamageType, Trait, Rank, getTraitStringFromLabel } from '@/fsd/5-shared/model';
import { MultipleSelectCheckmarks, RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';

import { CharactersService, ICharacter2, RankSelect } from '@/fsd/4-entities/character';

import { useCharacters } from './characters-column-defs';

export const LearnCharacters = () => {
    const gridRef = useRef<AgGridReact<ICharacter2>>(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

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
        name: string;
        minHits: number | '';
        maxHits: number | '';
        attackType: string;
        movement: number | '';
        distance: number | '';
        damageTypes: DamageType[];
        traits: string[];
        alliance: string[];
    };

    const [filter, setFilter] = useState<Filter>({
        name: '',
        minHits: '',
        maxHits: '',
        attackType: '',
        movement: '',
        distance: '',
        damageTypes: [],
        traits: [],
        alliance: [],
    });

    useEffect(() => {
        const damageTypes = searchParams.getAll('damageTypes'); // supports multiple ?damageTypes=... values
        const name = searchParams.get('name');
        const minHits = searchParams.get('minHits');
        const maxHits = searchParams.get('maxHits');
        const attackType = searchParams.get('attackType');
        const movement = searchParams.get('movement');
        const distance = searchParams.get('distance');
        const traits = searchParams.getAll('trait');
        const alliance = searchParams.getAll('alliance');
        const newFilter: Filter = {
            name: name ?? '',
            minHits: minHits ? Number(minHits) : '',
            maxHits: maxHits ? Number(maxHits) : '',
            attackType: attackType ?? '',
            movement: movement ? Number(movement) : '',
            distance: distance ? Number(distance) : '',
            damageTypes: damageTypes.length > 0 ? damageTypes.map(d => DamageType[d as keyof typeof DamageType]) : [],
            traits: traits,
            alliance: alliance,
        };
        setFilter(newFilter);
        if (Object.values(newFilter).some(v => v !== '')) setShowFilters(true);
    }, []);

    const handleFilterChange = (name: keyof Filter, value: string | boolean | number | string[]) => {
        setFilter(prev => ({ ...prev, [name]: value }));
        const params = new URLSearchParams(searchParams);
        if (Array.isArray(value)) {
            params.delete(name);
            value.forEach(v => params.append(name, String(v)));
        } else if (value === '' || value === false) {
            params.delete(name);
        } else {
            params.set(name, String(value));
        }
        navigate({ search: params.toString() }, { replace: true });
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
                    (c.name.toLowerCase().includes(filter.name.toLowerCase()) ||
                        c.shortName.toLowerCase().includes(filter.name.toLowerCase())) &&
                    (!onlyUnlocked || c.rank > Rank.Locked)
                );
            }),
        [filter, onlyUnlocked, resolvedCharacters]
    );

    const isExternalFilterPresent = useCallback(() => {
        const hasDamageTypeFilter = filter.damageTypes.length > 0;
        const hasTraitsFilter = filter.traits.length > 0;
        const hasAllianceFilter = filter.alliance.length > 0;
        const hasMinHitsFilter = !!filter.minHits && filter.minHits > 0;
        const hasMaxHitsFilter = !!filter.maxHits && filter.maxHits > 0;
        const hasMovementFilter = !!filter.movement && filter.movement > 0;
        const hasDistanceFilter = !!filter.distance && filter.distance > 0;
        const hasAttackTypeFilter = !!filter.attackType;
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
        const hasNameFilter = !!filter.name && filter.name.length > 0;
        const hasDamageTypeFilter = filter.damageTypes.length > 0;
        const hasTraitsFilter = filter.traits.length > 0;
        const hasAllianceFilter = filter.alliance.length > 0;
        const hasMinHitsFilter = !!filter.minHits && filter.minHits > 0;
        const hasMaxHitsFilter = !!filter.maxHits && filter.maxHits > 0;
        const hasMovementFilter = !!filter.movement && filter.movement > 0;
        const hasDistanceFilter = !!filter.distance && filter.distance > 0;
        const hasAttackTypeFilter = !!filter.attackType;
        return (
            +hasNameFilter +
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
                if (!filter.damageTypes.length) {
                    return true;
                }
                return filter.damageTypes.every(type => node.data?.damageTypes.all.includes(type));
            };

            const doesTraitsFilterPass = () => {
                if (!filter.traits.length) {
                    return true;
                }

                const nodeTraits = (node.data?.traits ?? []) as unknown as string[]; // stored as enum keys
                return filter.traits.every(label => {
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
                if (!filter.alliance.length) {
                    return true;
                }
                return filter.alliance.some(alliance => node.data?.alliance.includes(alliance));
            };

            const doesMinHitsFilterPass = () => {
                if (!filter.minHits) {
                    return true;
                }
                const hits = node.data?.rangeHits ?? node.data?.meleeHits ?? 0;

                return hits >= filter.minHits;
            };

            const doesMaxHitsFilterPass = () => {
                if (!filter.maxHits) {
                    return true;
                }
                const hits = node.data?.rangeHits ?? node.data?.meleeHits ?? 0;

                return hits <= filter.maxHits;
            };
            const doesMovementFilterPass = () => {
                if (!filter.movement) {
                    return true;
                }
                return node.data?.movement === filter.movement;
            };

            const doesDistanceFilterPass = () => {
                if (!filter.distance) {
                    return true;
                }
                return node.data?.rangeDistance === filter.distance;
            };

            const doesAttackTypeFilterPass = () => {
                switch (filter.attackType) {
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
            name: '',
            minHits: '',
            maxHits: '',
            attackType: '',
            movement: '',
            distance: '',
            damageTypes: [],
            traits: [],
            alliance: [],
        });
        const params = new URLSearchParams(searchParams);
        params.delete('minHits');
        params.delete('maxHits');
        params.delete('attackType');
        params.delete('movement');
        params.delete('distance');
        params.delete('damageTypes');
        params.delete('trait');
        params.delete('alliance');
        params.delete('name');
        navigate({ search: params.toString() }, { replace: true });
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
                    className="min-w-[140px]"
                    label="Quick Filter"
                    variant="outlined"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => handleFilterChange('name', event.target.value)}
                    value={filter.name}
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
                        <FormControl className="min-w-[110px]">
                            <InputLabel>Min Hits</InputLabel>
                            <Select<number>
                                label="Min Hits"
                                value={filter.minHits}
                                onChange={(value: SelectChangeEvent<number>) =>
                                    handleFilterChange(
                                        'minHits',
                                        value.target.value === '' ? '' : Number(value.target.value)
                                    )
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

                        <FormControl className="min-w-[110px]">
                            <InputLabel>Max Hits</InputLabel>
                            <Select<number>
                                label="Max Hits"
                                value={filter.maxHits}
                                onChange={(value: SelectChangeEvent<number>) =>
                                    handleFilterChange(
                                        'maxHits',
                                        value.target.value === '' ? '' : Number(value.target.value)
                                    )
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

                        <FormControl className="min-w-[130px]">
                            <InputLabel>Attack Type</InputLabel>
                            <Select<string>
                                label="Attack Type"
                                value={filter.attackType}
                                onChange={(value: SelectChangeEvent<string>) =>
                                    handleFilterChange('attackType', value.target.value)
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

                        <FormControl className="min-w-[120px]">
                            <InputLabel>Movement</InputLabel>
                            <Select<number>
                                label="Movement"
                                value={filter.movement}
                                onChange={(value: SelectChangeEvent<number>) =>
                                    handleFilterChange(
                                        'movement',
                                        value.target.value === '' ? '' : Number(value.target.value)
                                    )
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

                        <FormControl className="min-w-[110px]">
                            <InputLabel>Distance</InputLabel>
                            <Select<number>
                                label="Distance"
                                value={filter.distance}
                                onChange={(value: SelectChangeEvent<number>) =>
                                    handleFilterChange(
                                        'distance',
                                        value.target.value === '' ? '' : Number(value.target.value)
                                    )
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
                            selectedValues={filter.damageTypes}
                            values={damageTypesOptions}
                            selectionChanges={(value: string[]) => handleFilterChange('damageTypes', value)}
                        />
                        <MultipleSelectCheckmarks
                            maxWidth={250}
                            groupByFirstLetter
                            placeholder="Traits"
                            selectedValues={filter.traits}
                            values={traitsOptions}
                            selectionChanges={(value: string[]) => handleFilterChange('traits', value)}
                        />
                        <MultipleSelectCheckmarks
                            maxWidth={250}
                            placeholder="Alliance"
                            selectedValues={filter.alliance}
                            values={Object.values(Alliance)}
                            selectionChanges={(value: string[]) => handleFilterChange('alliance', value)}
                        />
                    </div>
                    <br />
                </>
            )}

            <div className="flex gap-[3px] justify-left">
                <div className="w-50">
                    <RaritySelect
                        label={'Target Rarity'}
                        rarityValues={getEnumValues(Rarity)}
                        value={targetRarity}
                        valueChanges={value => onTargetRarityChanged(value)}
                    />
                </div>
                <div className="w-50">
                    <StarsSelect
                        label={'Target Stars'}
                        starsValues={starValues}
                        value={targetStars}
                        valueChanges={value => onTargetStarsChanged(value)}
                    />
                </div>
                <div className="w-50">
                    <RankSelect
                        label={'Target Rank'}
                        rankValues={rankValues}
                        value={targetRank}
                        valueChanges={value => onTargetRankChanged(value)}
                    />
                </div>
            </div>
            <div className="ag-theme-material w-full h-[calc(100vh-180px)]">
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
