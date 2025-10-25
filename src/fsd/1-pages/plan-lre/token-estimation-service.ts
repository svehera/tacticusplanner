import { cloneDeep } from 'lodash';

// eslint-disable-next-line import-x/no-internal-modules
import { ILreTeam } from '@/models/interfaces';

import { CharactersService } from '@/fsd/4-entities/character';

import { ILreBattleProgress, ILreRequirements, ILreTrackProgress } from './lre.models';

export class TokenUse {
    /**
     * The team for which we used this token. The track in which the
     * team is used is inside of `team`.
     */
    public team: ILreTeam | undefined = undefined;

    /**
     * The battle number for which this token is used. The first battle
     * in a track is battle zero.
     */
    public battleNumber: number = -1;

    /** The incremental points gained by using this token. */
    public incrementalPoints: number = -1;

    /** The restrictions/requirements that this token clears. */
    public restrictionsCleared: ILreRequirements[] = [];
}

/**
 * A type that represents positive integers (1, 2, 3, ...).
 * Unfortunately it doesn't work on object literals.
 * e.g. `const foo: PositiveInteger<number> = -1;` won't error
 * It does work with function signatures though.
 * e.g. `function test<T extends number>(n: PositiveInteger<T>) {}` will error
 * e.g. `test(-1);` will error
 * e.g. ` n = -1; test(n);` will error
 * Tbh it's mostly useful for documenting intent.
 *
 * @source https://mvasilkov.animuchan.net/typescript-positive-integer-type
 */
type PositiveInteger<T extends number> = `${T}` extends '0' | `-${any}` | `${any}.${any}` ? never : T;

/**
 * LE milestones such as 12,500 points for a first round unlock with no packs.
 */
type MilestoneAndPoints = {
    points: PositiveInteger<number>;
    stars:
        | 3
        | 4
        | 5
        | 6 // blue star
        | 7 // mythic
        | 8; // two blue stars
    round: 1 | 2 | 3;
    packsPerRound:
        | 0 // no packs
        | 1 // premium missions
        | 2; // currency pack
};

export const milestonesAndPoints: readonly MilestoneAndPoints[] = [
    { points: 100, stars: 3, round: 3, packsPerRound: 2 },
    { points: 6000, stars: 3, round: 3, packsPerRound: 1 },
    { points: 6500, stars: 3, round: 2, packsPerRound: 2 },
    { points: 9000, stars: 3, round: 2, packsPerRound: 1 },
    { points: 10000, stars: 3, round: 1, packsPerRound: 2 },
    { points: 11000, stars: 3, round: 1, packsPerRound: 1 },
    { points: 11500, stars: 3, round: 3, packsPerRound: 0 },
    { points: 12000, stars: 3, round: 2, packsPerRound: 0 },
    { points: 12500, stars: 3, round: 1, packsPerRound: 0 },
    { points: 14250, stars: 4, round: 3, packsPerRound: 0 },
    { points: 14500, stars: 4, round: 2, packsPerRound: 0 },
    { points: 14750, stars: 4, round: 1, packsPerRound: 0 },
    { points: 16250, stars: 5, round: 3, packsPerRound: 0 },
    { points: 16500, stars: 5, round: 1, packsPerRound: 0 },
    { points: 16750, stars: 6, round: 3, packsPerRound: 1 },
    { points: 18000, stars: 6, round: 3, packsPerRound: 0 },
    { points: 18250, stars: 6, round: 1, packsPerRound: 0 },
    { points: 22000, stars: 7, round: 3, packsPerRound: 2 },
    { points: 22500, stars: 7, round: 3, packsPerRound: 1 },
    { points: 23500, stars: 7, round: 1, packsPerRound: 0 },
    { points: 25500, stars: 8, round: 3, packsPerRound: 2 },
    { points: 25750, stars: 8, round: 3, packsPerRound: 1 },
    { points: 26750, stars: 8, round: 2, packsPerRound: 0 },
    { points: 27000, stars: 8, round: 1, packsPerRound: 0 },
];

/**
 * Computes or estimates various values related to tokenomics.
 */
export class TokenEstimationService {
    /** @returns the track played by the token. */
    static getTrack(token: TokenUse): string {
        if (token.team === undefined) {
            return '(null track)';
        }
        if (token.team.section === undefined) {
            return '(null track)';
        }
        return token.team.section;
    }

    /**
     * @returns a string representation of the restrictions cleared by the
     * token.
     */
    static getRestricts(token: TokenUse): string {
        if (token.restrictionsCleared === undefined) {
            return '';
        }
        return token.restrictionsCleared.map(x => x.id).join(',');
    }

    /**
     * @returns true if `token` is the same team in the same track with the
     * same restrictions as the team for `lastToken`, and the battle is one
     * battle further. This allows for "flow" during play, using the same team
     * repeatedly to push higher in a particular track.
     */
    static isTokenNextBattleWithTeam(token: TokenUse, lastToken: TokenUse | undefined): boolean {
        if (lastToken === undefined) return false;
        return (
            this.getTrack(token) === this.getTrack(lastToken) &&
            token.battleNumber === lastToken.battleNumber + 1 &&
            this.getRestricts(token) === this.getRestricts(lastToken)
        );
    }

    /**
     * @returns the index of the furthest milestone achieved with the number of
     * points. If no milestone has been achieved, returns -1.
     */
    public static getFurthestMilestoneAchieved(currentPoints: number): number {
        for (let i = milestonesAndPoints.length - 1; i >= 0; --i) {
            if (currentPoints >= milestonesAndPoints[i].points) {
                return i;
            }
        }
        return -1;
    }

    /**
     * @returns the team, track, and battle that should be used to gain the most
     * points with the next token. If all tracks are complete, returns a token
     * with an undefined team and battle.
     */
    public static computeNextToken(
        tracksProgress: ILreTrackProgress[],
        teams: ILreTeam[],
        lastToken: TokenUse | undefined
    ): TokenUse {
        const lowestAvailableBattles: number[] = tracksProgress.map(track => this.computeLowestAvailableBattle(track));
        const highestAvailableBattles: number[] = tracksProgress.map(track =>
            this.computeHighestAvailableBattle(track)
        );
        const nextBestTokens: TokenUse[] = [];
        for (let i = 0; i < tracksProgress.length; i++) {
            const token = this.computeNextBestTokenInTrack(
                tracksProgress[i],
                teams.filter(x => x.section === tracksProgress[i].trackId),
                lowestAvailableBattles[i],
                highestAvailableBattles[i]
            );
            if (token !== undefined) nextBestTokens.push(token);
        }
        if (nextBestTokens.length === 0) {
            // No tokens available, return a token with no team and no battle.
            return new TokenUse();
        }
        // Find the token with the highest points, and if there is a tie, the lowest
        // (real) battle number.
        return nextBestTokens.reduce((best, current) => {
            if (best === undefined) return current;
            if (current === undefined) return best;
            if (current.incrementalPoints > best.incrementalPoints) return current;
            if (current.incrementalPoints < best.incrementalPoints) return best;
            if (this.isTokenNextBattleWithTeam(current, lastToken)) return current;
            if (this.isTokenNextBattleWithTeam(best, lastToken)) return best;
            if (this.getTrack(current) < this.getTrack(best)) return current;
            if (this.getTrack(current) > this.getTrack(best)) return best;
            if (current.battleNumber > best.battleNumber) return current;
            return best;
        }, nextBestTokens[0]);
    }

    /**
     * @returns which tokens to use in which order until either all restrictions
     * are completed or all teams have hit their ceiling. Returned in usage
     * order.
     */
    public static computeAllTokenUsage(tracksProgress: ILreTrackProgress[], teams: ILreTeam[]): TokenUse[] {
        const tokens: TokenUse[] = [];
        const tracks: ILreTrackProgress[] = cloneDeep(tracksProgress);
        tracks.forEach(track => {
            track.battles.forEach(battle => {
                battle.completed =
                    battle.requirementsProgress.reduce((sum, req) => (sum += req.completed ? 1 : 0), 0) ===
                    battle.requirementsProgress.length;
            });
        });
        const resolvedTeams = teams.map(team => ({
            ...team,
            charSnowprintIds: (team.charSnowprintIds ?? team.charactersIds ?? []).map(char =>
                CharactersService.canonicalName(char)
            ),
        }));
        while (true) {
            const token: TokenUse = this.computeNextToken(
                tracks,
                resolvedTeams,
                tokens.length > 0 ? tokens[tokens.length - 1] : undefined
            );
            if (token.team === undefined) break;
            this.markRestrictionsAsCleared(token, tracks.find(x => x.trackId === token.team!.section)!);
            tokens.push(token);
        }
        return tokens;
    }

    /**
     * Marks as cleared those restrictions specified in the token.
     */
    static markRestrictionsAsCleared(token: TokenUse, track: ILreTrackProgress): void {
        if (token.team === undefined || token.battleNumber < 0) {
            return;
        }
        const battle = track.battles[track.battles.length - 1 - token.battleNumber];
        if (battle.completed) {
            return;
        }
        for (const restriction of token.restrictionsCleared) {
            const requirement = battle.requirementsProgress.find(req => req.id === restriction.id);
            if (requirement === undefined) {
                continue;
            }
            requirement.completed = true;
        }
    }

    /** @returns the current points earned in this battle. Partial kill points are
     * never computed, full kill points or nothing.
     */
    public static computeCurrentPoints(track: ILreTrackProgress): number {
        return track.battles.reduce((sum, battle) => {
            const battlePoints = battle.requirementsProgress
                .filter(req => req.completed)
                .map(x => x.points)
                .reduce((innerSum, points) => {
                    return innerSum + points;
                }, 0);
            return sum + battlePoints;
        }, 0);
    }

    /**
     * @returns the lowest available battle that can be played in the given
     * track. If the track is complete, returns -1. The first battle in a
     * track is battle 0.
     */
    static computeLowestAvailableBattle(track: ILreTrackProgress): number {
        for (let i = 0; i < track.battles.length; ++i) {
            if (!track.battles[track.battles.length - i - 1].completed) return i;
        }
        return -1;
    }

    /**
     * @returns the highest available battle that can be played in the given
     * track. If the track is complete, returns -1. The first battle in a
     * track is battle 0.
     */
    static computeHighestAvailableBattle(track: ILreTrackProgress): number {
        const killPointsId = '_killPoints';
        // If we've cleared the track, then obviously there are no available battles.
        if (track.battles.every(battle => battle.completed)) return -1;

        // Find the first battle where we don't have the kill points requirement completed.
        for (let i = 0; i < track.battles.length; ++i) {
            const req = track.battles[track.battles.length - 1 - i].requirementsProgress.find(
                req => req.id === killPointsId
            );
            if (req === undefined) {
                console.error("couldn't find a kill-points requirement");
                return -1;
            }
            if (!req.completed) return i;
        }

        // We can play every battle, but we haven't completed every battle.
        // Work backwards to find the first battle we have not completed.
        for (let i = track.battles.length - 1; i >= 0; --i) {
            if (!track.battles[track.battles.length - 1 - i].completed) return i;
        }
        return -1;
    }

    /**
     * @returns the next token the player should use given the current progress
     * in the track. The next token yields the highest points. In the case of a
     * tie, the battle lowest in its track is chosen. If there is a tie again,
     * then one is picked arbitrarily.
     */
    static computeNextBestTokenInTrack(
        track: ILreTrackProgress,
        teams: ILreTeam[],
        lowestBattle: number,
        highestBattle: number
    ): TokenUse | undefined {
        const nextToken: TokenUse = new TokenUse();
        if (lowestBattle == -1 || highestBattle == -1) return undefined;
        for (let battleNumber = lowestBattle; battleNumber <= highestBattle; ++battleNumber) {
            const battle = track.battles[track.battles.length - 1 - battleNumber];
            if (battle.completed) continue;
            teams.forEach(team => {
                const restrictionsCleared: ILreRequirements[] = this.computeIncrementalRestrictionsCleared(
                    battle,
                    team
                );
                const points: number = this.computeIncrementalPointsForClearingRestrictions(
                    battle,
                    restrictionsCleared
                );
                if (points > 0 && points > nextToken.incrementalPoints) {
                    nextToken.incrementalPoints = points;
                    nextToken.team = team;
                    nextToken.battleNumber = battleNumber;
                    nextToken.restrictionsCleared = restrictionsCleared;
                }
            });
        }
        return nextToken;
    }

    /**
     * @returns the restrictions cleared by the team in the given battle, given
     * the already-cleared restrictions in the given battle.
     */
    static computeIncrementalRestrictionsCleared(battle: ILreBattleProgress, team: ILreTeam): ILreRequirements[] {
        if (battle.completed) return [];
        if ((team.expectedBattleClears ?? 0) <= battle.battleIndex) {
            return [];
        }
        const clearedRestrictions: ILreRequirements[] = [];
        const completionRequirementIds = ['_killPoints', '_highScore', '_defeatAll'];
        for (const requirement of battle.requirementsProgress) {
            if (requirement.completed) continue;
            if (team.restrictionsIds.includes(requirement.id) || completionRequirementIds.includes(requirement.id)) {
                clearedRestrictions.push({
                    id: requirement.id,
                    iconId: requirement.iconId,
                    name: requirement.name,
                    pointsPerBattle: requirement.points,
                    totalPoints: 0,
                    completed: true,
                });
            }
        }
        return clearedRestrictions;
    }

    /**
     * @returns the total number of points earned by clearing the specified
     * restrictions in the battle, given that already-cleared restrictions.
     */
    static computeIncrementalPointsForClearingRestrictions(
        battle: ILreBattleProgress,
        restrictions: ILreRequirements[]
    ): number {
        let points: number = 0;
        for (const requirement of battle.requirementsProgress) {
            for (const restriction of restrictions) {
                if (requirement.id === restriction.id) {
                    points += requirement.points;
                }
            }
        }
        return points;
    }

    /**
     * Returns the estimated number of tokens required to clear all restrictions in a
     * given battle. If the user has not predicted a full clear of a battle,
     * returns undefined. All teams passed to this function are expected to be able
     * to clear this particular battle.
     */
    public static computeMinimumTokensToClearBattle(teams: ILreTeam[]): number | undefined {
        if (teams.length === 0) return undefined;
        const restrictions = this.computeRestrictions(teams);
        // TODO: we're hardcoding five restrictions per battle, we should instead read this from the event.
        if (restrictions.length < 5) return undefined;
        let minimum: number = 6;
        const foundRestrictions: string[] = [];
        const currentTeams: string[] = [];
        for (let i = 0; i < teams.length; i++) {
            const newMin = this.computeMinimumTokensForBattle(
                teams.slice(i),
                0,
                restrictions,
                foundRestrictions,
                minimum,
                currentTeams
            );
            if (newMin < minimum) minimum = newMin;
        }

        return minimum;
    }

    /**
     * This function is recursive and will only exit when either all
     * restrictions have been matched, or when none can be matched.
     *
     * @returns the minimum number of tokens necessary to complete all five
     * restrictions of a particular legendary event.
     * @param teams the remaining teams usable to complete the batle.
     * @param currentTokens the current number of tokens used when trying to
     * complete the battle.
     * @param restrictions all restrictions for this battle.
     * @param foundRestrictions the restrictions for which we already found
     * a matching team.
     * @param currentMinimum the current minimum number of tokens we've found
     * to complete the battle.
     * @param currentTeams the current teams used to complete @foundRestrictions.
     */
    static computeMinimumTokensForBattle(
        teams: ILreTeam[],
        currentTokens: number,
        restrictions: string[],
        foundRestrictions: string[],
        currentMinimum: number,
        currentTeams: string[]
    ): number {
        // If we don't have any more teams, or we're already using more tokens than
        // the current minimum, then we can return the current minimum.
        if (teams.length === 0 || currentTokens >= currentMinimum) return currentMinimum;

        // Figure out which restrictions we can satisfy with the current team.
        const team = teams[0];
        ++currentTokens;
        currentTeams = currentTeams.map(x => x);
        foundRestrictions = foundRestrictions.map(x => x);
        currentTeams.push('{' + team.restrictionsIds.join(',') + '}');
        let newFoundRestrictions = 0;
        for (const restriction of team.restrictionsIds) {
            if (!foundRestrictions.includes(restriction)) {
                foundRestrictions.push(restriction);
                ++newFoundRestrictions;
            }
        }
        // If we didn't satisfy any new restrictions, then bail out, no need to include
        // this team in the current calculation.
        if (newFoundRestrictions == 0) return currentMinimum;

        // If we found all restrictions, then we can return the number of tokens we have.
        if (foundRestrictions.length === restrictions.length) {
            return currentTokens;
        }
        for (let i = 1; i < teams.length; i++) {
            // See if we can use the next team to satisfy the remaining restrictions.
            const newMin = this.computeMinimumTokensForBattle(
                teams.slice(i),
                currentTokens,
                restrictions,
                foundRestrictions,
                currentMinimum,
                currentTeams
            );
            if (newMin <= currentMinimum) currentMinimum = newMin;
        }
        foundRestrictions.splice(0, foundRestrictions.length - newFoundRestrictions);
        return currentMinimum;
    }

    /**
     * @returns the restrictions for the given battle, as collected from
     * the restrictions in @teams. It's perfectly acceptable that the given
     * teams may not meet every restriction, and thus the length of the returned
     * array could be less than five, even potentially zero.
     */
    static computeRestrictions(teams: ILreTeam[]): string[] {
        const restrictions: string[] = [];
        for (const team of teams) {
            for (const restriction of team.restrictionsIds) {
                if (!restrictions.includes(restriction)) {
                    restrictions.push(restriction);
                }
            }
        }
        return restrictions;
    }
}
