/* eslint-disable import-x/no-internal-modules */
import { describe, expect, it } from 'vitest';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import { Rarity } from '@/fsd/5-shared/model';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

import abilityDataJson from '@/fsd/4-entities/abilities/data/new-ability-data.json';

import { getStyleSpec, parseAbilityText, resolveVariable } from './ability-text';
import type { AbilityContext, StyledNode } from './ability-text';

interface AbilityEntry {
    id: string;
    text: { name: string; currentLevelDescription: string; nextLevelDescription: string };
    variables: Record<string, (string | number)[]>;
    constants?: Record<string, string>;
}

const abilityData = abilityDataJson as unknown as AbilityEntry[];

// ── Parser correctness ────────────────────────────────────────────────────────

describe('parseAbilityText', () => {
    it('parses plain text', () => {
        const ast = parseAbilityText('Hello world');
        expect(ast).toEqual([{ type: 'text', value: 'Hello world' }]);
    });

    it('parses a simple styled span', () => {
        const ast = parseAbilityText('<style="Stat_Hits">3x</style>');
        expect(ast).toHaveLength(1);
        expect(ast[0].type).toBe('styled');
        const node = ast[0] as StyledNode;
        expect(node.styleName).toBe('Stat_Hits');
        expect(node.isDynamic).toBe(false);
        expect(node.children).toEqual([{ type: 'text', value: '3x' }]);
    });

    it('parses a variable', () => {
        const ast = parseAbilityText('{[nrOfHits]}');
        expect(ast).toHaveLength(1);
        expect(ast[0]).toMatchObject({ type: 'var', name: 'nrOfHits' });
    });

    it('parses a split-indexed variable {[dmg[0]]}', () => {
        const ast = parseAbilityText('{[dmg[0]]}');
        expect(ast[0]).toMatchObject({ type: 'var', name: 'dmg', splitIndex: 0 });
    });

    it('parses {[UnitName]}', () => {
        const ast = parseAbilityText('{[UnitName]}');
        expect(ast[0]).toMatchObject({ type: 'var', isUnitName: true });
    });

    it('parses {[S/key]} as a skipped var with empty name', () => {
        const ast = parseAbilityText('{[S/AbilityDamageExplanation]}');
        expect(ast[0]).toMatchObject({ type: 'var', name: '' });
    });

    it('parses dynamic style <style={[DamageProfileTypeStyle]}>', () => {
        const ast = parseAbilityText('<style={[DamageProfileTypeStyle]}>Bolter Damage</style>');
        expect(ast).toHaveLength(1);
        const node = ast[0] as StyledNode;
        expect(node.isDynamic).toBe(true);
        expect(node.styleName).toBe('[DamageProfileTypeStyle]');
    });

    it('parses nested styles', () => {
        const ast = parseAbilityText(
            '<style="Faction_Ultramarines">{[UnitName]}</style> deals <style="Stat_Hits">3x</style>'
        );
        expect(ast).toHaveLength(3);
        expect(ast[0].type).toBe('styled');
        expect(ast[2].type).toBe('styled');
    });
});

// ── Variable resolution ───────────────────────────────────────────────────────

describe('resolveVariable', () => {
    const context: AbilityContext = {
        level: 1,
        variables: { dmg: ['100,80,60', '110,90,70'], hits: [3, 4] },
        constants: { damageProfile: 'Bolter', nrOfHits: '1' },
        scaledVariableNames: new Set(['hits']),
        rarity: Rarity.Common,
        unitName: 'Marneus Calgar',
        factionId: 'Ultramarines',
    };

    it('resolves level-indexed variable at level 1', () => {
        expect(resolveVariable({ type: 'var', name: 'hits' }, context)).toBe('3');
    });

    it('resolves level-indexed variable at level 2', () => {
        expect(resolveVariable({ type: 'var', name: 'hits' }, { ...context, level: 2 })).toBe('4');
    });

    it('resolves split-indexed variable', () => {
        expect(resolveVariable({ type: 'var', name: 'dmg', splitIndex: 1 }, context)).toBe('80');
    });

    it('resolves constant variable', () => {
        expect(resolveVariable({ type: 'var', name: 'nrOfHits' }, context)).toBe('1');
    });

    it('returns unit name for isUnitName', () => {
        expect(resolveVariable({ type: 'var', name: 'UnitName', isUnitName: true }, context)).toBe('Marneus Calgar');
    });

    it('returns undefined for S/key (skipped)', () => {
        expect(resolveVariable({ type: 'var', name: '' }, context)).toBeUndefined();
    });

    it('scales a variable by rarity factor (Epic = 1.6)', () => {
        const epicContext = { ...context, rarity: Rarity.Epic };
        // hits[0] = 3, * 1.6 = 4.8 → rounded to 5
        expect(resolveVariable({ type: 'var', name: 'hits' }, epicContext)).toBe('5');
    });

    it('does not scale variables not in scaledVariableNames', () => {
        const epicContext = { ...context, rarity: Rarity.Epic };
        // dmg is not in scaledVariableNames
        expect(resolveVariable({ type: 'var', name: 'dmg', splitIndex: 0 }, epicContext)).toBe('100');
    });
});

// ── Full parse sweep: all ability descriptions must parse without throwing ─────

describe('parseAbilityText parses all ability descriptions', () => {
    const failures: string[] = [];

    for (const ability of abilityData) {
        for (const [field, text] of [
            ['currentLevelDescription', ability.text.currentLevelDescription],
            ['nextLevelDescription', ability.text.nextLevelDescription],
        ] as const) {
            if (!text) continue;
            try {
                parseAbilityText(text);
            } catch (error) {
                failures.push(`${ability.id}.${field}: ${(error as Error).message.slice(0, 120)}`);
            }
        }
    }

    it('has no parse failures', () => {
        expect(failures, failures.join('\n')).toHaveLength(0);
    });
});

// ── Style spec coverage (all styles used in data resolve without throwing) ────

describe('getStyleSpec does not throw for any style used in ability data', () => {
    const allStyles = new Set<string>();
    for (const ability of abilityData) {
        for (const text of [ability.text.currentLevelDescription, ability.text.nextLevelDescription]) {
            for (const match of text.matchAll(/<style="([^"]+)">/g)) {
                allStyles.add(match[1]);
            }
        }
    }

    for (const style of allStyles) {
        it(`getStyleSpec("${style}") returns a defined spec`, () => {
            expect(getStyleSpec(style)).toBeDefined();
        });
    }
});

// ── Icon existence: stat icons ────────────────────────────────────────────────

describe('stat style icons exist in tacticusIcons or snowprintIcons', () => {
    const statIconMap: Record<string, string> = {
        Stat_Armor: 'armour',
        Stat_Block: 'block',
        Stat_Chance: 'chance',
        Stat_CritChance: 'chance',
        Stat_CritDamage: 'critDamage',
        Stat_Damage: 'damage',
        Stat_Health: 'health',
        Stat_Hits: 'hitsIcon',
        Stat_Melee: 'meleeAttack',
        Stat_Movement: 'movement',
        Stat_Range: 'rangedAttack',
    };

    for (const [style, iconKey] of Object.entries(statIconMap)) {
        it(`icon for ${style} ("${iconKey}") exists`, () => {
            const icon = tacticusIcons[iconKey] ?? snowprintIcons[iconKey];
            expect(icon, `Missing icon key "${iconKey}" for ${style}`).toBeDefined();
        });
    }
});
