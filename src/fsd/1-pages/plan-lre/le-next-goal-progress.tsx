import { Info as InfoIcon } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { sum } from 'lodash';
import React, { useContext, useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreProgressModel, ILreTrackProgress } from './lre.models';

interface Props {
    model: ILreProgressModel;
}

export const LeNextGoalProgress: React.FC<Props> = ({ model }) => {
    const { leSettings } = useContext(StoreContext);

    const totalPoints = useMemo(() => {
        return sum(model.tracksProgress.map(x => x.totalPoints));
    }, []);

    const totalCurrency = useMemo(() => {
        return sum(model.pointsMilestones.map(x => x.engramPayout));
    }, []);

    const totalChests = useMemo(() => {
        return model.chestsMilestones.length;
    }, []);

    const useP2P = leSettings.showP2POptions;

    const getCurrentPoints = (track: ILreTrackProgress) => {
        return sum(
            track.battles
                .flatMap(x => x.requirementsProgress)
                .map(req => LreRequirementStatusService.getRequirementPoints(req))
        );
    };

    const currentPoints = sum(model.tracksProgress.map(getCurrentPoints));

    const premiumMissions = useP2P ? sum(model.occurrenceProgress.map(x => x.premiumMissionsProgress)) : 0;

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
            model.occurrenceProgress.map(x =>
                getMissionsCurrency(x.freeMissionsProgress, useP2P ? x.premiumMissionsProgress : 0)
            )
        );
    }, [regularMissions, premiumMissions, useP2P]);

    const premiumMissionsCurrency = useMemo(() => {
        return sum(
            model.occurrenceProgress.map(x =>
                getMissionsCurrency(x.premiumMissionsProgress, useP2P ? x.premiumMissionsProgress : 0)
            )
        );
    }, [premiumMissions, useP2P]);

    const getBundleCurrency = (bundle: number, premiumMissionsCount: number) => {
        const additionalPayout = premiumMissionsCount > 0 ? 15 : 0;
        return bundle ? bundle * 300 + additionalPayout : 0;
    };

    const bundleCurrency = useP2P
        ? sum(model.occurrenceProgress.map(x => getBundleCurrency(+x.bundlePurchased, x.premiumMissionsProgress)))
        : 0;

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

    const shardsForUnlock = model.progression.unlock;
    const shardsFor4Stars = model.progression.unlock + model.progression.fourStars;
    const shardsFor5Stars = model.progression.unlock + model.progression.fourStars + model.progression.fiveStars;
    const shardsForBlueStar =
        model.progression.unlock +
        model.progression.fourStars +
        model.progression.fiveStars +
        model.progression.blueStar;
    const shardsForMythic =
        model.progression.unlock +
        model.progression.fourStars +
        model.progression.fiveStars +
        model.progression.blueStar +
        // If we don't have info for mythic, we assume it's unattainable.
        (model.progression.mythic ?? Infinity);
    const shardsForTwoBlueStars =
        model.progression.unlock +
        model.progression.fourStars +
        model.progression.fiveStars +
        model.progression.blueStar +
        // If we don't have info for mythic, we assume it's unattainable.
        (model.progression.mythic ?? Infinity) +
        (model.progression.twoBlueStars ?? Infinity);

    const ohSoCloseShards = model.occurrenceProgress.reduce((acc, x) => acc + x.ohSoCloseShards, 0);

    const currentShards = currentChests * 25 + ohSoCloseShards;

    const chestsForNextGoal = useMemo(() => {
        if (currentShards < shardsForUnlock) {
            return Math.ceil((shardsForUnlock - ohSoCloseShards) / model.shardsPerChest);
        } else if (currentShards < shardsFor4Stars) {
            return Math.ceil((shardsFor4Stars - ohSoCloseShards) / model.shardsPerChest);
        } else if (currentShards < shardsFor5Stars) {
            return Math.ceil((shardsFor5Stars - ohSoCloseShards) / model.shardsPerChest);
        } else if (currentShards < shardsForBlueStar) {
            return Math.ceil((shardsForBlueStar - ohSoCloseShards) / model.shardsPerChest);
        } else if (currentShards < shardsForMythic) {
            return Math.ceil((shardsForMythic - ohSoCloseShards) / model.shardsPerChest);
        } else if (currentShards < shardsForTwoBlueStars) {
            return Math.ceil((shardsForTwoBlueStars - ohSoCloseShards) / model.shardsPerChest);
        }
        return totalChests;
    }, [currentShards]);

    const goal = (function () {
        if (currentShards < shardsForUnlock) {
            return 'unlock';
        } else if (currentShards < shardsFor4Stars) {
            return '4 stars';
        } else if (currentShards < shardsFor5Stars) {
            return '5 stars';
        } else if (currentShards < shardsForBlueStar) {
            return 'blue star';
        } else if (currentShards < shardsForMythic) {
            if (shardsForMythic === Infinity) {
                return 'full clear';
            }
            return 'mythic';
        } else if (currentShards < shardsForTwoBlueStars) {
            if (shardsForTwoBlueStars === Infinity) {
                return 'full clear';
            }
            return 'two blue stars';
        }
        return 'full clear';
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
