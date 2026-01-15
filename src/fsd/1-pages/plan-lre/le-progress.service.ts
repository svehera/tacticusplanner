import { sum } from 'lodash';

import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreProgressModel, ILreTrackProgress } from './lre.models';

export interface LeProgress {
    currentPoints: number;
    pointsForNextMilestone: number;
    totalPoints: number;
    averageBattles: string;

    currentCurrency: number;
    currencyForNextMilestone: number;
    totalCurrency: number;

    currentChests: number;
    chestsForNextGoal: number;
    totalChests: number;

    // The number of shards towards the next goal. E.g. 0 (out of 400)), 50 (out of 180).
    incrementalShards: number;
    // The number of shards to reach the next goal starting from the previous goal. E.g. 400 (to
    // reach unlock), 180 (to reach 5 stars).
    incrementalShardsGoal: number;

    goal: string;
}

interface ShardsGoal {
    goal: string;
    currentShards: number;
    requiredShards: number;
    currentIncrementalShards: number;
    requiredIncrementalShards: number;
}

export class LeProgressService {
    static computeProgress(model: ILreProgressModel, useP2P: boolean): LeProgress {
        const totalPoints = sum(model.tracksProgress.map(x => x.totalPoints));
        const totalCurrency = sum(model.pointsMilestones.map(x => x.engramPayout));
        const currentPoints = sum(model.tracksProgress.map(this.computeCurrentPoints));

        const premiumMissions = useP2P ? sum(model.occurrenceProgress.map(x => x.premiumMissionsProgress)) : 0;

        const currencyPerMission = premiumMissions > 0 ? 25 + 15 : 25;
        const regularMissionsCurrency = sum(
            model.occurrenceProgress.map(x => x.freeMissionsProgress * currencyPerMission)
        );
        const premiumMissionsCurrency = sum(
            model.occurrenceProgress.map(x => x.premiumMissionsProgress * currencyPerMission)
        );

        const bundleCurrency = useP2P
            ? sum(
                  model.occurrenceProgress.map(x =>
                      this.getBundleCurrency(+x.bundlePurchased, x.premiumMissionsProgress)
                  )
              )
            : 0;

        const currentCurrency = this.computeCurrentCurrency(
            model,
            currentPoints,
            premiumMissionsCurrency,
            regularMissionsCurrency,
            bundleCurrency
        );

        const currentChests = this.computeCurrentChests(model, currentCurrency);

        const ohSoCloseShards = model.occurrenceProgress.reduce((acc, x) => acc + x.ohSoCloseShards, 0);

        const currentShards = currentChests * 25 + ohSoCloseShards;

        const chestsForNextGoal = this.computeChestsForNextGoal(model, currentShards, ohSoCloseShards);

        const goal = this.computeCurrentGoal(model, currentShards);

        const currencyForNextMilestone = this.computeCurrencyForNextMilestone(model, chestsForNextGoal);

        const pointsForNextMilestone = this.computePointsForNextMilestone(
            model,
            currencyForNextMilestone,
            regularMissionsCurrency,
            premiumMissionsCurrency,
            bundleCurrency,
            premiumMissions
        );

        const averageBattles = this.computeAverageBattles(pointsForNextMilestone);

        return {
            currentPoints,
            pointsForNextMilestone,
            totalPoints,
            averageBattles,

            currentCurrency,
            currencyForNextMilestone,
            totalCurrency,

            currentChests,
            chestsForNextGoal,
            totalChests: model.chestsMilestones.length,

            incrementalShards: goal.currentIncrementalShards,
            incrementalShardsGoal: goal.requiredIncrementalShards,

            goal: goal.goal,
        };
    }

    private static computeCurrentPoints(track: ILreTrackProgress): number {
        return sum(
            track.battles
                .flatMap(x => x.requirementsProgress)
                .map(req => LreRequirementStatusService.getRequirementPoints(req))
        );
    }

    private static getBundleCurrency(bundle: number, premiumMissionsCount: number): number {
        const additionalPayout = premiumMissionsCount > 0 ? 15 : 0;
        return bundle ? bundle * 300 + additionalPayout : 0;
    }

    private static computeCurrentCurrency(
        model: ILreProgressModel,
        currentPoints: number,
        premiumMissionsCurrency: number,
        regularMissionsCurrency: number,
        bundleCurrency: number
    ): number {
        const currentMilestone = model.pointsMilestones.find(x => x.cumulativePoints >= currentPoints);
        if (!currentMilestone) {
            return 0;
        }

        const milestoneNumber =
            currentMilestone.cumulativePoints > currentPoints
                ? currentMilestone.milestone - 1
                : currentMilestone.milestone;

        const pointsCurrency = model.pointsMilestones
            .filter(x => x.milestone <= milestoneNumber)
            .map(x => x.engramPayout + (premiumMissionsCurrency > 0 ? 15 : 0))
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

        return pointsCurrency + regularMissionsCurrency + premiumMissionsCurrency + bundleCurrency;
    }

    private static computeCurrentChests(model: ILreProgressModel, currentCurrency: number): number {
        let currencyLeft = currentCurrency;

        for (const chestMilestone of model.chestsMilestones) {
            if (currencyLeft >= chestMilestone.engramCost) {
                currencyLeft -= chestMilestone.engramCost;
            } else {
                return chestMilestone.chestLevel - 1;
            }
        }

        return model.chestsMilestones.length;
    }
    private static getShardThresholds(progression: ILreProgressModel['progression']) {
        const shardsForUnlock = progression.unlock;
        const shardsFor4Stars = shardsForUnlock + progression.fourStars;
        const shardsFor5Stars = shardsFor4Stars + progression.fiveStars;
        const shardsForBlueStar = shardsFor5Stars + progression.blueStar;
        const shardsForMythic = shardsForBlueStar + (progression.mythic ?? Infinity);
        const shardsForTwoBlueStars = shardsForMythic + (progression.twoBlueStars ?? Infinity);

        return [
            { threshold: shardsForUnlock, name: 'unlock' },
            { threshold: shardsFor4Stars, name: '4 stars' },
            { threshold: shardsFor5Stars, name: '5 stars' },
            { threshold: shardsForBlueStar, name: 'blue star' },
            { threshold: shardsForMythic, name: 'mythic' },
            { threshold: shardsForTwoBlueStars, name: 'two blue stars' },
        ];
    }

    private static computeChestsForNextGoal(
        model: ILreProgressModel,
        currentShards: number,
        ohSoCloseShards: number
    ): number {
        const shardThresholds = this.getShardThresholds(model.progression);

        for (const goal of shardThresholds) {
            if (currentShards < goal.threshold) {
                if (goal.threshold === Infinity) {
                    break;
                }
                return Math.ceil((goal.threshold - ohSoCloseShards) / model.shardsPerChest);
            }
        }

        return model.chestsMilestones.length;
    }

    private static computeCurrentGoal(model: ILreProgressModel, currentShards: number): ShardsGoal {
        const shardThresholds = this.getShardThresholds(model.progression);

        let prevThreshold = 0;
        for (const goal of shardThresholds) {
            if (currentShards < goal.threshold) {
                if (goal.threshold === Infinity) {
                    return {
                        goal: 'full clear',
                        currentShards: currentShards,
                        requiredShards: Infinity,
                        currentIncrementalShards: currentShards - prevThreshold,
                        requiredIncrementalShards: Infinity,
                    };
                }
                return {
                    goal: goal.name,
                    currentShards: currentShards,
                    requiredShards: goal.threshold,
                    currentIncrementalShards: currentShards - prevThreshold,
                    requiredIncrementalShards: goal.threshold - prevThreshold,
                };
            }
            prevThreshold = goal.threshold;
        }
        return {
            goal: 'full clear',
            currentShards: currentShards,
            requiredShards: Infinity,
            currentIncrementalShards: currentShards - prevThreshold,
            requiredIncrementalShards: Infinity,
        };
    }

    private static computeCurrencyForNextMilestone(model: ILreProgressModel, chestsForNextGoal: number): number {
        return model.chestsMilestones
            .filter(x => x.chestLevel <= chestsForNextGoal)
            .map(x => x.engramCost)
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    }

    private static computePointsForNextMilestone(
        model: ILreProgressModel,
        currencyForNextMilestone: number,
        regularMissionsCurrency: number,
        premiumMissionsCurrency: number,
        bundleCurrency: number,
        premiumMissions: number
    ): number {
        const additionalPayout = premiumMissions > 0 ? 15 : 0;
        let currencyLeft =
            currencyForNextMilestone - regularMissionsCurrency - premiumMissionsCurrency - bundleCurrency;

        for (const chestMilestone of model.pointsMilestones) {
            currencyLeft -= chestMilestone.engramPayout + additionalPayout;
            if (currencyLeft <= 0) {
                return chestMilestone.cumulativePoints;
            }
        }

        return model.pointsMilestones[model.pointsMilestones.length - 1].cumulativePoints;
    }

    private static computeAverageBattles(pointsForNextMilestone: number): string {
        return (pointsForNextMilestone / 3 / 500).toFixed(2);
    }
}
