import { Alliance, DamageType, Trait, FactionId } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';

export const filter = (characters: ICharacter2[]) => ({
    byAlliance: (alliance: Alliance, not = false) =>
        characters.filter(char => (not ? char.alliance !== alliance : char.alliance === alliance)),
    byFaction: (faction: FactionId, not = false) => {
        return characters.filter(char => (not ? char.faction !== faction : char.faction === faction));
    },
    byDamageType: (damageType: DamageType, not = false) =>
        characters.filter(char =>
            not
                ? char.damageTypes.all.every(type => type !== damageType)
                : char.damageTypes.all.some(type => type === damageType)
        ),
    byTrait: (trait: Trait, not = false) =>
        characters.filter(char =>
            not
                ? char.traits.every(charTrait => Trait[charTrait as keyof typeof Trait] !== trait)
                : char.traits.some(charTrait => Trait[charTrait as keyof typeof Trait] === trait)
        ),
    byAttackType: (attackType: 'rangeOnly' | 'meleeOnly') =>
        characters.filter(char => (attackType === 'rangeOnly' ? !!char.rangeHits : !char.rangeHits)),
    byMaxHits: (hits: number) =>
        characters.filter(
            char => (!char.rangeHits && char.meleeHits <= hits) || (!!char.rangeHits && char.rangeHits <= hits)
        ),
    byMinHits: (hits: number) =>
        characters.filter(
            char => (!char.rangeHits && char.meleeHits >= hits) || (!!char.rangeHits && char.rangeHits >= hits)
        ),
    byNoSummons: () => characters.filter(char => !char.forcedSummons),
    isMechanical: () =>
        characters.filter(char => char.traits.some(type => type === Trait.LivingMetal || type === Trait.Mechanical)),
    isNotMechanical: () =>
        characters.filter(char => char.traits.every(type => type !== Trait.LivingMetal && type !== Trait.Mechanical)),
});
