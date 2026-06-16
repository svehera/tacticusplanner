import { ColDef, IRowNode, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { uniq } from 'lodash';
import { useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from 'src/reducers/store.provider';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Rarity, Alliance, DamageType, Trait, Rank, getTraitStringFromLabel } from '@/fsd/5-shared/model';
import { trackEvent } from '@/fsd/5-shared/monitoring';
import {
    Accordion,
    AccordionBody,
    AccordionHeader,
    Button,
    TextField,
    RankSelect,
    RaritySelect,
    Separator,
    StarsSelect,
} from '@/fsd/5-shared/ui';
import { MiscIcon, ComponentImage, TraitImage } from '@/fsd/5-shared/ui/icons';
import { Select, SelectMulti } from '@/fsd/5-shared/ui/selects';
import { Switch } from '@/fsd/5-shared/ui/switch';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';

import { useCharacters } from './characters-column-defs';

const renderAnyOption = (opt: string) => (opt === '' ? 'Any' : opt);
const attackTypeLabel = (opt: string) => (opt === '' ? 'Any' : opt === 'melee' ? 'Melee Only' : 'Range Only');

const getFilterStatus = (value: string | boolean | number | string[]) =>
    value === '' || value === false || (Array.isArray(value) && value.length === 0) ? 'cleared' : 'applied';

const trackCharactersFilter = (searchLocation: string, status?: string) => {
    trackEvent('search', {
        feature: 'learn_characters',
        action: 'filter',
        search_location: searchLocation,
        status,
    });
};

export const LearnCharacters = () => {
    const gridReference = useRef<AgGridReact<ICharacter2>>(null);
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
        const damageTypes = searchParams.getAll('damageTypes');
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
    }, []);

    const handleFilterChange = (name: keyof Filter, value: string | boolean | number | string[]) => {
        if (name !== 'name') {
            trackCharactersFilter('characters_advanced_filter', getFilterStatus(value));
        }

        setFilter(previous => ({ ...previous, [name]: value }));
        const params = new URLSearchParams(searchParams);
        if (Array.isArray(value)) {
            params.delete(name);
            for (const v of value) params.append(name, String(v));
        } else if (value === '' || value === false) {
            params.delete(name);
        } else {
            params.set(name, String(value));
        }
        navigate({ search: params.toString() }, { replace: true });
    };

    const defaultColDefinition: ColDef<ICharacter2> = {
        sortable: true,
        resizable: true,
        autoHeight: true,
        wrapText: true,
    };

    const { characters } = useContext(StoreContext);

    const resolvedCharacters = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);

    const hitsOptions = uniq(resolvedCharacters.flatMap(x => [x.meleeHits, x.rangeHits ?? 1]))
        .toSorted((a, b) => a - b)
        .map(x => x.toString());

    const movementOptions = uniq(resolvedCharacters.map(x => x.movement))
        .toSorted((a, b) => a - b)
        .map(x => x.toString());

    const distanceOptions = uniq(resolvedCharacters.filter(x => !!x.rangeDistance).map(x => x.rangeDistance ?? 1))
        .toSorted((a, b) => a - b)
        .map(x => x.toString());

    const damageTypesOptions = uniq(resolvedCharacters.flatMap(x => x.damageTypes.all)).map(x => x.toString());

    const traitsOptions = useMemo(() => {
        const activeTraits = new Set<string>();

        for (const c of resolvedCharacters) {
            if (c.traits) for (const t of c.traits) activeTraits.add(t);
        }

        return Object.values(Trait).filter(label => {
            const key = getTraitStringFromLabel(label);
            if (!key) return false;

            return activeTraits.has(key);
        });
    }, [resolvedCharacters]);

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
                if (filter.damageTypes.length === 0) {
                    return true;
                }
                return filter.damageTypes.every(type => node.data?.damageTypes.all.includes(type));
            };

            const doesTraitsFilterPass = () => {
                if (filter.traits.length === 0) {
                    return true;
                }

                const nodeTraits = (node.data?.traits ?? []) as unknown as string[];
                return filter.traits.every(label => {
                    const key = getTraitStringFromLabel(label);
                    if (!key) return false;
                    if (key !== 'Mechanical') return nodeTraits.includes(key);
                    const includesMech = nodeTraits.includes('Mechanical');
                    const includesLiving = nodeTraits.includes('LivingMetal');
                    const result = includesMech || includesLiving;

                    return result;
                });
            };

            const doesAllianceFilterPass = () => {
                if (filter.alliance.length === 0) {
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
        const columns = [gridReference.current?.api.getColumn('rowNumber') ?? ''];
        gridReference.current?.api.refreshCells({ columns });

        const displayedRowCount = gridReference.current?.api.getDisplayedRowCount();
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
        setOnlyUnlocked(false);
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

    const hasAnyFilter = filtersCount > 0 || onlyUnlocked;

    return (
        <div className="flex h-[calc(100vh-80px)] flex-col gap-4 py-4">
            {/* ── Filter panel ──────────────────────────────────────────────── */}
            <Accordion defaultExpanded>
                <AccordionHeader>
                    <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">Filters</span>
                    {filtersCount > 0 && (
                        <span className="rounded-full bg-(--primary) px-1.5 py-0.5 text-[10px] font-bold text-(--primary-fg)">
                            {filtersCount}
                        </span>
                    )}
                    <div
                        className="flex flex-1 items-center justify-end gap-3"
                        onClick={event_ => event_.stopPropagation()}>
                        <Button
                            appearance="plain"
                            intent="warning"
                            size="small"
                            isDisabled={!hasAnyFilter}
                            onPress={resetFilters}>
                            Clear
                        </Button>
                        <Switch
                            isSelected={onlyUnlocked}
                            onChange={value => {
                                trackCharactersFilter('characters_unlocked_toggle', value ? 'applied' : 'cleared');
                                setOnlyUnlocked(value);
                            }}>
                            Only unlocked
                        </Switch>
                    </div>
                    <span className="text-xs text-(--soft-fg)">
                        ({rowCount} of {rows.length})
                    </span>
                </AccordionHeader>

                <AccordionBody>
                    <div className="flex flex-wrap items-start gap-4">
                        <div className="min-w-[160px] flex-1">
                            <TextField
                                label="Quick Filter"
                                placeholder="Character name…"
                                value={filter.name}
                                onChange={value => handleFilterChange('name', value)}
                                onBlur={() => trackCharactersFilter('characters_quick_filter')}
                            />
                        </div>

                        <div className="min-w-[150px] flex-1">
                            <Select<string>
                                options={['', 'melee', 'range']}
                                value={filter.attackType}
                                onChange={v => handleFilterChange('attackType', v)}
                                label="Attack Type"
                                renderOption={attackTypeLabel}
                                renderValue={attackTypeLabel}
                            />
                        </div>

                        <div className="min-w-[120px] flex-1">
                            <Select<string>
                                options={['', ...hitsOptions]}
                                value={String(filter.minHits)}
                                onChange={v => handleFilterChange('minHits', v === '' ? '' : Number(v))}
                                label="Min Hits"
                                renderOption={renderAnyOption}
                                renderValue={renderAnyOption}
                            />
                        </div>

                        <div className="min-w-[120px] flex-1">
                            <Select<string>
                                options={['', ...hitsOptions]}
                                value={String(filter.maxHits)}
                                onChange={v => handleFilterChange('maxHits', v === '' ? '' : Number(v))}
                                label="Max Hits"
                                renderOption={renderAnyOption}
                                renderValue={renderAnyOption}
                            />
                        </div>

                        <div className="min-w-[120px] flex-1">
                            <Select<string>
                                options={['', ...movementOptions]}
                                value={String(filter.movement)}
                                onChange={v => handleFilterChange('movement', v === '' ? '' : Number(v))}
                                label="Movement"
                                renderOption={renderAnyOption}
                                renderValue={renderAnyOption}
                            />
                        </div>

                        <div className="min-w-[120px] flex-1">
                            <Select<string>
                                options={['', ...distanceOptions]}
                                value={String(filter.distance)}
                                onChange={v => handleFilterChange('distance', v === '' ? '' : Number(v))}
                                label="Distance"
                                renderOption={renderAnyOption}
                                renderValue={renderAnyOption}
                            />
                        </div>

                        <div className="min-w-[200px] flex-1">
                            <SelectMulti<string>
                                options={damageTypesOptions}
                                value={filter.damageTypes}
                                onChange={v => handleFilterChange('damageTypes', v)}
                                label="Damage Types"
                                placeholder="All damage types"
                                renderOption={dt => (
                                    <div className="flex items-center gap-2">
                                        <MiscIcon
                                            icon={`damage${dt.replaceAll(' ', '')}` as never}
                                            width={20}
                                            height={20}
                                        />
                                        <span>{dt}</span>
                                    </div>
                                )}
                                renderValue={selected => (
                                    <div className="flex flex-wrap items-center gap-1">
                                        {selected.map(dt => (
                                            <MiscIcon
                                                key={dt}
                                                icon={`damage${dt.replaceAll(' ', '')}` as never}
                                                width={18}
                                                height={18}
                                            />
                                        ))}
                                    </div>
                                )}
                            />
                        </div>

                        <div className="min-w-[200px] flex-1">
                            <SelectMulti<string>
                                options={traitsOptions}
                                value={filter.traits}
                                onChange={v => handleFilterChange('traits', v)}
                                label="Traits"
                                placeholder="All traits"
                                renderOption={t => (
                                    <div className="flex items-center gap-2">
                                        <TraitImage trait={t as Trait} width={20} height={20} />
                                        <span>{t}</span>
                                    </div>
                                )}
                                renderValue={selected => (
                                    <div className="flex flex-wrap items-center gap-1">
                                        {selected.map(t => (
                                            <TraitImage key={t} trait={t as Trait} width={18} height={18} />
                                        ))}
                                    </div>
                                )}
                            />
                        </div>

                        <div className="min-w-[200px] flex-1">
                            <SelectMulti<string>
                                options={Object.values(Alliance)}
                                value={filter.alliance}
                                onChange={v => handleFilterChange('alliance', v)}
                                label="Alliance"
                                placeholder="All alliances"
                                renderOption={a => (
                                    <div className="flex items-center gap-2">
                                        <ComponentImage alliance={a as Alliance} size="small" />
                                        <span>{a}</span>
                                    </div>
                                )}
                                renderValue={selected => (
                                    <div className="flex flex-wrap items-center gap-1">
                                        {selected.map(a => (
                                            <ComponentImage key={a} alliance={a as Alliance} size="small" />
                                        ))}
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    {/* Target stats */}
                    <Separator className="my-4">Target Stats</Separator>
                    <div className="flex flex-wrap items-start gap-4">
                        <div className="min-w-[160px] flex-1">
                            <RaritySelect
                                label="Target Rarity"
                                rarityValues={getEnumValues(Rarity)}
                                value={targetRarity}
                                valueChanges={value => onTargetRarityChanged(value)}
                            />
                        </div>
                        <div className="min-w-[160px] flex-1">
                            <StarsSelect
                                label="Target Stars"
                                starsValues={starValues}
                                value={targetStars}
                                valueChanges={value => onTargetStarsChanged(value)}
                            />
                        </div>
                        <div className="min-w-[160px] flex-1">
                            <RankSelect
                                label="Target Rank"
                                rankValues={rankValues}
                                value={targetRank}
                                valueChanges={value => onTargetRankChanged(value)}
                            />
                        </div>
                    </div>
                </AccordionBody>
            </Accordion>

            {/* ── Grid ──────────────────────────────────────────────────────── */}
            <div className="ag-theme-material density-compact min-h-0 flex-1">
                <AgGridReact
                    ref={gridReference}
                    modules={[AllCommunityModule]}
                    theme="legacy"
                    suppressCellFocus={true}
                    defaultColDef={defaultColDefinition}
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
