import { describe, it, expect } from 'vitest';

import { Alliance, Trait } from '@/fsd/5-shared/model';

import { CharactersService } from './characters.service';
import { ICharacter2 } from './model';

const baseCharacter = CharactersService.charactersData[0];

const makeCharacter = (overrides: Partial<ICharacter2>): ICharacter2 =>
    ({
        ...baseCharacter,
        ...overrides,
    }) as ICharacter2;

describe('CharactersService', () => {
    describe('passesTraitsFilter', () => {
        it('matches a Mechanical filter against a character tagged LivingMetal instead', () => {
            const character = makeCharacter({ traits: ['LivingMetal'] as unknown as Trait[] });
            expect(CharactersService.passesTraitsFilter(character, [Trait.Mechanical])).toBe(true);
        });

        it('fails a Mechanical filter when the character has neither Mechanical nor LivingMetal', () => {
            const character = makeCharacter({ traits: ['Flying'] as unknown as Trait[] });
            expect(CharactersService.passesTraitsFilter(character, [Trait.Mechanical])).toBe(false);
        });

        it('matches a Mechanical filter against a character directly tagged Mechanical', () => {
            const character = makeCharacter({ traits: ['Mechanical'] as unknown as Trait[] });
            expect(CharactersService.passesTraitsFilter(character, [Trait.Mechanical])).toBe(true);
        });

        it('requires an exact key match for non-Mechanical traits (no OR-match leakage)', () => {
            const character = makeCharacter({ traits: ['LivingMetal'] as unknown as Trait[] });
            expect(CharactersService.passesTraitsFilter(character, [Trait.Flying])).toBe(false);
        });
    });

    describe('getTraitsOptions', () => {
        it('returns the trait label, not the raw storage key', () => {
            const characters = [makeCharacter({ traits: ['LivingMetal'] as unknown as Trait[] })];
            const options = CharactersService.getTraitsOptions(characters);

            expect(options).toContain(Trait.LivingMetal);
            expect(options).not.toContain('LivingMetal');
        });

        it('excludes traits not present on any roster character', () => {
            const characters = [makeCharacter({ traits: ['Flying'] as unknown as Trait[] })];
            const options = CharactersService.getTraitsOptions(characters);

            expect(options).not.toContain(Trait.Mechanical);
        });
    });

    describe('passesAllianceFilter', () => {
        it('passes everything when the filter list is empty', () => {
            expect(CharactersService.passesAllianceFilter(Alliance.Imperial, [])).toBe(true);
        });

        it('matches by exact membership, not substring', () => {
            expect(CharactersService.passesAllianceFilter(Alliance.Imperial, [Alliance.Chaos])).toBe(false);
            expect(CharactersService.passesAllianceFilter(Alliance.Imperial, [Alliance.Imperial])).toBe(true);
        });
    });

    describe('passesRosterFilter', () => {
        it('combines multiple dimensions with AND', () => {
            const character = makeCharacter({ meleeHits: 2, rangeHits: undefined, movement: 3 });

            expect(
                CharactersService.passesRosterFilter(character, {
                    attackType: 'melee',
                    minHits: 2,
                })
            ).toBe(true);

            expect(
                CharactersService.passesRosterFilter(character, {
                    attackType: 'range',
                    minHits: 2,
                })
            ).toBe(false);
        });
    });
});
