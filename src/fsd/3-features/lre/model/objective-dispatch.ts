import { factionLookup } from '@/fsd/5-shared/lib';
import { DamageType, FactionId, Trait } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';

import { filter } from './filters';

/**
 * Maps a battle-objective `type`/`target` pair (from the machine-generated
 * `bonusObjectives` data) to the matching `filters.ts` predicate. This is a direct
 * extraction of the pattern the hand-rolled event subclasses already repeat by hand.
 */
export function applyObjective(units: ICharacter2[], type: string, target: string): ICharacter2[] {
    const f = filter(units);
    switch (type) {
        case 'Trait': {
            return f.byTrait(Trait[target as keyof typeof Trait]);
        }
        case 'NotTrait': {
            return f.byTrait(Trait[target as keyof typeof Trait], true);
        }
        case 'DamageType': {
            return f.byDamageType(target as DamageType);
        }
        case 'NotDamageType': {
            return f.byDamageType(target as DamageType, true);
        }
        case 'Faction': {
            return f.byFaction(target as FactionId);
        }
        case 'NotFaction': {
            return f.byFaction(target as FactionId, true);
        }
        case 'MaxHits': {
            return f.byMaxHits(Number(target));
        }
        case 'MinHits': {
            return f.byMinHits(Number(target));
        }
        case 'HasRangedAttack': {
            return f.byAttackType('rangeOnly');
        }
        case 'HasNoRangedAttack': {
            return f.byAttackType('meleeOnly');
        }
        case 'NoSummons': {
            return f.byNoSummons();
        }
        default: {
            throw new Error(`Unhandled LRE objective type: ${type}`);
        }
    }
}

/** A couple of traits have a nicer, shorter display name than their full enum value. */
const NAME_OVERRIDES: Record<string, string> = {
    'Trait:TerminatorArmour': 'Terminator',
    'NotTrait:TerminatorArmour': 'No Terminator',
};

export function objectiveDisplayName(type: string, target: string): string {
    const override = NAME_OVERRIDES[`${type}:${target}`];
    if (override) return override;

    switch (type) {
        case 'Trait': {
            return Trait[target as keyof typeof Trait] ?? target;
        }
        case 'NotTrait': {
            return `No ${Trait[target as keyof typeof Trait] ?? target}`;
        }
        case 'DamageType': {
            return target;
        }
        case 'NotDamageType': {
            return `No ${target}`;
        }
        case 'Faction': {
            return factionLookup[target as FactionId]?.name ?? target;
        }
        case 'NotFaction': {
            return `No ${factionLookup[target as FactionId]?.name ?? target}`;
        }
        case 'MaxHits': {
            return `Max ${target} hits`;
        }
        case 'MinHits': {
            return `Min ${target} hits`;
        }
        case 'HasRangedAttack': {
            return 'Ranged';
        }
        case 'HasNoRangedAttack': {
            return 'Melee';
        }
        case 'NoSummons': {
            return 'No Summons';
        }
        default: {
            return `${type}${target ? ` ${target}` : ''}`;
        }
    }
}
