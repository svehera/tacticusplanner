import { ICharacter } from '../static-data/interfaces';
import { Alliance, DamageTypes, Faction, Traits } from '../static-data/enums';

export const filter = (characters: ICharacter[]) => ({
    byAlliance: (alliance: Alliance) => characters.filter(char => char.alliance === alliance),
    byFaction: (faction: Faction, not = false) => characters.filter(char => not ? char.faction !== faction : char.faction === faction),
    byDamageType: (damageType: DamageTypes, not = false) => characters.filter(char => not ? (char.damageTypes & damageType) !== damageType : (char.damageTypes & damageType) === damageType),
    byTrait: (trait: Traits, not = false) => characters.filter(char => not ? (char.traits & trait) !== trait : (char.traits & trait) === trait),
    byAttackType: (attackType: 'rangeOnly' | 'meleeOnly') => characters.filter(char => attackType === 'rangeOnly' ? !!char.rangeHits : !char.rangeHits),
    byMaxHits: (hits: number) => characters.filter(char => (!char.rangeHits && char.meleeHits <= hits) || (!!char.rangeHits && char.rangeHits <= hits)),
    byMinHits: (hits: number) => characters.filter(char => (!char.rangeHits && char.meleeHits >= hits) || (!!char.rangeHits && char.rangeHits >= hits)),
    byNoSummons: () => characters.filter(char => !char.forcedSummons),
    
});