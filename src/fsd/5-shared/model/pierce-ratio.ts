import { DamageType } from './enums';

/**
 * Fraction of damage that still lands through infinite armor, by damage type — the floor a hit's
 * damage can never be mitigated below, however high the target's armor is. Single source of truth
 * for `NpcService.getPierce` and the unit-details damage-vs-armor columns/radar chart, which
 * previously each carried their own copy of this table.
 *
 * Takes a plain `string`, not `DamageType`: every caller already sources this from raw,
 * unvalidated JSON (`meleeAttack.pierce`/`rangedAttack.pierce`, NPC `Melee Damage`/`Ranged
 * Damage`), so pretending the input is a validated enum member just hid two real mismatches —
 * `"HeavyRound"` (no space) vs. `DamageType.HeavyRound`'s actual value `"Heavy Round"`, and
 * `"Gauss"`, which the data uses as another name for `DamageType.Molecular`. Both are handled as
 * aliases below rather than falling through to the "unknown" case.
 *
 * @returns the pierce ratio for the specified damage type, or -1 if the type is unrecognized.
 */
export function getPierceRatio(damageType: string): number {
    switch (damageType) {
        case DamageType.Bio: {
            return 0.3;
        }
        case DamageType.Blast: {
            return 0.15;
        }
        case DamageType.Bolter: {
            return 0.2;
        }
        case DamageType.Chain: {
            return 0.15;
        }
        case DamageType.Direct: {
            return 1;
        }
        case DamageType.Energy: {
            return 0.3;
        }
        case DamageType.Eviscerate: {
            return 0.5;
        }
        case DamageType.Flame: {
            return 0.25;
        }
        case DamageType.HeavyRound:
        case 'HeavyRound': {
            return 0.55;
        }
        case DamageType.Las: {
            return 0.1;
        }
        case DamageType.Melta: {
            return 0.75;
        }
        case DamageType.Molecular:
        case 'Gauss': {
            return 0.6;
        }
        case DamageType.Particle: {
            return 0.35;
        }
        case DamageType.Physical: {
            return 0.01;
        }
        case DamageType.Piercing: {
            return 0.8;
        }
        case DamageType.Plasma: {
            return 0.6;
        }
        case DamageType.Power: {
            return 0.4;
        }
        case DamageType.Projectile: {
            return 0.15;
        }
        case DamageType.Pulse: {
            return 0.2;
        }
        case DamageType.Psychic: {
            return 1;
        }
        case DamageType.Toxic: {
            return 0.7;
        }
        default: {
            return -1;
        }
    }
}
