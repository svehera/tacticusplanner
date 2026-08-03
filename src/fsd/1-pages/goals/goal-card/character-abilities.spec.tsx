import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alliance, Rarity } from '@/fsd/5-shared/model';

import { PersonalGoalType } from '@/fsd/4-entities/goal';

import { ICharacterUpgradeAbilities, IGoalEstimate } from '@/fsd/3-features/goals';

import { GoalCardCharacterAbilities } from './character-abilities';

const goal = {
    type: PersonalGoalType.CharacterAbilities,
    goalId: 'goal-1',
    priority: 1,
    include: true,
    notes: '',
    unitId: 'unit-1',
    unitName: 'Unit',
    unitIcon: '',
    unitRoundIcon: '',
    unitAlliance: Alliance.Imperial,
    // Kept distinct from the level range below so the assertions can't match the ability blocks.
    activeStart: 3,
    activeEnd: 7,
    passiveStart: 3,
    passiveEnd: 3,
} as ICharacterUpgradeAbilities;

const estimate = (overrides: Partial<IGoalEstimate> = {}): IGoalEstimate => ({
    goalId: goal.goalId,
    daysLeft: 0,
    daysTotal: 0,
    energyTotal: 0,
    oTokensTotal: 0,
    xpBooksTotal: 0,
    ...overrides,
});

describe('GoalCardCharacterAbilities XP books row', () => {
    it('renders the XP-book row when the goal needs books', () => {
        render(
            <GoalCardCharacterAbilities
                goal={goal}
                bookRarity={Rarity.Legendary}
                goalEstimate={estimate({
                    xpBooksApplied: 3,
                    xpBooksRequired: 8,
                    // Ability goals carry xpEstimateAbilities, never xpEstimate.
                    xpEstimateAbilities: {
                        books: 5,
                        bookRarity: Rarity.Legendary,
                        gold: 2500,
                        currentLevel: 12,
                        targetLevel: 20,
                        xpLeft: 62_500,
                    },
                })}
            />
        );

        expect(screen.getByRole('progressbar', { name: 'Legendary XP Books' })).toBeTruthy();
        expect(screen.getByText('3 / 8')).toBeTruthy();
        // Level range comes from xpEstimateAbilities, not xpEstimate.
        expect(screen.getByText('12')).toBeTruthy();
        expect(screen.getByText('20')).toBeTruthy();
    });

    it('fills the meter by XP rather than by codex count', () => {
        render(
            <GoalCardCharacterAbilities
                goal={goal}
                bookRarity={Rarity.Legendary}
                goalEstimate={estimate({
                    // 24 000 of 25 000 XP covered, but only "1 of 2" codices — which would read 50%.
                    xpRequiredTotal: 25_000,
                    xpBooksApplied: 1,
                    xpBooksRequired: 2,
                    xpEstimateAbilities: {
                        books: 1,
                        bookRarity: Rarity.Legendary,
                        gold: 500,
                        currentLevel: 12,
                        targetLevel: 20,
                        xpLeft: 1000,
                    },
                })}
            />
        );

        const bar = screen.getByRole('progressbar', { name: 'Legendary XP Books' });
        expect(bar.getAttribute('aria-valuenow')).toBe('96');
        // Built via toLocaleString so the assertion doesn't depend on the runner's locale separator.
        expect(bar.getAttribute('aria-valuetext')).toBe(
            `${(24_000).toLocaleString()} of ${(25_000).toLocaleString()} XP`
        );
    });

    // A character already at the target ability level produces exactly this estimate: getLegendaryTomesCount
    // returns undefined, so _adjustGoalXp bails before assigning any book counts.
    it('renders no XP-book row when the estimate carries no XP-book data', () => {
        render(<GoalCardCharacterAbilities goal={goal} bookRarity={Rarity.Legendary} goalEstimate={estimate()} />);

        expect(screen.queryByRole('progressbar', { name: /XP Books/ })).toBeNull();
    });

    it('renders no XP-book row when the goal needs zero books', () => {
        render(
            <GoalCardCharacterAbilities
                goal={goal}
                bookRarity={Rarity.Legendary}
                goalEstimate={estimate({ xpBooksApplied: 0, xpBooksRequired: 0 })}
            />
        );

        expect(screen.queryByRole('progressbar', { name: /XP Books/ })).toBeNull();
    });
});
