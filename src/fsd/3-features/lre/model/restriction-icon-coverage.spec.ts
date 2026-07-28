import { describe, expect, it } from 'vitest';

import { factionLookup } from '@/fsd/5-shared/lib';
import { DamageType, Trait } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { allLegendaryEvents } from '@/fsd/4-entities/lre';

import { getLre } from '../get-lre';

import { LETrack } from './base.le.track';

/** Every `objectiveType` `RestrictionIcon` (./restriction-icon.tsx) knows how to render. */
const KNOWN_OBJECTIVE_TYPES = new Set([
    'Trait',
    'NotTrait',
    'DamageType',
    'NotDamageType',
    'Faction',
    'NotFaction',
    'MaxHits',
    'MinHits',
    'HasRangedAttack',
    'HasNoRangedAttack',
    'NoSummons',
    'KillScore',
    'HighScore',
    'DefeatAll',
]);

const DAMAGE_TYPE_VALUES = new Set<string>(Object.values(DamageType));

describe('LRE restriction icon coverage', () => {
    for (const event of allLegendaryEvents) {
        it(`every restriction in "${event.name}" resolves to a known, renderable icon`, () => {
            const lre = getLre(event.id, [] as ICharacter2[]);
            for (const section of ['alpha', 'beta', 'gamma'] as const) {
                const track = lre[section] as LETrack;
                for (const requirement of track.unitsRestrictions) {
                    const label = `${event.name} ${section} "${requirement.name}"`;
                    expect(requirement.objectiveType, `${label} is missing objectiveType`).toBeDefined();
                    expect(
                        KNOWN_OBJECTIVE_TYPES.has(requirement.objectiveType ?? ''),
                        `${label} has unhandled objectiveType "${requirement.objectiveType}"`
                    ).toBe(true);

                    const target = requirement.objectiveTarget ?? '';
                    switch (requirement.objectiveType) {
                        case 'Trait':
                        case 'NotTrait': {
                            expect(
                                Trait[target as keyof typeof Trait],
                                `${label} references unknown trait "${target}"`
                            ).toBeDefined();
                            break;
                        }
                        case 'DamageType':
                        case 'NotDamageType': {
                            expect(
                                DAMAGE_TYPE_VALUES.has(target),
                                `${label} references unknown damage type "${target}"`
                            ).toBe(true);
                            break;
                        }
                        case 'Faction':
                        case 'NotFaction': {
                            expect(
                                factionLookup[target as keyof typeof factionLookup],
                                `${label} references unknown faction "${target}"`
                            ).toBeDefined();
                            break;
                        }
                    }
                }
            }
        });
    }
});
