/* eslint-disable import-x/no-internal-modules */
import { useContext, useMemo, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { FactionId, Rarity } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { FactionSelect, SelectMulti } from '@/fsd/5-shared/ui/selects';
import { Switch } from '@/fsd/5-shared/ui/switch';

import { ICharacter2, ICharacterData, CharactersService } from '@/fsd/4-entities/character';
import { IEquipment, EquipmentService, EQUIPMENT_TYPE_ORDER } from '@/fsd/4-entities/equipment';
import { newEquipmentData } from '@/fsd/4-entities/equipment/data';
import { IEquipmentStatic } from '@/fsd/4-entities/equipment/model';
import { EquipmentIcon } from '@/fsd/4-entities/equipment/ui';
import { FactionImage } from '@/fsd/4-entities/faction';
import { UnitsAutocomplete } from '@/fsd/4-entities/unit';

// ─── helpers ─────────────────────────────────────────────────────────────────

const TYPE_DISPLAY_NAMES: Record<string, string> = {
    I_Crit: 'Crit',
    R_Crit: 'Crit (Relic)',
    I_Block: 'Block',
    R_Block: 'Block (Relic)',
    I_Defensive: 'Defensive',
    R_Defensive: 'Defensive (Relic)',
    I_Booster_Block: 'Block Booster',
    R_Booster_Block: 'Block Booster (Relic)',
    I_Booster_Crit: 'Crit Booster',
    R_Booster_Crit: 'Crit Booster (Relic)',
};

const RARITY_ORDER = [Rarity.Mythic, Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon, Rarity.Common];

// ─── equipment row ────────────────────────────────────────────────────────────

const EquipmentRow = ({
    equipment,
    levelQuantities,
    equippedByLevel,
}: {
    equipment: IEquipment;
    levelQuantities: Record<number, number>;
    equippedByLevel: Record<number, ICharacterData[]>;
}) => {
    const staticData = (newEquipmentData as Record<string, IEquipmentStatic>)[equipment.id];
    const charactersBySnowprintId = CharactersService.charactersBySnowprintId;

    // Characters to display: only for unit-specific relics (allowedUnits in static data is non-empty)
    const specificCharacters = useMemo<ICharacterData[]>(() => {
        if (staticData.allowedUnits.length === 0) return [];
        return staticData.allowedUnits
            .map((id: string) => charactersBySnowprintId[id])
            .filter(Boolean) as ICharacterData[];
    }, [staticData.allowedUnits, charactersBySnowprintId]);

    // Combine inventory levels with equipped levels for the full list
    const allLevels = new Set([
        ...Object.keys(levelQuantities).map(Number),
        ...Object.keys(equippedByLevel).map(Number),
    ]);
    const ownedLevels = [...allLevels]
        .filter(level => (levelQuantities[level] ?? 0) > 0 || (equippedByLevel[level]?.length ?? 0) > 0)
        .toSorted((a, b) => a - b);

    return (
        <div className="rounded-lg border border-(--border) bg-(--overlay) px-4 py-3">
            {/* Icon + name + factions in one row — factions get full remaining width */}
            <div className="flex items-center gap-4">
                <div className="shrink-0">
                    <EquipmentIcon equipment={equipment} height={48} width={48} tooltip />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm font-semibold">{equipment.name}</span>
                    <div className="flex flex-wrap items-center gap-1">
                        {staticData.allowedFactions.length > 0 &&
                            staticData.allowedFactions.map((faction: string) => (
                                <FactionImage key={faction} faction={faction as FactionId} />
                            ))}
                        {specificCharacters.map(char => (
                            <span key={char.snowprintId}>
                                <span className="lg:hidden">
                                    <UnitShardIcon icon={char.roundIcon} name={char.name} height={24} width={24} />
                                </span>
                                <span className="hidden lg:inline">
                                    <UnitShardIcon icon={char.roundIcon} name={char.name} height={48} width={48} />
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Level counts on their own row, indented to align under the name */}
            {ownedLevels.length > 0 && (
                <div className="mt-2 flex flex-wrap items-start gap-2 pl-16">
                    {ownedLevels.map(level => {
                        const inInventory = levelQuantities[level] ?? 0;
                        const equippers = equippedByLevel[level] ?? [];
                        return (
                            <div
                                key={level}
                                className="flex flex-col items-center rounded border border-(--border) px-2 py-1 text-center">
                                <span className="text-xs text-(--soft-fg)">Lv {level}</span>
                                <span className="text-sm font-bold">×{inInventory}</span>
                                {equippers.length > 0 && (
                                    <div className="mt-1 flex flex-col items-center gap-0.5">
                                        <span className="text-xs text-(--soft-fg)">+{equippers.length} eq.</span>
                                        <div className="flex flex-wrap justify-center gap-0.5">
                                            {equippers.map((char, index) => (
                                                <span key={`${char.snowprintId}-${index}`}>
                                                    <span className="lg:hidden">
                                                        <UnitShardIcon
                                                            icon={char.roundIcon}
                                                            name={char.name}
                                                            height={20}
                                                            width={20}
                                                            tooltip={char.name}
                                                        />
                                                    </span>
                                                    <span className="hidden lg:inline">
                                                        <UnitShardIcon
                                                            icon={char.roundIcon}
                                                            name={char.name}
                                                            height={40}
                                                            width={40}
                                                            tooltip={char.name}
                                                        />
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── main page ────────────────────────────────────────────────────────────────

export const Equipment = () => {
    const { inventory, characters } = useContext(StoreContext);

    // ── filter state ──────────────────────────────────────────────────────────
    const [selectedRarities, setSelectedRarities] = useState<Rarity[]>([]);
    const [savedRarities, setSavedRarities] = useState<Rarity[]>([]);
    const [selectedFactions, setSelectedFactions] = useState<FactionId[]>([]);
    const [selectedCharacters, setSelectedCharacters] = useState<ICharacter2[]>([]);
    const [onlyRelics, setOnlyRelics] = useState(false);

    const handleOnlyRelicsChange = (checked: boolean) => {
        if (checked) {
            setSavedRarities(selectedRarities);
            setSelectedRarities([Rarity.Mythic]);
        } else {
            setSelectedRarities(savedRarities);
        }
        setOnlyRelics(checked);
    };

    // ── build equipped-on-character index ───────────────────────────────────
    // equippedIndex[itemId][level] = array of characters who have it equipped
    const equippedIndex = useMemo<Record<string, Record<number, ICharacter2[]>>>(() => {
        const index: Record<string, Record<number, ICharacter2[]>> = {};
        for (const char of characters) {
            for (const slot of char.equipment) {
                if (!slot.id) continue;
                if (!index[slot.id]) index[slot.id] = {};
                if (!index[slot.id][slot.level]) index[slot.id][slot.level] = [];
                index[slot.id][slot.level].push(char);
            }
        }
        return index;
    }, [characters]);

    // ── derive owned equipment (inventory + equipped) ─────────────────────────
    const ownedEquipment = useMemo<IEquipment[]>(() => {
        const ownedIds = new Set([
            ...Object.entries(inventory.items ?? {})
                .filter(([, levels]) => Object.values(levels).some((qty: number) => qty > 0))
                .map(([id]) => id),
            ...Object.keys(equippedIndex),
        ]);
        return EquipmentService.equipmentData.filter(eq => ownedIds.has(eq.id));
    }, [inventory.items, equippedIndex]);

    // ── available faction values for the filter ───────────────────────────────
    const availableFactions = useMemo<FactionId[]>(() => {
        const factionSet = new Set<FactionId>();
        for (const eq of ownedEquipment) {
            const staticData = (newEquipmentData as Record<string, IEquipmentStatic>)[eq.id];
            if (staticData.allowedFactions.length > 0) {
                for (const f of staticData.allowedFactions) factionSet.add(f as FactionId);
            } else {
                for (const unitId of eq.allowedUnits) {
                    const char = CharactersService.charactersBySnowprintId[unitId];
                    if (char) factionSet.add(char.faction);
                }
            }
        }
        return [...factionSet].toSorted();
    }, [ownedEquipment]);

    // ── filtered + grouped equipment ─────────────────────────────────────────
    const groupedEquipment = useMemo<Map<string, IEquipment[]>>(() => {
        let filtered = ownedEquipment;

        if (onlyRelics) {
            filtered = filtered.filter(eq => eq.isRelic);
        }

        if (selectedRarities.length > 0) {
            filtered = filtered.filter(eq => selectedRarities.includes(eq.rarity));
        }

        if (selectedFactions.length > 0) {
            filtered = filtered.filter(eq => {
                const staticData = (newEquipmentData as Record<string, IEquipmentStatic>)[eq.id];
                if (staticData.allowedFactions.length > 0) {
                    return selectedFactions.some(f => staticData.allowedFactions.includes(f));
                }
                return eq.allowedUnits.some(unitId => {
                    const char = CharactersService.charactersBySnowprintId[unitId];
                    return char && selectedFactions.includes(char.faction);
                });
            });
        }

        if (selectedCharacters.length > 0) {
            filtered = filtered.filter(eq => {
                const staticData = (newEquipmentData as Record<string, IEquipmentStatic>)[eq.id];
                return selectedCharacters.some(char => {
                    if (staticData.allowedUnits.length > 0) {
                        return staticData.allowedUnits.includes(char.snowprintId);
                    }
                    const charSlots = [char.equipment1, char.equipment2, char.equipment3];
                    return staticData.allowedFactions.includes(char.faction) && charSlots.includes(eq.type);
                });
            });
        }

        // Sort by type order then rarity descending
        filtered = filtered.toSorted(
            (a, b) => (EQUIPMENT_TYPE_ORDER[a.type] ?? 99) - (EQUIPMENT_TYPE_ORDER[b.type] ?? 99) || b.rarity - a.rarity
        );

        const map = new Map<string, IEquipment[]>();
        for (const eq of filtered) {
            const group = map.get(eq.type) ?? [];
            group.push(eq);
            map.set(eq.type, group);
        }
        return map;
    }, [ownedEquipment, selectedRarities, selectedFactions, selectedCharacters, onlyRelics]);

    const totalOwned = useMemo(() => {
        const fromInventory = Object.values(inventory.items ?? {}).reduce(
            (sum, levels) => sum + Object.values(levels).reduce((s: number, qty: number) => s + qty, 0),
            0
        );
        const fromEquipped = Object.values(equippedIndex ?? {}).reduce(
            (sum, levels) => sum + Object.values(levels).reduce((s, chars) => s + chars.length, 0),
            0
        );
        return fromInventory + fromEquipped;
    }, [inventory.items, equippedIndex]);

    return (
        <div className="space-y-8 py-6">
            <div>
                <h2>Equipment</h2>
                <p className="text-sm text-(--soft-fg)">{totalOwned} total pieces</p>
            </div>

            {onlyRelics && Date.now() < Date.UTC(2026, 4, 20, 23, 59, 59) && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-base font-semibold text-amber-400">
                    {'In-Game code, valid until May 20th: '}
                    <span className="font-mono tracking-wide">AHRIRELICWHEN</span>
                </div>
            )}

            {/* Filters */}
            <div className="rounded-xl border border-(--border) bg-(--overlay)">
                <div className="flex items-center gap-4 border-b border-(--border) px-4 py-2.5">
                    <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">Filters</span>
                    <div className="flex flex-1 items-center justify-end gap-3">
                        <Switch isSelected={onlyRelics} onChange={handleOnlyRelicsChange}>
                            Only Relics
                        </Switch>
                        <Button
                            appearance="plain"
                            intent="primary"
                            size="extra-small"
                            isDisabled={
                                selectedRarities.length === 0 &&
                                selectedFactions.length === 0 &&
                                selectedCharacters.length === 0 &&
                                !onlyRelics
                            }
                            onPress={() => {
                                setSelectedRarities([]);
                                setSavedRarities([]);
                                setSelectedFactions([]);
                                setSelectedCharacters([]);
                                setOnlyRelics(false);
                            }}>
                            Clear
                        </Button>
                    </div>
                </div>
                <div className="flex flex-wrap items-start gap-4 p-4">
                    {/* Rarity multi-select */}
                    <div className="min-w-[160px] flex-1">
                        <SelectMulti<Rarity>
                            options={RARITY_ORDER}
                            value={selectedRarities}
                            onChange={setSelectedRarities}
                            label="Rarity"
                            placeholder="All rarities"
                            disabled={onlyRelics}
                            renderOption={rarity => (
                                <div className="flex items-center gap-2">
                                    <RarityIcon rarity={rarity} />
                                    <span>{Rarity[rarity]}</span>
                                </div>
                            )}
                            renderValue={selected => (
                                <div className="flex flex-wrap items-center gap-1">
                                    {selected.map(r => (
                                        <RarityIcon key={r} rarity={r} />
                                    ))}
                                </div>
                            )}
                        />
                    </div>

                    {/* Faction multi-select */}
                    <div className="min-w-[180px] flex-1">
                        <FactionSelect
                            label="Faction"
                            factionValues={availableFactions}
                            value={selectedFactions}
                            valueChanges={setSelectedFactions}
                        />
                    </div>

                    {/* Character multi-select */}
                    <div className="min-w-[220px] flex-1">
                        <UnitsAutocomplete<ICharacter2>
                            unit={selectedCharacters}
                            options={characters}
                            multiple
                            label="Character"
                            onUnitsChange={setSelectedCharacters}
                        />
                    </div>
                </div>
            </div>

            {/* Results */}
            {groupedEquipment.size === 0 ? (
                <div className="rounded-xl border border-(--border) bg-(--overlay) p-8 text-center text-(--soft-fg)">
                    {ownedEquipment.length === 0
                        ? 'No equipment in your inventory yet.'
                        : 'No equipment matches the selected filters.'}
                </div>
            ) : (
                <div className="space-y-8">
                    {[...groupedEquipment.entries()].map(([type, items]) => (
                        <section key={type}>
                            <h3 className="mb-3">
                                {TYPE_DISPLAY_NAMES[type] ?? type}
                                <span className="ml-2 text-sm font-normal text-(--soft-fg)">
                                    ({items.length} {items.length === 1 ? 'item' : 'items'})
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                {items.map(eq => (
                                    <EquipmentRow
                                        key={eq.id}
                                        equipment={eq}
                                        levelQuantities={inventory.items?.[eq.id] ?? {}}
                                        equippedByLevel={equippedIndex?.[eq.id] ?? {}}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
};
