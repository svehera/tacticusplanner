import { Alliance, DamageType, Trait, Faction } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';

const factionToString = (faction: Faction): string => {
    switch (faction) {
        case Faction.Ultramarines:
            return 'Ultramarines';
        case Faction.Black_Legion:
            return 'BlackLegion';
        case Faction.Orks:
            return 'Orks';
        case Faction.ADEPTA_SORORITAS:
            return 'Sisterhood';
        case Faction.Necrons:
            return 'Necrons';
        case Faction.Astra_militarum:
            return 'AstraMilitarum';
        case Faction.Death_Guard:
            return 'DeathGuard';
        case Faction.Black_Templars:
            return 'BlackTemplars';
        case Faction.Aeldari:
            return 'Aeldari';
        case Faction.Space_Wolves:
            return 'SpaceWolves';
        case Faction.T_Au:
            return 'Tau';
        case Faction.Dark_Angels:
            return 'DarkAngels';
        case Faction.Thousand_Sons:
            return 'ThousandSons';
        case Faction.Tyranids:
            return 'Tyranids';
        case Faction.AdeptusMechanicus:
            return 'AdeptusMechanicus';
        case Faction.WorldEaters:
            return 'WorldEaters';
        case Faction.BloodAngels:
            return 'BloodAngels';
        case Faction.GenestealerCults:
            return 'Genestealers';
        case Faction.AdeptusCustodes:
            return 'Custodes';
        case Faction.EmperorsChildren:
            return 'EmperorsChildren';
        default:
            return '';
    }
};

export const filter = (characters: ICharacter2[]) => ({
    byAlliance: (alliance: Alliance, not = false) =>
        characters.filter(char => (not ? char.alliance !== alliance : char.alliance === alliance)),
    byFaction: (faction: Faction, not = false) => {
        return characters.filter(char =>
            not ? char.faction !== factionToString(faction) : char.faction === factionToString(faction)
        );
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
