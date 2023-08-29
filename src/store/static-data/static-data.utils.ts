import unitsData from '../../data/UnitData.json';
import dirtyDozen from '../../data/DirtyDozen.json';
import { IDirtyDozenChar, IUnitData, UnitDataRaw } from './interfaces';
import { DamageTypeRaw, DamageTypes, Faction, Traits, Traits2, TraitTypeRaw } from './enums';

const rawTraitToEnum: Record<string, Traits> = {
    [TraitTypeRaw.Psyker]: Traits.Psyker,
    [TraitTypeRaw.Overwatch]: Traits.Overwatch,
    [TraitTypeRaw.HeavyWeapon]: Traits.HeavyWeapon,
    [TraitTypeRaw.Infiltrate]: Traits.Infiltrate,
    [TraitTypeRaw.Flying]: Traits.Flying,
    [TraitTypeRaw.MKXGravis]: Traits.MKXGravis,
    [TraitTypeRaw.Healer]: Traits.Healer,
    [TraitTypeRaw.FinalVengeance]: Traits.FinalVengeance,
    [TraitTypeRaw.LetTheGalaxyBurn]: Traits.LetTheGalaxyBurn,
    [TraitTypeRaw.DeepStrike]: Traits.DeepStrike,
    [TraitTypeRaw.TerminatorArmour]: Traits.TerminatorArmour,
    [TraitTypeRaw.Resilient]: Traits.Resilient,
    [TraitTypeRaw.BeastSnagga]: Traits.BeastSnagga,
    [TraitTypeRaw.Mechanic]: Traits.Mechanic,
    [TraitTypeRaw.Mechanical]: Traits.Mechanical,
    [TraitTypeRaw.Explodes]: Traits.Explodes,
    [TraitTypeRaw.Dakka]: Traits.Dakka,
    [TraitTypeRaw.Mounted]: Traits.Mounted,
    [TraitTypeRaw.ActOfFaith]: Traits.ActOfFaith,
    [TraitTypeRaw.LivingMetal]: Traits.LivingMetal,
    [TraitTypeRaw.IndirectFire]: Traits.IndirectFire,
    [TraitTypeRaw.ContagionsOfNurgle]: Traits.ContagionsOfNurgle,
    [TraitTypeRaw.PutridExplosion]: Traits.PutridExplosion,
    [TraitTypeRaw.Parry]: Traits.Parry,
    [TraitTypeRaw.Terrifying]: Traits.Terrifying,
    [TraitTypeRaw.Unstoppable]: Traits.Unstoppable,
    [TraitTypeRaw.CloseCombatWeakness]: Traits.CloseCombatWeakness,
    [TraitTypeRaw.Camouflage]: Traits.Camouflage,
    [TraitTypeRaw.WeaverOfFates]: Traits.WeaverOfFates,
    [TraitTypeRaw.BigTarget]: Traits.BigTarget,
    [TraitTypeRaw.ShadowInTheWarp]: Traits.ShadowInTheWarp,
    [TraitTypeRaw.Synapse]: Traits.Synapse,
};

const rawTraitToEnum2: Record<string, Traits2> = {
    [TraitTypeRaw.SuppressiveFire]: Traits2.SuppressiveFire,
};

const damageTypeToEnum: Record<string, DamageTypes> = {
    [DamageTypeRaw.Physical]: DamageTypes.Physical,
    [DamageTypeRaw.Psychic]: DamageTypes.Psychic,
    [DamageTypeRaw.Bolter]: DamageTypes.Bolter,
    [DamageTypeRaw.Piercing]: DamageTypes.Piercing,
    [DamageTypeRaw.Power]: DamageTypes.Power,
    [DamageTypeRaw.HeavyRound]: DamageTypes.HeavyRound,
    [DamageTypeRaw.Chain]: DamageTypes.Chain,
    [DamageTypeRaw.Projectile]: DamageTypes.Projectile,
    [DamageTypeRaw.Flame]: DamageTypes.Flame,
    [DamageTypeRaw.Molecular]: DamageTypes.Molecular,
    [DamageTypeRaw.Particle]: DamageTypes.Particle,
    [DamageTypeRaw.Plasma]: DamageTypes.Plasma,
    [DamageTypeRaw.Energy]: DamageTypes.Energy,
    [DamageTypeRaw.Las]: DamageTypes.Las,
    [DamageTypeRaw.Blast]: DamageTypes.Blast,
    [DamageTypeRaw.Direct]: DamageTypes.Direct,
    [DamageTypeRaw.Pulse]: DamageTypes.Pulse,
    [DamageTypeRaw.Melta]: DamageTypes.Melta,
};

export class StaticDataUtils {
    
    static readonly unitsData: IUnitData[] = (unitsData as UnitDataRaw[]).map(this.convertUnitData);
    static readonly dirtyDozenData: IDirtyDozenChar[] = dirtyDozen;


    static convertUnitData(rawData: UnitDataRaw): IUnitData {
        const unitData: IUnitData = {
            alliance: rawData.Alliance,
            faction: rawData.Faction,
            factionColor: StaticDataUtils.getFactionColor(rawData.Faction),
            name: rawData.Name,
            numberAdded: rawData.Number,
            health: rawData.Health,
            damage: rawData.Damage,
            armour: rawData.Armour,
            damageTypes: DamageTypes.None,
            traits: Traits.None,
            traits2: Traits2.None,
            meleeDamage: DamageTypes.None,
            rangeDamage: DamageTypes.None,
            abilitiesDamage: DamageTypes.None,
            equipment1: rawData.Equipment1,
            equipment2: rawData.Equipment2,
            equipment3: rawData.Equipment3,
            meleeHits: rawData['Melee Hits'],
            rangeHits: rawData['Ranged Hits'],
            rangeDistance: rawData.Distance,
            movement: rawData.Movement,
            forcedSummons: rawData.ForcedSummons,
            requiredInCampaign: rawData.RequiredInCampaign,
            legendaryEvents: {}
        };

        // Calculate damage types based on rawData values
        if (rawData['Melee Damage']) {
            unitData.damageTypes |= damageTypeToEnum[rawData['Melee Damage']];
            unitData.meleeDamage = damageTypeToEnum[rawData['Melee Damage']];
        }
        if (rawData['Ranged Damage']) {
            unitData.damageTypes |=  damageTypeToEnum[rawData['Ranged Damage']];
            unitData.rangeDamage = damageTypeToEnum[rawData['Ranged Damage']];
        }
        if (rawData['Active Ability']) {
            unitData.damageTypes |= damageTypeToEnum[rawData['Active Ability']];
            unitData.abilitiesDamage |= damageTypeToEnum[rawData['Active Ability']];
        }
        if (rawData['Passive Ability']) {
            unitData.damageTypes |=  damageTypeToEnum[rawData['Passive Ability']];
            unitData.abilitiesDamage |=  damageTypeToEnum[rawData['Passive Ability']];
        }

        // Calculate traits based on rawData values
        for (let i = 1; i <= 4; i++) {
            const traitKey = `Trait ${i}` as 'Trait 1' | 'Trait 2' | 'Trait 3' | 'Trait 4';
            const value = rawData[traitKey] as TraitTypeRaw;
            if (value) {
                if (rawTraitToEnum[value]) {
                    unitData.traits |= rawTraitToEnum[value];
                }
                if(rawTraitToEnum2[value]) {
                    unitData.traits2 |= rawTraitToEnum2[value];
                }
            }
        }

        return unitData;
    }
    
    static getFactionColor(faction: Faction): string {
        switch (faction) {
        case Faction.Ultramarines:
            return '#C9DAF8';
        case Faction.Black_Legion:
            return '#DD7E6B';
        case Faction.Orks:
            return '#FFE599';
        case Faction.ADEPTA_SORORITAS:
            return '#F4CCCC';
        case Faction.Necrons:
            return '#B6D7A8';
        case Faction.Astra_militarum:
            return '#D9EAD3';
        case Faction.Death_Guard:
            return '#93C47D';
        case Faction.Black_Templars:
            return '#D9D9D9';
        case Faction.Aeldari:
            return '#A2C4C9';
        case Faction.Space_Wolves:
            return '#A4C2F4';
        case Faction.T_Au:
            return '#FCE5CD';
        case Faction.Dark_Angels:
            return '#93C47D';
        case Faction.Thousand_Sons:
            return '#A4C2F4';
        case Faction.Tyranids:
            return '#A4C2F4';
        default:
            return '#ffffff';
        }
    }
}

