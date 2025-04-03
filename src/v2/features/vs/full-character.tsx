import React, { useMemo, useState } from 'react';
import { Faction, Rank, Rarity, RarityStars } from 'src/models/enums';
import { FactionSelect } from 'src/routes/npcs/faction-select';
import { RankSelect } from 'src/shared-components/rank-select';
import { RaritySelect } from 'src/shared-components/rarity-select';
import { getEnumValues } from 'src/shared-logic/functions';
import { StarsSelect } from 'src/shared-components/stars-select';
import { rarityToMaxRank } from 'src/models/constants';
import { StaticDataService } from 'src/services';
import { CharacterSelect } from './character-select';
import { NpcPortrait } from 'src/routes/tables/npc-portrait';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { StatCalculatorService } from 'src/v2/functions/stat-calculator-service';
import { DamageIcon } from './damage-icon';
import { IModifiersAndBuffs } from 'src/models/interfaces';

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
        buffs: IModifiersAndBuffs
    ) => void;
}

export const FullCharacter: React.FC<Props> = ({ onCharacterChange }) => {
    const [faction, setFaction] = useState<Faction>(Faction.Ultramarines);
    const [character, setCharacter] = useState<string>('Varro Tigurius');
    const [rank, setRank] = useState<Rank>(Rank.Stone1);
    const [rarity, setRarity] = useState<Rarity>(Rarity.Common);
    const [stars, setStars] = useState<RarityStars>(RarityStars.None);

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

    const onFactionChanged = (newFaction: Faction) => {
        if (faction != newFaction) {
            setFaction(newFaction);
            const arr: string[] = [];
            StaticDataService.unitsData.forEach(unit => {
                if (unit.faction === newFaction) arr.push(unit.id);
            });
            setCharacter(arr[0]);
        }
    };

    const isPlayableCharacter = useMemo(() => {
        return StaticDataService.unitsData.find(unit => unit.id === character) != undefined;
    }, [character]);

    const health = useMemo(() => {
        if (isPlayableCharacter) {
            return StatCalculatorService.calculateHealth(character, rarity, stars, rank, 0);
        } else {
            return StatCalculatorService.calculateNpcHealth(character, stars, rank);
        }
    }, [character, rank, rarity, stars]);

    const damage = useMemo(() => {
        if (isPlayableCharacter) {
            return StatCalculatorService.calculateDamage(character, rarity, stars, rank, 0);
        } else {
            return StatCalculatorService.calculateNpcDamage(character, stars, rank);
        }
    }, [character, rank, rarity, stars]);

    const armor = useMemo(() => {
        if (isPlayableCharacter) {
            return StatCalculatorService.calculateArmor(character, rarity, stars, rank, 0);
        } else {
            return StatCalculatorService.calculateNpcArmor(character, stars, rank);
        }
    }, [character, rank, rarity, stars]);

    const meleeDamageType = useMemo(() => {
        if (isPlayableCharacter) {
            return StaticDataService.unitsData.find(unit => unit.id === character)?.damageTypes.melee;
        }
        return StaticDataService.npcDataFull.find(npc => npc.name === character)?.meleeType;
    }, [character]);

    const meleeHits = useMemo(() => {
        if (isPlayableCharacter) {
            return StaticDataService.unitsData.find(unit => unit.id === character)?.meleeHits;
        }
        return StaticDataService.npcDataFull.find(npc => npc.name === character)?.meleeHits;
    }, [character]);

    const rangeDamageType = useMemo(() => {
        if (isPlayableCharacter) {
            return StaticDataService.unitsData.find(unit => unit.id === character)?.damageTypes.range;
        }
        return StaticDataService.npcDataFull.find(npc => npc.name === character)?.rangeType;
    }, [character]);

    const rangeHits = useMemo(() => {
        if (isPlayableCharacter) {
            return StaticDataService.unitsData.find(unit => unit.id === character)?.rangeHits;
        }
        return StaticDataService.npcDataFull.find(npc => npc.name === character)?.rangeHits;
    }, [character]);

    const range = useMemo(() => {
        if (isPlayableCharacter) {
            return StaticDataService.unitsData.find(unit => unit.id === character)?.rangeDistance;
        }
        return StaticDataService.npcDataFull.find(npc => npc.name === character)?.range;
    }, [character]);

    console.log(rangeDamageType);

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
                        valueChanges={(value: string) => setCharacter(value)}
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
                        valueChanges={stars => setStars(stars)}
                    />
                </div>
                <div className="m-3">
                    <RankSelect
                        label="Rank"
                        value={rank}
                        rankValues={rankValues}
                        valueChanges={rank => setRank(rank)}
                    />
                </div>
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
                            <DamageIcon icon={meleeDamageType} width={22} height={20} />
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
