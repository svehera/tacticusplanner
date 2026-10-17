/* eslint-disable import-x/no-internal-modules */
import { describe, expect, it } from 'vitest';

import { snowprintIcons } from '@/fsd/5-shared/assets';

import questJson from './data/hero-quests.json';
import { getObjectiveDisplay, IQuestObjective } from './objective-display';

const allObjectives = questJson.flatMap(quest =>
    quest.tiers.flatMap(tier => tier.battles.flatMap((battle): IQuestObjective[] => [...battle.objectives]))
);

describe('getObjectiveDisplay', () => {
    it('resolves an icon (or faction emblem) for every objective in the quest data', () => {
        const unresolved = [
            ...new Set(
                allObjectives
                    .map(objective => ({ objective, display: getObjectiveDisplay(objective) }))
                    .filter(
                        ({ display }) => !display.factionId && !(display.iconKey && snowprintIcons[display.iconKey])
                    )
                    .map(({ objective }) => `${objective.ObjectiveType} ${String(objective.ObjectiveTarget)}`)
            ),
        ];
        expect(unresolved, `Objectives without an icon:\n${unresolved.join('\n')}`).toHaveLength(0);
    });

    it('marks bans as restrictions', () => {
        expect(getObjectiveDisplay({ ObjectiveType: 'NotTrait', ObjectiveTarget: 'Flying' })).toMatchObject({
            isRestriction: true,
            label: 'No Flying',
        });
        expect(getObjectiveDisplay({ ObjectiveType: 'DamageType', ObjectiveTarget: 'Bolter' }).isRestriction).toBe(
            false
        );
    });

    it('uses overrides for traits whose icon is named differently', () => {
        expect(getObjectiveDisplay({ ObjectiveType: 'NotTrait', ObjectiveTarget: 'Psyker' }).iconKey).toBe(
            'traitPsychic'
        );
    });

    it('falls back to the id when l10n has no name', () => {
        expect(getObjectiveDisplay({ ObjectiveType: 'NotDamageType', ObjectiveTarget: 'Pulse' }).label).toBe(
            'No Pulse'
        );
    });
});
