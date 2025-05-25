import React, { useContext, useEffect, useMemo, useState } from 'react';

import { rarityToMaxRank } from 'src/models/constants';
import { EquipmentType } from 'src/models/interfaces';
import { StoreContext } from 'src/reducers/store.provider';
import { FactionSelect } from 'src/routes/npcs/faction-select';
import { NpcPortrait } from 'src/routes/tables/npc-portrait';
import { StaticDataService } from 'src/services';
import { getEnumValues } from 'src/shared-logic/functions';

import { RarityStars, Rarity, Rank, Faction } from '@/fsd/5-shared/model';
import { RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { RankSelect } from '@/fsd/4-entities/character';

import { CharacterSelect } from './character-select';
import { DamageCalculatorService } from './damage-calculator-service';
import { DamageIcon } from './damage-icon';
import { EquipmentSelect } from './equipment-select';
import { IEquipmentSpec } from './versus-interfaces';

interface Props {
    onCharacterChange: (
        /** The ID of the character, or undefined if it's an NPC. */
        characterId: string | undefined,
        /** The name of the NPC, or undefined if it's a character. */
        npcName: string | undefined,
        faction: Faction,
        rank: Rank,
        rarity: Rarity,
        stars: RarityStars,
        equipment: IEquipmentSpec[]
    ) => void;
}

/** Display an entire selection, portrait, and stat profile for a character. */
export const FullCharacter: React.FC<Props> = ({ onCharacterChange }) => {
    const storeContext = useContext(StoreContext);

    const [faction, setFaction] = useState<Faction>(Faction.Ultramarines);
    const [character, setCharacter] = useState<string>('Varro Tigurius');
    const [rank, setRank] = useState<Rank>(Rank.Stone1);
    const [rarity, setRarity] = useState<Rarity>(Rarity.Common);
    const [stars, setStars] = useState<RarityStars>(RarityStars.None);
    const [canUseEquipment, setCanUseEquipment] = useState<boolean>(true);
    const [equipmentSlot1, setEquipmentSlot1] = useState<IEquipmentSpec>({ type: EquipmentType.Crit });
    const [equipmentSlot2, setEquipmentSlot2] = useState<IEquipmentSpec>({ type: EquipmentType.Defensive });
    const [equipmentSlot3, setEquipmentSlot3] = useState<IEquipmentSpec>({ type: EquipmentType.CritBooster });

    /** Maps rarity to the minimum number of stars to achieve that rarity. */
    const minStarsMap: Map<Rarity, RarityStars> = new Map([
        [Rarity.Common, RarityStars.None],
        [Rarity.Uncommon, RarityStars.TwoStars],
        [Rarity.Rare, RarityStars.FourStars],
        [Rarity.Epic, RarityStars.RedOneStar],
        [Rarity.Legendary, RarityStars.RedThreeStars],
    ]);

    const minRank = useMemo(() => {
        return Rank.Stone1;
    }, [rarity]);

    const maxRank = useMemo(() => {
        return rarityToMaxRank[rarity];
    }, [rarity]);

    const minStars = useMemo(() => {
        return minStarsMap.get(rarity) ?? RarityStars.None;
    }, [rarity]);

    const maxStars = useMemo(() => {
        return minStarsMap.get(rarity + 1) ?? RarityStars.BlueStar;
    }, [rarity]);

    const starValues = useMemo(
        () => getEnumValues(RarityStars).filter(x => x >= minStars && x <= maxStars),
        [minStars, maxStars]
    );
    const rankValues = useMemo(
        () => getEnumValues(Rank).filter(rank => rank >= minRank && rank <= maxRank),
        [minRank, maxRank]
    );

    const idsAndNames = useMemo(() => {
        const ret: string[] = [];
        StaticDataService.unitsData.forEach(unit => {
            if (unit.faction === faction) ret.push(unit.id);
        });
        StaticDataService.npcDataFull.forEach(npc => {
            if (npc.faction === faction) ret.push(npc.name);
        });
        return ret;
    }, [faction]);

    /** Adjusts stars and rank if necessary with a change to rarity. */
    const onRarityChanged = (newRarity: Rarity) => {
        if (newRarity < rarity) {
            setRarity(newRarity);
            setStars(minStarsMap.get(newRarity + 1) ?? RarityStars.BlueStar);
            if (rank > rarityToMaxRank[newRarity]) {
                setRank(rarityToMaxRank[newRarity]);
            }
        } else if (newRarity > rarity) {
            setRarity(newRarity);
            setStars(minStarsMap.get(newRarity) ?? RarityStars.None);
        }
    };

    /** Resets the character display to the first character in the faction. */
    const onFactionChanged = (newFaction: Faction) => {
        if (faction != newFaction) {
            setFaction(newFaction);
            const arr: string[] = [];
            StaticDataService.unitsData.forEach(unit => {
                if (unit.faction === newFaction) arr.push(unit.id);
            });
            onCharacterChanged(arr[0]);
        }
    };

    const onEquipmentSlot1Changed = (equipment: IEquipmentSpec) => {
        setEquipmentSlot1(equipment);
    };

    const onEquipmentSlot2Changed = (equipment: IEquipmentSpec) => {
        setEquipmentSlot2(equipment);
    };

    const onEquipmentSlot3Changed = (equipment: IEquipmentSpec) => {
        setEquipmentSlot3(equipment);
    };

    /** Parses a string representing an equipment type. */
    const parseEquipmentType = (type: string): EquipmentType => {
        const parsed: EquipmentType | undefined = EquipmentType[type as keyof typeof EquipmentType];
        if (parsed == undefined) {
            if (type == 'Defense') return EquipmentType.Defensive;
            if (type == 'Crit Booster') return EquipmentType.CritBooster;
            if (type == 'Block Booster') return EquipmentType.BlockBooster;
            if (type == 'Block') return EquipmentType.Block;
            if (type == 'Crit') return EquipmentType.Crit;
            console.error(`Failed to parse equipment type: ${type}`);
        }
        return parsed!;
    };

    /** Updates the display with information about the new character. */
    const onCharacterChanged = (newCharacter: string) => {
        const unit = storeContext.characters.find(unit => unit.id === newCharacter);
        if (unit == undefined) {
            setCanUseEquipment(false);
        } else {
            setCanUseEquipment(true);
            setFaction(unit.faction);
            setRank(unit.rank);
            setRarity(unit.rarity);
            setStars(unit.stars);
            setEquipmentSlot1({ type: parseEquipmentType(unit.equipment1) });
            setEquipmentSlot2({ type: parseEquipmentType(unit.equipment2) });
            setEquipmentSlot3({ type: parseEquipmentType(unit.equipment3) });
        }
        setCharacter(newCharacter);
    };

    const onRankChanged = (newRank: Rank) => {
        setRank(newRank);
    };

    const onStarsChanged = (newStars: RarityStars) => {
        setStars(newStars);
    };

    useEffect(() => {
        const unit = StaticDataService.unitsData.find(unit => unit.id === character);
        const charId = unit != undefined ? unit.id : undefined;
        const npcName = charId == undefined ? character : undefined;
        onCharacterChange(charId, npcName, faction, rank, rarity, stars, [
            equipmentSlot1,
            equipmentSlot2,
            equipmentSlot3,
        ]);
    }, [character, faction, rank, rarity, stars, equipmentSlot1, equipmentSlot2, equipmentSlot3]);

    const isPlayableCharacter = useMemo(() => {
        return StaticDataService.unitsData.find(unit => unit.id === character) != undefined;
    }, [character]);

    const stats = useMemo(() => {
        return DamageCalculatorService.getUnitData(character, faction, rank, rarity, stars, [
            equipmentSlot1,
            equipmentSlot2,
            equipmentSlot3,
        ]);
    }, [character, rank, rarity, stars, equipmentSlot1, equipmentSlot2, equipmentSlot3]);

    const health = useMemo(() => stats.health, [stats]);
    const damage = useMemo(() => stats.damage, [stats]);
    const armor = useMemo(() => stats.armor, [stats]);
    const meleeDamageType = useMemo(() => stats.meleeType, [stats]);
    const meleeHits = useMemo(() => stats.meleeHits, [stats]);
    const rangeDamageType = useMemo(() => stats.rangeType, [stats]);
    const rangeHits = useMemo(() => stats.rangeHits, [stats]);

    const range = useMemo(() => {
        if (isPlayableCharacter) {
            return StaticDataService.unitsData.find(unit => unit.id === character)?.rangeDistance;
        }
        return StaticDataService.npcDataFull.find(npc => npc.name === character)?.range;
    }, [character]);

    const equipmentSlot1Display = useMemo(() => {
        return (
            <EquipmentSelect
                faction={faction}
                equipment={equipmentSlot1}
                maxRarity={rarity}
                onEquipmentChange={onEquipmentSlot1Changed}
            />
        );
    }, [faction, rarity, equipmentSlot1]);

    const equipmentSlot2Display = useMemo(() => {
        return (
            <EquipmentSelect
                faction={faction}
                equipment={equipmentSlot2}
                maxRarity={rarity}
                onEquipmentChange={onEquipmentSlot2Changed}
            />
        );
    }, [faction, rarity, equipmentSlot2]);

    const equipmentSlot3Display = useMemo(() => {
        return (
            <EquipmentSelect
                faction={faction}
                equipment={equipmentSlot3}
                maxRarity={rarity}
                onEquipmentChange={onEquipmentSlot3Changed}
            />
        );
    }, [faction, rarity, equipmentSlot3]);

    const equipmentDisplay = useMemo(() => {
        return (
            canUseEquipment && (
                <div className="flex-box gap5">
                    <div style={{ minWidth: 110 }}>{equipmentSlot1Display}</div>
                    <div style={{ minWidth: 110 }}>{equipmentSlot2Display}</div>
                    <div style={{ minWidth: 110 }}>{equipmentSlot3Display}</div>
                </div>
            )
        );
    }, [canUseEquipment, equipmentSlot1Display, equipmentSlot2Display, equipmentSlot3Display]);

    return (
        <div className="flex-box gap10">
            <div>
                <div className="m-3">
                    <FactionSelect
                        label="Faction"
                        factions={Object.values(Faction)}
                        faction={faction}
                        factionChanges={faction => onFactionChanged(faction)}
                    />
                </div>
                <div className="m-3">
                    <CharacterSelect
                        label={'Character'}
                        value={character}
                        idsAndNames={idsAndNames}
                        valueChanges={(value: string) => onCharacterChanged(value)}
                    />
                </div>
                <div className="m-3">
                    <RaritySelect
                        label="Rarity"
                        value={rarity}
                        rarityValues={getEnumValues(Rarity)}
                        valueChanges={rarity => onRarityChanged(rarity)}
                    />
                </div>
                <div className="m-3">
                    <StarsSelect
                        label="Stars"
                        value={stars}
                        starsValues={starValues}
                        valueChanges={stars => onStarsChanged(stars)}
                    />
                </div>
                <div className="m-3">
                    <RankSelect
                        label="Rank"
                        value={rank}
                        rankValues={rankValues}
                        valueChanges={rank => onRankChanged(rank)}
                    />
                </div>
                <div>{equipmentDisplay}</div>
                <div className="m-3">
                    <NpcPortrait name={character} rank={rank} rarity={rarity} stars={stars} />
                </div>
                <div className="m-3 flex-box gap5" style={{ position: 'relative' }}>
                    <div>
                        <div className="m-3">
                            <span>
                                <MiscIcon icon={'health'} width={20} height={20} />
                                {health}
                            </span>
                        </div>
                        <div className="m-3">
                            <span>
                                <MiscIcon icon={'damage'} width={20} height={20} />
                                {damage}
                            </span>
                        </div>
                        <div className="m-3">
                            <span>
                                <MiscIcon icon={'armour'} width={20} height={20} />
                                {armor}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="m-3 flex-box gap5" style={{ position: 'relative' }}>
                            <MiscIcon icon={'melee'} width={20} height={20} />
                            <DamageIcon icon={meleeDamageType!} width={22} height={20} />
                            <div style={{ width: 20 }} />
                            <span>{meleeHits}</span>
                            <MiscIcon icon={'hits'} width={20} height={20} />
                        </div>
                        {rangeHits && rangeDamageType && (
                            <div className="m-3 flex-box gap5" style={{ position: 'relative' }}>
                                <MiscIcon icon={'ranged'} width={20} height={20} />
                                <DamageIcon icon={rangeDamageType} range={range} width={22} height={20} />
                                <div style={{ width: 20 }} />
                                <span>{rangeHits}</span>
                                <MiscIcon icon={'hits'} width={20} height={20} />
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ height: '100%' }}></div>
            </div>
        </div>
    );
};
