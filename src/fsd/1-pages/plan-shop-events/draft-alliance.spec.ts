import { describe, expect, it } from 'vitest';

import { Alliance } from '@/fsd/5-shared/model';

import { getDraftAllianceOptions, isDraftRewardType, resolveDraftAllianceType } from './draft-alliance';

describe('isDraftRewardType', () => {
    it('is true for every draft_ prefix', () => {
        expect(isDraftRewardType('draft_ascensionOrbsLegendary')).toBe(true);
        expect(isDraftRewardType('draft_abilityTokensRare')).toBe(true);
        expect(isDraftRewardType('draft_machinesOfWarTokens')).toBe(true);
    });

    it('is false for a non-draft type', () => {
        expect(isDraftRewardType('heroAscensionOrbLegendary_Imperial')).toBe(false);
        expect(isDraftRewardType('gold')).toBe(false);
    });
});

describe('resolveDraftAllianceType', () => {
    it('resolves draft badges to the real alliance-suffixed badge type', () => {
        expect(resolveDraftAllianceType('draft_abilityTokensMythic', Alliance.Xenos)).toBe('abilityTokenMythic_Xenos');
    });

    it('resolves draft orbs to the real alliance-suffixed orb type', () => {
        expect(resolveDraftAllianceType('draft_ascensionOrbsLegendary', Alliance.Imperial)).toBe(
            'heroAscensionOrbLegendary_Imperial'
        );
    });

    it('resolves draft MoW tokens to the internal-only mowComponent type', () => {
        expect(resolveDraftAllianceType('draft_machinesOfWarTokens', Alliance.Chaos)).toBe('mowComponent_Chaos');
    });

    it('returns undefined for a non-draft or unrecognized type', () => {
        expect(resolveDraftAllianceType('gold', Alliance.Imperial)).toBeUndefined();
        expect(resolveDraftAllianceType('draft_somethingElse', Alliance.Imperial)).toBeUndefined();
    });
});

describe('getDraftAllianceOptions', () => {
    it('returns exactly 3 options, one per alliance, for a draft type', () => {
        const options = getDraftAllianceOptions('draft_ascensionOrbsLegendary');
        expect(options).toHaveLength(3);
        expect(options?.map(o => o.alliance).toSorted()).toEqual(
            [Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].toSorted()
        );
        for (const option of options ?? []) {
            expect(option.label.length).toBeGreaterThan(0);
        }
    });

    it('returns undefined for a non-draft type', () => {
        expect(getDraftAllianceOptions('gold')).toBeUndefined();
    });
});
