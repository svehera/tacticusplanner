import { Info as InfoIcon } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { sum } from 'lodash';
import React, { useMemo } from 'react';

import { RequirementStatus } from '@/fsd/3-features/lre';
import { LrePointsCategoryId } from '@/fsd/3-features/lre-progress';

import { ILreProgressModel, ILreTrackProgress } from './lre.models';

interface Props {
    model: ILreProgressModel;
}

export const LeNextGoalProgress: React.FC<Props> = ({ model }) => {
    const totalPoints = useMemo(() => {
        return sum(model.tracksProgress.map(x => x.totalPoints));
    }, []);

    const totalCurrency = useMemo(() => {
        return sum(model.pointsMilestones.map(x => x.engramPayout));
    }, []);

    const totalChests = useMemo(() => {
        return model.chestsMilestones.length;
    }, []);

    // Helper to get points from a requirement, accounting for partial kill scores
    const getRequirementPoints = (req: {
        completed: boolean;
        status?: number;
        killScore?: number;
        points: number;
        id: string;
    }) => {
        // Check if new status system is being used
        if (req.status !== undefined) {
            const status = req.status as RequirementStatus;

            // Only Cleared and PartiallyCleared contribute points
            if (status === RequirementStatus.Cleared) {
                return req.points;
            }
            if (
                status === RequirementStatus.PartiallyCleared &&
                req.id === LrePointsCategoryId.killScore &&
                req.killScore
            ) {
                return req.killScore;
            }
            return 0;
        }

        // Legacy: use completed flag
        return req.completed ? req.points : 0;
    };

    const getCurrentPoints = (track: ILreTrackProgress) => {
        return sum(track.battles.flatMap(x => x.requirementsProgress).map(req => getRequirementPoints(req)));
    };

    const currentPoints = sum(model.tracksProgress.map(getCurrentPoints));

    const premiumMissions = sum(model.occurrenceProgress.map(x => x.premiumMissionsProgress));

    const regularMissions = sum(model.occurrenceProgress.map(x => x.freeMissionsProgress));

    const getCurrencyPerMission = (premiumMissionsCount: number) => {
        const hasPremiumQuests = premiumMissionsCount > 0;

        return hasPremiumQuests ? 25 + 15 : 25;
    };

    const getMissionsCurrency = (missions: number, premiumMissionsCount: number) => {
        return missions * getCurrencyPerMission(premiumMissionsCount);
    };

    const regularMissionsCurrency = useMemo(() => {
        return sum(
            model.occurrenceProgress.map(x => getMissionsCurrency(x.freeMissionsProgress, x.premiumMissionsProgress))
        );
    }, [regularMissions, premiumMissions]);

    const premiumMissionsCurrency = useMemo(() => {
        return sum(
            model.occurrenceProgress.map(x => getMissionsCurrency(x.premiumMissionsProgress, x.premiumMissionsProgress))
        );
    }, [premiumMissions]);

    const getBundleCurrency = (bundle: number, premiumMissionsCount: number) => {
        const additionalPayout = premiumMissionsCount > 0 ? 15 : 0;
        return bundle ? bundle * 300 + additionalPayout : 0;
    };

    const bundleCurrency = sum(
        model.occurrenceProgress.map(x => getBundleCurrency(+x.bundlePurchased, x.premiumMissionsProgress))
    );

    const currentCurrency = useMemo(() => {
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
    }, [currentPoints, regularMissionsCurrency, premiumMissionsCurrency, bundleCurrency]);

    const currentChests = useMemo(() => {
        let currencyLeft = currentCurrency;

        for (const chestMilestone of model.chestsMilestones) {
            if (currencyLeft >= chestMilestone.engramCost) {
                currencyLeft -= chestMilestone.engramCost;
            } else {
                return chestMilestone.chestLevel - 1;
            }
        }

        return model.chestsMilestones.length;
    }, [currentCurrency]);

    const chestsForUnlock = model.progression.unlock / model.shardsPerChest;
    const chestsFor4Stars = (model.progression.unlock + model.progression.fourStars) / model.shardsPerChest;
    const chestsFor5Stars =
        (model.progression.unlock + model.progression.fourStars + model.progression.fiveStars) / model.shardsPerChest;
    const chestsForBlueStar =
        (model.progression.unlock +
            model.progression.fourStars +
            model.progression.fiveStars +
            model.progression.blueStar) /
        model.shardsPerChest;
    const chestsForMythic =
        (model.progression.unlock +
            model.progression.fourStars +
            model.progression.fiveStars +
            model.progression.blueStar +
            // If we don't have info for mythic, we assume it's unattainable.
            (model.progression.mythic ?? Infinity)) /
        model.shardsPerChest;
    const chestsForTwoBlueStars =
        (model.progression.unlock +
            model.progression.fourStars +
            model.progression.fiveStars +
            model.progression.blueStar +
            // If we don't have info for mythic, we assume it's unattainable.
            (model.progression.mythic ?? Infinity) +
            (model.progression.twoBlueStars ?? Infinity)) /
        model.shardsPerChest;

    const chestsForNextGoal = useMemo(() => {
        if (currentChests < chestsForUnlock) {
            return Math.ceil(chestsForUnlock);
        } else if (currentChests < chestsFor4Stars) {
            return Math.ceil(chestsFor4Stars);
        } else if (currentChests < chestsFor5Stars) {
            return Math.ceil(chestsFor5Stars);
        } else if (currentChests < chestsForBlueStar) {
            return Math.ceil(chestsForBlueStar);
        } else if (currentChests < chestsForMythic) {
            return Math.ceil(chestsForMythic);
        }
        return Math.ceil(chestsForTwoBlueStars);
    }, [currentChests]);

    const goal = (function () {
        if (currentChests < chestsForUnlock) {
            return 'unlock';
        } else if (currentChests < chestsFor4Stars) {
            return '4 stars';
        } else if (currentChests < chestsFor5Stars) {
            return '5 stars';
        } else if (currentChests < chestsForBlueStar) {
            return 'blue star';
        } else if (currentChests < chestsForMythic) {
            if (chestsForMythic === Infinity) {
                return 'full clear';
            }
            return 'mythic';
        }
        return 'two blue stars';
    })();

    const currencyForNextMilestone = useMemo(() => {
        return model.chestsMilestones
            .filter(x => x.chestLevel <= chestsForNextGoal)
            .map(x => x.engramCost)
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    }, [chestsForNextGoal]);

    const pointsForNextMilestone = useMemo(() => {
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
    }, [currencyForNextMilestone, regularMissionsCurrency, premiumMissionsCurrency, bundleCurrency]);

    const averageBattles = useMemo(() => {
        return (pointsForNextMilestone / 3 / 500).toFixed(2);
    }, [pointsForNextMilestone]);

    return (
        <div className="flex-box wrap gap15 m-2.5">
            <div className="flex gap-[5px]">
                Deed Points to {goal}:
                <span className="font-bold">
                    {currentPoints} / {pointsForNextMilestone}
                </span>
                <Tooltip title={totalPoints + ' in total. Battles per track: ' + averageBattles}>
                    <InfoIcon />
                </Tooltip>
            </div>

            <div className="flex gap-[5px]">
                Currency to {goal}:
                <span className="font-bold">
                    {' '}
                    {currentCurrency} / {currencyForNextMilestone}
                </span>
                <Tooltip title={totalCurrency + ' in total'}>
                    <InfoIcon />
                </Tooltip>
            </div>

            <div className="flex gap-[5px]">
                Shards to {goal}:
                <span className="font-bold">
                    {' '}
                    {currentChests * model.shardsPerChest} / {chestsForNextGoal * model.shardsPerChest}
                </span>
                <Tooltip title={totalChests + ' in total'}>
                    <InfoIcon />
                </Tooltip>
            </div>
        </div>
    );
};
