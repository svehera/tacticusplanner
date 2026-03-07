import { Rarity, RarityStars } from '@/fsd/5-shared/model';

interface UpgradeStep {
    nextRarity: Rarity;
    nextStars: RarityStars;
    cost: number;
    orbType: Rarity;
}

export class OrbAscensionCalculator {
    private static readonly UPGRADE_PATH: Record<string, UpgradeStep> = {
        [Rarity.Common + ':' + RarityStars.None]: {
            nextRarity: Rarity.Common,
            nextStars: RarityStars.OneStar,
            cost: 0,
            orbType: Rarity.Common,
        },
        [Rarity.Common + ':' + RarityStars.OneStar]: {
            nextRarity: Rarity.Common,
            nextStars: RarityStars.TwoStars,
            cost: 0,
            orbType: Rarity.Common,
        },
        [Rarity.Common + ':' + RarityStars.TwoStars]: {
            nextRarity: Rarity.Uncommon,
            nextStars: RarityStars.TwoStars,
            cost: 10,
            orbType: Rarity.Uncommon,
        },
        [Rarity.Uncommon + ':' + RarityStars.TwoStars]: {
            nextRarity: Rarity.Uncommon,
            nextStars: RarityStars.ThreeStars,
            cost: 0,
            orbType: Rarity.Uncommon,
        },
        [Rarity.Uncommon + ':' + RarityStars.ThreeStars]: {
            nextRarity: Rarity.Uncommon,
            nextStars: RarityStars.FourStars,
            cost: 0,
            orbType: Rarity.Uncommon,
        },
        [Rarity.Uncommon + ':' + RarityStars.FourStars]: {
            nextRarity: Rarity.Rare,
            nextStars: RarityStars.FourStars,
            cost: 10,
            orbType: Rarity.Rare,
        },
        [Rarity.Rare + ':' + RarityStars.FourStars]: {
            nextRarity: Rarity.Rare,
            nextStars: RarityStars.FiveStars,
            cost: 0,
            orbType: Rarity.Rare,
        },
        [Rarity.Rare + ':' + RarityStars.FiveStars]: {
            nextRarity: Rarity.Rare,
            nextStars: RarityStars.RedOneStar,
            cost: 0,
            orbType: Rarity.Rare,
        },
        [Rarity.Rare + ':' + RarityStars.RedOneStar]: {
            nextRarity: Rarity.Epic,
            nextStars: RarityStars.RedOneStar,
            cost: 10,
            orbType: Rarity.Epic,
        },
        [Rarity.Epic + ':' + RarityStars.RedOneStar]: {
            nextRarity: Rarity.Epic,
            nextStars: RarityStars.RedTwoStars,
            cost: 0,
            orbType: Rarity.Epic,
        },
        [Rarity.Epic + ':' + RarityStars.RedTwoStars]: {
            nextRarity: Rarity.Epic,
            nextStars: RarityStars.RedThreeStars,
            cost: 0,
            orbType: Rarity.Epic,
        },
        [Rarity.Epic + ':' + RarityStars.RedThreeStars]: {
            nextRarity: Rarity.Legendary,
            nextStars: RarityStars.RedThreeStars,
            cost: 10,
            orbType: Rarity.Legendary,
        },
        [Rarity.Legendary + ':' + RarityStars.RedThreeStars]: {
            nextRarity: Rarity.Legendary,
            nextStars: RarityStars.RedFourStars,
            cost: 10,
            orbType: Rarity.Legendary,
        },
        [Rarity.Legendary + ':' + RarityStars.RedFourStars]: {
            nextRarity: Rarity.Legendary,
            nextStars: RarityStars.RedFiveStars,
            cost: 15,
            orbType: Rarity.Legendary,
        },
        [Rarity.Legendary + ':' + RarityStars.RedFiveStars]: {
            nextRarity: Rarity.Legendary,
            nextStars: RarityStars.OneBlueStar,
            cost: 20,
            orbType: Rarity.Legendary,
        },
        [Rarity.Legendary + ':' + RarityStars.OneBlueStar]: {
            nextRarity: Rarity.Mythic,
            nextStars: RarityStars.OneBlueStar,
            cost: 10,
            orbType: Rarity.Mythic,
        },
        [Rarity.Mythic + ':' + RarityStars.OneBlueStar]: {
            nextRarity: Rarity.Mythic,
            nextStars: RarityStars.TwoBlueStars,
            cost: 10,
            orbType: Rarity.Mythic,
        },
        [Rarity.Mythic + ':' + RarityStars.TwoBlueStars]: {
            nextRarity: Rarity.Mythic,
            nextStars: RarityStars.ThreeBlueStars,
            cost: 15,
            orbType: Rarity.Mythic,
        },
        [Rarity.Mythic + ':' + RarityStars.ThreeBlueStars]: {
            nextRarity: Rarity.Mythic,
            nextStars: RarityStars.MythicWings,
            cost: 25,
            orbType: Rarity.Mythic,
        },
        [Rarity.Mythic + ':' + RarityStars.MythicWings]: {
            nextRarity: Rarity.Mythic,
            nextStars: RarityStars.MythicWings,
            cost: 0,
            orbType: Rarity.Mythic,
        },
    };

    private static _getNextStep(rarity: Rarity, stars: RarityStars): UpgradeStep | undefined {
        const key = `${rarity}:${stars}`;
        const step = OrbAscensionCalculator.UPGRADE_PATH[key];

        if (!step) {
            // We've reached a state with no further upgrade defined. This typically
            // happens when the unit is at Mythic Wings or the final star for its
            // rarity. Instead of throwing, stop processing and return what we have.
            console.warn(`Reached terminal state in orb path: ${key}. Ending calculation.`);
            return undefined;
        }
        if (step.nextRarity === rarity && step.nextStars === stars) {
            console.warn(`Non-progressing orb path step at: ${key}. Ending calculation.`);
            return undefined;
        }

        return step;
    }

    private static createEmptyOrbTotals(): Record<Rarity, number> {
        return {
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 0,
            [Rarity.Rare]: 0,
            [Rarity.Epic]: 0,
            [Rarity.Legendary]: 0,
            [Rarity.Mythic]: 0,
        };
    }

    public static calculate(
        startRarity: Rarity,
        startStars: RarityStars,
        endRarity: Rarity,
        endStars: RarityStars
    ): Record<Rarity, number> {
        const totals = OrbAscensionCalculator.createEmptyOrbTotals();

        // If already at or beyond target, no orbs needed
        if (startRarity > endRarity || (startRarity === endRarity && startStars >= endStars)) {
            return totals;
        }

        let rarity: Rarity = startRarity;
        let stars: RarityStars = startStars;

        while (!(rarity === endRarity && stars === endStars)) {
            const step = this._getNextStep(rarity, stars);

            if (!step) {
                break;
            }

            totals[step.orbType] += step.cost;

            rarity = step.nextRarity;
            stars = step.nextStars;
        }
        return totals;
    }
}
