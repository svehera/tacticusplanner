import { orderBy } from 'lodash';

import { Rank, Rarity } from '@/fsd/5-shared/model';
import { EquipmentSelect, RaritySelect } from '@/fsd/5-shared/ui';
import { AbilityIcon } from '@/fsd/5-shared/ui/ability-icon';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2, RankSelect } from '@/fsd/4-entities/character';
import { EquipmentService } from '@/fsd/4-entities/equipment';
import { IUnit, UnitsAutocomplete } from '@/fsd/4-entities/unit';

import { Attacker } from './models';

interface Props {
    attacker: Attacker;
    availableUnits: IUnit[];
    onAttackerChange: (attacker: Attacker) => void;
}

export const AttackerSelect = ({ attacker, availableUnits, onAttackerChange }: Props) => {
    const handleUnitChange = (unit: IUnit | null) => {
        onAttackerChange({ ...attacker, unit: unit });
    };
    const equipType = [
        attacker.unit ? (attacker.unit as ICharacter2).equipment1 : 'I_Crit',
        attacker.unit ? (attacker.unit as ICharacter2).equipment2 : 'I_Defensive',
        attacker.unit ? (attacker.unit as ICharacter2).equipment3 : 'I_Booster_Crit',
    ];

    const computeAvailableEquipment = (type: string) => {
        if (!attacker.unit) return [];
        return orderBy(
            EquipmentService.equipmentData.filter(
                equipment =>
                    equipment.type === type &&
                    equipment.allowedUnits.includes(attacker.unit!.snowprintId!) &&
                    equipment.rarity <= attacker.rarity
            ),
            ['rarity', 'name']
        );
    };

    const availableEquip = [
        computeAvailableEquipment(equipType[0]),
        computeAvailableEquipment(equipType[1]),
        computeAvailableEquipment(equipType[2]),
    ];

    const MAX_EQUIPMENT_LEVEL: Record<Rarity, number> = {
        [Rarity.Common]: 3,
        [Rarity.Uncommon]: 5,
        [Rarity.Rare]: 7,
        [Rarity.Epic]: 9,
        [Rarity.Legendary]: 11,
        [Rarity.Mythic]: 10,
    };

    const MAX_ABILITY_LEVEL: Record<Rarity, number> = {
        [Rarity.Common]: 8,
        [Rarity.Uncommon]: 17,
        [Rarity.Rare]: 26,
        [Rarity.Epic]: 35,
        [Rarity.Legendary]: 50,
        [Rarity.Mythic]: 55,
    };

    const maxRank = (() => {
        switch (attacker.rarity) {
            case Rarity.Common:
                return Rank.Iron1;
            case Rarity.Uncommon:
                return Rank.Bronze1;
            case Rarity.Rare:
                return Rank.Silver1;
            case Rarity.Epic:
                return Rank.Gold1;
            case Rarity.Legendary:
                return Rank.Diamond3;
            default:
                return Rank.Adamantine1;
        }
    })();

    const char = attacker.unit as ICharacter2 | null;

    return (
        <div className="flex flex-wrap items-start gap-8 rounded-2xl border border-gray-800 bg-[#111827] p-6 shadow-lg">
            {/* COLUMN 1: IDENTITY */}
            <div className="flex w-[220px] flex-col gap-4">
                <h3 className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">Character</h3>
                <UnitsAutocomplete
                    unit={attacker.unit}
                    options={availableUnits}
                    onUnitChange={handleUnitChange}
                    className="rounded-lg bg-gray-900"
                />
                <div className="mt-2 flex justify-center rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-4">
                    {char && <UnitShardIcon icon={char.roundIcon} name={char.name} height={80} width={80} />}
                </div>
            </div>

            {/* COLUMN 2: PROGRESSION */}
            <div className="flex w-[200px] flex-col gap-4">
                <h3 className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">Progression</h3>
                <RaritySelect
                    label="Rarity"
                    rarityValues={[
                        Rarity.Common,
                        Rarity.Uncommon,
                        Rarity.Rare,
                        Rarity.Epic,
                        Rarity.Legendary,
                        Rarity.Mythic,
                    ]}
                    value={attacker.rarity}
                    valueChanges={rarity => onAttackerChange({ ...attacker, rarity })}
                />
                <RankSelect
                    label="Rank"
                    rankValues={Object.values(Rank)
                        .filter(r => typeof r === 'number')
                        .filter(r => r <= maxRank)}
                    value={attacker.rank}
                    valueChanges={rank => onAttackerChange({ ...attacker, rank })}
                />
            </div>

            {/* COLUMN 3: EQUIPMENT & ABILITIES */}
            <div className="flex min-w-[280px] flex-col gap-4">
                <h3 className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">Loadout</h3>

                {/* Equipment Rows */}
                <div className="space-y-3">
                    {[0, 1, 2].map(index => (
                        <div
                            key={index}
                            className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/30 p-2">
                            <div className="flex-1">
                                <EquipmentSelect
                                    label={`Slot ${index + 1}`}
                                    equipmentType={equipType[index]}
                                    availableValues={availableEquip[index]}
                                    value={attacker.equipment[index] ?? null}
                                    valueChanges={equipment =>
                                        onAttackerChange({
                                            ...attacker,
                                            equipment: [
                                                ...attacker.equipment.slice(0, index),
                                                equipment,
                                                ...attacker.equipment.slice(index + 1),
                                            ],
                                        })
                                    }
                                />
                            </div>
                            <input
                                type="number"
                                className="w-14 rounded border border-gray-700 bg-gray-800 p-1 text-center text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                value={attacker.equipmentLevels[index]}
                                onChange={e => {
                                    const newLevels = [...attacker.equipmentLevels];
                                    const value = parseInt(e.target.value, 10);
                                    const maxLevel = attacker.equipment[index]
                                        ? MAX_EQUIPMENT_LEVEL[attacker.equipment[index]!.rarity]
                                        : 3;
                                    newLevels[index] = Math.min(Math.max(value, 1), maxLevel);
                                    onAttackerChange({ ...attacker, equipmentLevels: newLevels });
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Ability Rows */}
                {char && (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-gray-800/40 p-2">
                            <AbilityIcon icon={char.activeAbilityNames[0]} width={32} height={32} />
                            <input
                                type="number"
                                className="w-full bg-transparent text-sm outline-none"
                                value={attacker.activeLevel}
                                onChange={e => {
                                    const newLevel = Math.min(
                                        Math.max(parseInt(e.target.value, 10), 1),
                                        MAX_ABILITY_LEVEL[attacker.rarity]
                                    );
                                    onAttackerChange({ ...attacker, activeLevel: newLevel });
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-gray-800/40 p-2">
                            <AbilityIcon icon={char.passiveAbilityNames[0]} width={32} height={32} />
                            <input
                                type="number"
                                className="w-full bg-transparent text-sm outline-none"
                                value={attacker.passiveLevel}
                                onChange={e => {
                                    const newLevel = Math.min(
                                        Math.max(parseInt(e.target.value, 10), 1),
                                        MAX_ABILITY_LEVEL[attacker.rarity]
                                    );
                                    onAttackerChange({ ...attacker, passiveLevel: newLevel });
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
