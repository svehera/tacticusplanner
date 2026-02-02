/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { cloneDeep, sum } from 'lodash';

import { TacticusLegendaryEventLane, TacticusLegendaryEventProgress } from '@/fsd/5-shared/lib';

import { LegendaryEventEnum } from '@/fsd/4-entities/lre/@x/character';

import { ILegendaryEventTrack, RequirementStatus } from '@/fsd/3-features/lre';
import { LegendaryEventBase } from '@/fsd/3-features/lre/model/base.le';

import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILeProgress, ILreBattleProgress, ILreProgressModel, ILreTrackProgress } from './lre.models';

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

    // The total number of shards that were claimed from chests and "Oh So Close" combined.
    currentTotalShards: number;
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
        const totalPoints = model.syncedProgress?.currentPoints ?? sum(model.tracksProgress.map(x => x.totalPoints));
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
            currentPoints: model.syncedProgress?.currentPoints ?? currentPoints,
            pointsForNextMilestone,
            totalPoints,
            averageBattles,

            currentCurrency,
            currencyForNextMilestone,
            totalCurrency,

            currentChests,
            chestsForNextGoal,
            totalChests: model.chestsMilestones.length,

            currentTotalShards: currentShards,
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

    /** Maps a unit's snowprintId to the planner internal ID for legendary events. */
    public static mapEventId(charId: string): LegendaryEventEnum | undefined {
        switch (charId) {
            case 'bloodDante':
                return LegendaryEventEnum.Dante;
            case 'custoTrajann':
                return LegendaryEventEnum.Trajann;
            case 'emperLucius':
                return LegendaryEventEnum.Lucius;
            case 'tauFarsight':
                return LegendaryEventEnum.Farsight;
            default:
                return undefined;
        }
    }

    /**
     * Verifies that the static data in the planner and the configuration from the external source
     * are consistent. Throws an error if there are any issues.
     */
    private static verifyExternalData(
        event: LegendaryEventBase,
        externalData: TacticusLegendaryEventProgress,
        currentModel: ILreProgressModel
    ): void {
        const lanes = [
            { id: 1, plannerName: 'alpha', displayName: 'Alpha', track: event.alpha },
            { id: 2, plannerName: 'beta', displayName: 'Beta', track: event.beta },
            { id: 3, plannerName: 'gamma', displayName: 'Gamma', track: event.gamma },
        ];
        const externalId = this.mapEventId(externalData.id);
        if (externalId === undefined) throw new Error('Unknown Legendary Event character ID: ' + externalData.id);
        if (externalId !== currentModel.eventId) {
            throw new Error(
                `Mismatched Legendary Event ID. External: ${externalData.id} (${externalId}), ` +
                    `Current Model: ${currentModel.eventName} (${currentModel.eventId}).`
            );
        }
        lanes.forEach(lane => {
            const externalTrack = externalData.lanes.find(x => x.id === lane.id);
            if (externalTrack === undefined) {
                throw new Error('Unsupported Legendary Event data: Could not find ' + lane.displayName + ' Track.');
            }
            if (externalTrack.name !== lane.displayName) {
                throw new Error(
                    `Mismatched Legendary Event Track name for ${lane.displayName}. External: ` +
                        `${externalTrack.name}, Expected: ${lane.displayName}.`
                );
            }
            const track = currentModel.tracksProgress.find(x => x.trackId === lane.plannerName);
            if (track === undefined) {
                throw new Error('Corrupt Planner Legendary Event: Could not find ' + lane.plannerName + ' Track.');
            }
            if (track.battles.length < externalTrack?.progress.length) {
                throw new Error(
                    `Mismatched number of battles for ${lane.displayName} Track. External ` +
                        `(${externalTrack?.progress.length}) should be <= Planner Model (${track.battles.length}).`
                );
            }

            if (!externalTrack.battleConfigs || externalTrack.battleConfigs.length === 0) {
                throw new Error(
                    'Unsupported Legendary Event data: ' + lane.displayName + ' Track has no battle configs.'
                );
            }
            externalTrack.battleConfigs.forEach(externalBattleConfig => {
                externalBattleConfig.objectives.forEach(externalObjective => {
                    // Acing objectives are called something different in the planner.
                    if (externalObjective.objectiveType === 'Acing') return;
                    const requirement = lane.track.unitsRestrictions.find(
                        x =>
                            x.objectiveTarget === externalObjective.objectiveTarget &&
                            x.objectiveType === externalObjective.objectiveType
                    );
                    if (requirement === undefined) {
                        throw new Error(
                            `Unsupported Legendary Event data: Could not find planner data that matches requirement ` +
                                `objectiveType=${externalObjective.objectiveType} - objectiveTarget=${externalObjective.objectiveTarget} ` +
                                `in ${lane.displayName} Track.`
                        );
                    }
                    if (requirement.points !== externalObjective.score) {
                        throw new Error(
                            `Mismatched Legendary Event points for objectiveType=${externalObjective.objectiveType} - ` +
                                `objectiveTarget=${externalObjective.objectiveTarget} in ${lane.displayName} Track. ` +
                                `External (${externalObjective.score}) vs Planner (${requirement.points}).`
                        );
                    }
                });
            });
            externalTrack.progress.forEach(progress => {
                if (progress.objectivesCleared.length > 6) {
                    throw new Error(
                        `Unsupported Legendary Event data: More than 6 objectives cleared in a single battle in ` +
                            `${lane.displayName} Track. Expected at most the clear score (Acing) and five restrictions.`
                    );
                }
                progress.objectivesCleared.forEach(objectiveCleared => {
                    if (objectiveCleared < 0 || objectiveCleared > 5) {
                        throw new Error('Invalid index in objectivesCleared: ' + objectiveCleared);
                    }
                });
            });
        });
        if (externalData.currentCurrency < 0) {
            throw new Error('Invalid current currency in Legendary Event data: ' + externalData.currentCurrency);
        }
        if (externalData.currentPoints < 0) {
            throw new Error('Invalid current points in Legendary Event data: ' + externalData.currentPoints);
        }
        if (externalData.currentShards < 0) {
            throw new Error('Invalid current shards in Legendary Event data: ' + externalData.currentShards);
        }
        if ((externalData.currentClaimedChestIndex ?? 0) < 0) {
            throw new Error(
                'Invalid current claimed chest index in Legendary Event data: ' + externalData.currentClaimedChestIndex
            );
        }
    }

    /**
     * Syncs partial killScore and highScore from external API data to battle requirements.
     */
    private static syncPartialScores(battle: ILreBattleProgress, encounterPoints: number, highScore: number): void {
        // _killPoints
        const killPointsProgress = battle.requirementsProgress.find(x => x.id === '_killPoints')!;
        killPointsProgress.killScore = encounterPoints;
        if (killPointsProgress.killScore >= killPointsProgress.points) {
            killPointsProgress.completed = true;
            killPointsProgress.blocked = false;
            killPointsProgress.status = RequirementStatus.Cleared;
        } else if (killPointsProgress.killScore > 0) {
            killPointsProgress.completed = false;
            killPointsProgress.blocked = false;
            killPointsProgress.status = RequirementStatus.PartiallyCleared;
        }

        // _highScore
        const highScoreProgress = battle.requirementsProgress.find(x => x.id === '_highScore')!;
        highScoreProgress.highScore = highScore;
        if (highScoreProgress.highScore >= highScoreProgress.points) {
            highScoreProgress.completed = true;
            highScoreProgress.blocked = false;
            highScoreProgress.status = RequirementStatus.Cleared;
        } else if (highScoreProgress.highScore > 0) {
            highScoreProgress.completed = false;
            highScoreProgress.blocked = false;
            highScoreProgress.status = RequirementStatus.PartiallyCleared;
        }
    }

    /**
     * Converts the progress of a track (lane) from an external source into the planner's internal
     * model.
     */
    private static convertLaneToTrack(
        eventId: LegendaryEventEnum,
        eventTrack: ILegendaryEventTrack,
        externalTrack: TacticusLegendaryEventLane,
        track: ILreTrackProgress
    ): ILreTrackProgress {
        if (!externalTrack) {
            throw new Error('Cannot convert undefined external track data.');
        }
        // Maps the restriction index in the external data to the requirement index in the planner
        // model.
        const restrictionIndexMap: Record<number, number> = {};

        externalTrack.battleConfigs[0].objectives.forEach((objective, index) => {
            if (objective.objectiveType === 'Acing') return;
            const req = eventTrack.unitsRestrictions.find(
                x => x.objectiveTarget === objective.objectiveTarget && x.objectiveType === objective.objectiveType
            );
            if (req === undefined) {
                throw new Error(
                    `Cannot find requirement for objectiveType=${objective.objectiveType} - ` +
                        `objectiveTarget=${objective.objectiveTarget} in track ${eventTrack.name}.`
                );
            }
            const reqIndex = track.requirements.findIndex(x => x.id === req.name);
            if (reqIndex === -1) {
                throw new Error(
                    `Cannot find requirement index for ID ${req.name} in track ${eventTrack.name} of event ${eventId}.`
                );
            }
            restrictionIndexMap[index] = reqIndex;
        });

        const ret = cloneDeep(track);

        ret.battles.forEach(battle => {
            battle.completed = false;
            battle.totalPoints = 0;
            battle.requirementsProgress.forEach(reqProgress => {
                reqProgress.completed = false;
                reqProgress.highScore = undefined;
                reqProgress.killScore = undefined;
                reqProgress.blocked = false;
                if (
                    reqProgress.status !== RequirementStatus.MaybeClear &&
                    reqProgress.status !== RequirementStatus.StopHere
                ) {
                    reqProgress.status = RequirementStatus.NotCleared;
                }
            });
        });

        externalTrack.progress.forEach((progress, battleIndex) => {
            const battle = ret.battles.find(b => b.battleIndex === battleIndex);
            if (battle === undefined) {
                throw new Error('Cannot find battle index ' + battleIndex + ' in track ' + eventTrack.name);
            }

            // Handle case where no objectives are cleared - only sync partial scores
            if (progress.objectivesCleared.length === 0) {
                this.syncPartialScores(battle, progress.encounterPoints, progress.highScore);
                return;
            }

            // Handle case where all 6 objectives are cleared
            if (progress.objectivesCleared.length === 6) {
                battle.completed = true;
                battle.totalPoints = sum(battle.requirementsProgress.map(req => req.points));
                battle.requirementsProgress.forEach(reqProgress => {
                    reqProgress.completed = true;
                    reqProgress.blocked = false;
                    reqProgress.status = RequirementStatus.Cleared;
                });
                return;
            }

            // Handle case where defeatAll is cleared
            if (progress.objectivesCleared.includes(0)) {
                ['_defeatAll', '_killPoints', '_highScore'].forEach(reqId => {
                    const reqProgress = battle.requirementsProgress.find(x => x.id === reqId)!;
                    reqProgress.completed = true;
                    reqProgress.blocked = false;
                    reqProgress.status = RequirementStatus.Cleared;
                    reqProgress.killScore = undefined;
                    reqProgress.highScore = undefined;
                    battle.totalPoints += reqProgress.points;
                });
            } else {
                // If defeatAll not cleared, sync partial scores
                this.syncPartialScores(battle, progress.encounterPoints, progress.highScore);
            }
            progress.objectivesCleared.forEach(objectiveIndex => {
                if (objectiveIndex === 0) return; // Handled above
                const reqIndex = restrictionIndexMap[objectiveIndex];
                const reqProgress = battle.requirementsProgress[reqIndex];
                if (reqProgress === undefined) {
                    console.error(battle);
                    throw new Error(
                        `Cannot find requirement progress for objective index ${objectiveIndex} in battle ` +
                            `${battleIndex} of track ${eventTrack.name} in event ${eventId}.`
                    );
                }
                reqProgress.completed = true;
                reqProgress.blocked = false;
                reqProgress.status = RequirementStatus.Cleared;
                battle.totalPoints += reqProgress.points;
            });
        });

        return ret;
    }

    /**
     * Converts external Legendary Event progress data into the planner's internal model. Throws
     * an error if there are any inconsistencies in the planner's static data and the configuration
     * of the external source.
     */
    public static convertExternalProgress(
        event: LegendaryEventBase,
        externalData: TacticusLegendaryEventProgress,
        currentModel: ILreProgressModel
    ): ILreProgressModel {
        this.verifyExternalData(event, externalData, currentModel);
        const model = {
            ...currentModel,
            tracksProgress: [] as ILreTrackProgress[],
            syncedProgress: {
                lastUpdateMillisUtc: Date.now(),
                hasUsedAdForExtraTokenToday: externalData.currentEvent?.hasUsedAdForExtraTokenToday ?? false,
                currentTokens: externalData.currentEvent?.tokens.current ?? 0,
                maxTokens: externalData.currentEvent?.tokens.max ?? 12,
                currentClaimedChestIndex: externalData.currentClaimedChestIndex ?? -1,
                nextTokenMillisUtc: externalData.currentEvent
                    ? Date.now() + externalData.currentEvent?.tokens.nextTokenInSeconds * 1000
                    : Date.now() + 3600 * 3 * 1000,
                regenDelayInSeconds: externalData.currentEvent?.tokens.regenDelayInSeconds ?? 3600 * 3,
                currentPoints: externalData.currentPoints,
                currentCurrency: externalData.currentCurrency,
                currentShards: externalData.currentShards,
                hasPremiumPayout: !!(externalData.currentEvent?.extraCurrencyPerPayout ?? false),
            } as ILeProgress,
        } as ILreProgressModel;

        model.tracksProgress = [
            this.convertLaneToTrack(
                event.id,
                event.alpha,
                externalData.lanes.find(x => x.id === 1)!,
                currentModel.tracksProgress.find(x => x.trackId === 'alpha')!
            ),
            this.convertLaneToTrack(
                event.id,
                event.beta,
                externalData.lanes.find(x => x.id === 2)!,
                currentModel.tracksProgress.find(x => x.trackId === 'beta')!
            ),
            this.convertLaneToTrack(
                event.id,
                event.gamma,
                externalData.lanes.find(x => x.id === 3)!,
                currentModel.tracksProgress.find(x => x.trackId === 'gamma')!
            ),
        ];

        return model;
    }
}
