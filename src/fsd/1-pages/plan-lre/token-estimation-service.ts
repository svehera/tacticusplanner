import { cloneDeep } from 'lodash';

// eslint-disable-next-line import-x/no-internal-modules
import { ILreTeam } from '@/models/interfaces';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';

import { LeProgressService } from './le-progress.service';
import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreBattleProgress, ILreProgressModel, ILreRequirements, ILreTrackProgress } from './lre.models';

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

export class TokenDisplay {
    public team: string[] = [];
    public restricts: ILreRequirements[] = [];
    public battleNumber: number = -1;
    public track: string = '(null track)';
    public incrementalPoints: number = -1;
    public totalPoints: number = -1;
    public rarity: Rarity = Rarity.Legendary;
    public stars: RarityStars = RarityStars.None;
    public shardsToNextMilestone: number = 400;
    public achievedPointsMilestone: boolean = false;
    public achievedStarMilestone: boolean = false;
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

interface PointMilestone {
    points: number;
    currencyPayout: number;
}

const pointMilestones: readonly PointMilestone[] = [
    { points: 100, currencyPayout: 25 },
    { points: 250, currencyPayout: 30 },
    { points: 500, currencyPayout: 35 },
    { points: 1000, currencyPayout: 40 },
    { points: 1500, currencyPayout: 45 },
    { points: 2000, currencyPayout: 50 },
    { points: 2500, currencyPayout: 55 },
    { points: 3000, currencyPayout: 60 },
    { points: 3500, currencyPayout: 65 },
    { points: 4000, currencyPayout: 70 },
    { points: 4500, currencyPayout: 75 },
    { points: 5000, currencyPayout: 80 },
    { points: 5500, currencyPayout: 85 },
    { points: 6000, currencyPayout: 90 },
    { points: 6500, currencyPayout: 95 },
    { points: 7000, currencyPayout: 100 },
    { points: 7500, currencyPayout: 110 },
    { points: 8000, currencyPayout: 120 },
    { points: 8500, currencyPayout: 140 },
    { points: 9000, currencyPayout: 160 },
    { points: 9500, currencyPayout: 180 },
    { points: 10000, currencyPayout: 200 },
    { points: 10500, currencyPayout: 220 },
    { points: 11000, currencyPayout: 240 },
    { points: 11500, currencyPayout: 260 },
    { points: 12000, currencyPayout: 280 },
    { points: 12500, currencyPayout: 300 },
    { points: 13000, currencyPayout: 310 },
    { points: 13500, currencyPayout: 320 },
    { points: 14000, currencyPayout: 330 },
    { points: 14250, currencyPayout: 340 },
    { points: 14500, currencyPayout: 350 },
    { points: 14750, currencyPayout: 355 },
    { points: 15000, currencyPayout: 360 },
    { points: 15250, currencyPayout: 365 },
    { points: 15500, currencyPayout: 370 },
    { points: 15750, currencyPayout: 380 },
    { points: 16000, currencyPayout: 390 },
    { points: 16250, currencyPayout: 400 },
    { points: 16500, currencyPayout: 410 },
    { points: 16750, currencyPayout: 420 },
    { points: 17000, currencyPayout: 430 },
    { points: 17250, currencyPayout: 440 },
    { points: 17500, currencyPayout: 450 },
    { points: 17750, currencyPayout: 460 },
    { points: 18000, currencyPayout: 470 },
    { points: 18250, currencyPayout: 480 },
    { points: 18500, currencyPayout: 490 },
    { points: 18750, currencyPayout: 500 },
    { points: 19000, currencyPayout: 510 },
    { points: 19250, currencyPayout: 520 },
    { points: 19500, currencyPayout: 530 },
    { points: 19750, currencyPayout: 540 },
    { points: 20000, currencyPayout: 550 },
    { points: 20250, currencyPayout: 560 },
    { points: 20500, currencyPayout: 570 },
    { points: 20750, currencyPayout: 580 },
    { points: 21000, currencyPayout: 590 },
    { points: 21250, currencyPayout: 600 },
    { points: 21500, currencyPayout: 605 },
    { points: 21750, currencyPayout: 610 },
    { points: 22000, currencyPayout: 615 },
    { points: 22250, currencyPayout: 620 },
    { points: 22500, currencyPayout: 625 },
    { points: 22750, currencyPayout: 630 },
    { points: 23000, currencyPayout: 635 },
    { points: 23250, currencyPayout: 640 },
    { points: 23500, currencyPayout: 645 },
    { points: 23750, currencyPayout: 650 },
    { points: 24000, currencyPayout: 655 },
    { points: 24250, currencyPayout: 660 },
    { points: 24500, currencyPayout: 665 },
    { points: 24750, currencyPayout: 670 },
    { points: 25000, currencyPayout: 675 },
    { points: 25250, currencyPayout: 680 },
    { points: 25500, currencyPayout: 685 },
    { points: 25750, currencyPayout: 690 },
    { points: 26000, currencyPayout: 695 },
    { points: 26250, currencyPayout: 700 },
    { points: 26500, currencyPayout: 705 },
    { points: 26750, currencyPayout: 710 },
    { points: 27000, currencyPayout: 715 },
];
interface ShardMilestone {
    shards: PositiveInteger<number>;
    rarity: Rarity;
    stars: RarityStars;
    totalNeededCurrency: PositiveInteger<number>;
}

const chestMilestones: readonly ShardMilestone[] = [
    { shards: 25, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 60 },
    { shards: 50, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 140 },
    { shards: 75, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 240 },
    { shards: 100, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 360 },
    { shards: 125, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 500 },
    { shards: 150, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 660 },
    { shards: 175, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 840 },
    { shards: 200, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 1040 },
    { shards: 225, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 1260 },
    { shards: 250, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 1500 },
    { shards: 275, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 1760 },
    { shards: 300, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 2040 },
    { shards: 325, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 2340 },
    { shards: 350, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 2660 },
    { shards: 375, rarity: Rarity.Legendary, stars: RarityStars.None, totalNeededCurrency: 3000 },
    { shards: 400, rarity: Rarity.Legendary, stars: RarityStars.RedThreeStars, totalNeededCurrency: 3350 },
    { shards: 425, rarity: Rarity.Legendary, stars: RarityStars.RedThreeStars, totalNeededCurrency: 3710 },
    { shards: 450, rarity: Rarity.Legendary, stars: RarityStars.RedThreeStars, totalNeededCurrency: 4080 },
    { shards: 475, rarity: Rarity.Legendary, stars: RarityStars.RedThreeStars, totalNeededCurrency: 4460 },
    { shards: 500, rarity: Rarity.Legendary, stars: RarityStars.RedThreeStars, totalNeededCurrency: 4850 },
    { shards: 525, rarity: Rarity.Legendary, stars: RarityStars.RedFourStars, totalNeededCurrency: 5250 },
    { shards: 550, rarity: Rarity.Legendary, stars: RarityStars.RedFourStars, totalNeededCurrency: 5650 },
    { shards: 575, rarity: Rarity.Legendary, stars: RarityStars.RedFourStars, totalNeededCurrency: 6050 },
    { shards: 600, rarity: Rarity.Legendary, stars: RarityStars.RedFourStars, totalNeededCurrency: 6450 },
    { shards: 625, rarity: Rarity.Legendary, stars: RarityStars.RedFourStars, totalNeededCurrency: 6850 },
    { shards: 650, rarity: Rarity.Legendary, stars: RarityStars.RedFourStars, totalNeededCurrency: 7250 },
    { shards: 675, rarity: Rarity.Legendary, stars: RarityStars.RedFourStars, totalNeededCurrency: 7650 },
    { shards: 700, rarity: Rarity.Legendary, stars: RarityStars.RedFiveStars, totalNeededCurrency: 8050 },
    { shards: 725, rarity: Rarity.Legendary, stars: RarityStars.RedFiveStars, totalNeededCurrency: 8450 },
    { shards: 750, rarity: Rarity.Legendary, stars: RarityStars.RedFiveStars, totalNeededCurrency: 8850 },
    { shards: 775, rarity: Rarity.Legendary, stars: RarityStars.RedFiveStars, totalNeededCurrency: 9250 },
    { shards: 800, rarity: Rarity.Legendary, stars: RarityStars.RedFiveStars, totalNeededCurrency: 9650 },
    { shards: 825, rarity: Rarity.Legendary, stars: RarityStars.RedFiveStars, totalNeededCurrency: 10050 },
    { shards: 850, rarity: Rarity.Legendary, stars: RarityStars.RedFiveStars, totalNeededCurrency: 10450 },
    { shards: 875, rarity: Rarity.Legendary, stars: RarityStars.RedFiveStars, totalNeededCurrency: 10850 },
    { shards: 900, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar, totalNeededCurrency: 11250 },
    { shards: 925, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar, totalNeededCurrency: 12050 },
    { shards: 950, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar, totalNeededCurrency: 12950 },
    { shards: 975, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar, totalNeededCurrency: 13950 },
    { shards: 1000, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar, totalNeededCurrency: 15050 },
    { shards: 1025, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar, totalNeededCurrency: 16250 },
    { shards: 1050, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar, totalNeededCurrency: 17550 },
    { shards: 1075, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar, totalNeededCurrency: 18950 },
    { shards: 1100, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar, totalNeededCurrency: 20450 },
    { shards: 1125, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar, totalNeededCurrency: 21950 },
    { shards: 1150, rarity: Rarity.Mythic, stars: RarityStars.OneBlueStar, totalNeededCurrency: 23450 },
    { shards: 1175, rarity: Rarity.Mythic, stars: RarityStars.OneBlueStar, totalNeededCurrency: 24950 },
    { shards: 1200, rarity: Rarity.Mythic, stars: RarityStars.OneBlueStar, totalNeededCurrency: 26450 },
    { shards: 1225, rarity: Rarity.Mythic, stars: RarityStars.OneBlueStar, totalNeededCurrency: 27950 },
    { shards: 1250, rarity: Rarity.Mythic, stars: RarityStars.OneBlueStar, totalNeededCurrency: 29450 },
    { shards: 1275, rarity: Rarity.Mythic, stars: RarityStars.OneBlueStar, totalNeededCurrency: 30950 },
    { shards: 1300, rarity: Rarity.Mythic, stars: RarityStars.TwoBlueStars, totalNeededCurrency: 32450 },
];

interface StarMilestone {
    totalShards: number;
    incrementalShards: number;
    rarity: Rarity;
    stars: RarityStars;
}

const ascensionMilestones: readonly StarMilestone[] = [
    { totalShards: 400, incrementalShards: 400, rarity: Rarity.Legendary, stars: RarityStars.RedThreeStars },
    { totalShards: 520, incrementalShards: 120, rarity: Rarity.Legendary, stars: RarityStars.RedFourStars },
    { totalShards: 700, incrementalShards: 180, rarity: Rarity.Legendary, stars: RarityStars.RedFiveStars },
    { totalShards: 900, incrementalShards: 200, rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar },
    { totalShards: 1150, incrementalShards: 250, rarity: Rarity.Mythic, stars: RarityStars.OneBlueStar },
    { totalShards: 1300, incrementalShards: 150, rarity: Rarity.Mythic, stars: RarityStars.TwoBlueStars },
];

interface EventProgress {
    // The total points accumulated so far.
    points: number;

    // The total currency accumulated so far.
    currency: number;

    // The current rarity of the character.
    rarity: Rarity;

    // The current stars of the character.
    stars: RarityStars;

    // The current number of shards of the character.
    shards: number;

    // The number of shards needed to hit the next ascension milestone.
    shardsForNextMilestone: number;

    // The index of the last chest opened (0 based, -1 means nothing claimed).
    currentClaimedChestIndex: number;
}

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
    public static getFurthestCurrencyMilestoneAchieved(currentPoints: number): number {
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

    /** @returns the current points earned in this track, accounting for partial killScore and highScore inputs. */
    public static computeCurrentPointsInTrack(track: ILreTrackProgress): number {
        return track.battles.reduce((sum, battle) => {
            const battlePoints = battle.requirementsProgress
                .map(req => LreRequirementStatusService.getRequirementPoints(req))
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

    /**
     * Returns the next point milestone to be achieved that will award currency.
     */
    private static getNextPointMilestoneIndex(currentPoints: number): number {
        for (let i = 0; i < pointMilestones.length; ++i) {
            if (currentPoints < pointMilestones[i].points) return i;
        }
        return pointMilestones.length;
    }

    /**
     * Gets the index of the current star milestone based on the character's rarity and stars.
     * This is used to determine the starting point for token calculation within the `starMilestones` array.
     *
     * @param currentRarity - The current rarity of the character.
     * @param currentStars - The number of stars the character currently has.
     * @returns The index in the `starMilestones` array corresponding to the character's current progression.
     * Returns -1 if the character has no stars (`RarityStars.None`).
     * Returns `starMilestones.length` if the character has surpassed all defined milestones.
     */
    private static getCurrentStarIndex(currentRarity: Rarity, currentStars: RarityStars): number {
        if (currentStars === RarityStars.None) return -1;
        for (let i = 0; i < ascensionMilestones.length; ++i) {
            if (currentRarity === ascensionMilestones[i].rarity && currentStars <= ascensionMilestones[i].stars) {
                return i;
            }
        }
        return ascensionMilestones.length;
    }

    /**
     * Returns the current bonus payout per currency payout. While the bonus
     * payout is fixed, whether it's active is not.
     */
    private static getBonusPayoutPerCurrencyPayout(progress: ILreProgressModel): number {
        if (progress.syncedProgress !== undefined) {
            return progress.syncedProgress.hasPremiumPayout ? 15 : 0;
        }
        return progress.occurrenceProgress.some(occ => occ.premiumMissionsProgress > 0) ? 15 : 0;
    }

    /** Returns the number of shards obtained per chest. */
    private static getShardsPerChest(): number {
        return 25;
    }

    /** Gets the current points in the event, either from the player override or the computed progress. */
    public static computeCurrentPoints(progress: ILreProgressModel): number {
        if (progress.syncedProgress !== undefined) {
            return progress.syncedProgress.currentPoints;
        }
        return LeProgressService.computeProgress(progress, false).currentPoints;
    }

    /** Gets the total current currency based on progress, character rarity, stars, and P2P status. */
    public static computeTotalCurrency(progress: ILreProgressModel, p2p: boolean): number {
        if (progress.syncedProgress !== undefined) {
            return (
                progress.syncedProgress.currentCurrency +
                (progress.syncedProgress.currentClaimedChestIndex >= 0
                    ? chestMilestones[progress.syncedProgress.currentClaimedChestIndex].totalNeededCurrency
                    : 0)
            );
        }
        return LeProgressService.computeProgress(progress, p2p).currentCurrency;
    }

    /**
     * @returns the number of shards the user currently has. If the user has forced progress,
     *          returns the value they specified, but excludes any chests they have the ability to
     *          open with their current stash of currency. */
    public static computeCurrentShards(progress: ILreProgressModel): number {
        if (progress.syncedProgress !== undefined) {
            return progress.syncedProgress.currentShards;
        }
        let shards = LeProgressService.computeProgress(progress, false).currentChests * this.getShardsPerChest();
        for (let i = 0; i < ascensionMilestones.length; ++i) {
            if (ascensionMilestones[i].totalShards > shards) break;
            shards -= ascensionMilestones[i].incrementalShards;
        }

        return shards;
    }

    /**
     * Computes the current progress event progress based on the forced progress provided by the
     * user.
     */
    private static computeSyncedProgress(
        progress: ILreProgressModel,
        currentRarity: Rarity,
        currentStars: RarityStars
    ): EventProgress {
        if (progress.syncedProgress === undefined) {
            throw new Error('computeForcedProgress called with no forced progress');
        }
        let currentCurrency = progress.syncedProgress.currentCurrency;
        let currentShards = progress.syncedProgress.currentShards;
        let lastClaimedChestIndex = progress.syncedProgress.currentClaimedChestIndex;

        // Determine the total currency, since forced progress only gives us the current incremental currency.
        if (lastClaimedChestIndex >= 0 && lastClaimedChestIndex < chestMilestones.length) {
            currentCurrency = chestMilestones[lastClaimedChestIndex].totalNeededCurrency + currentCurrency;
        }

        // Open any chests we can with the current currency, collecting shards along the way.
        while (
            lastClaimedChestIndex + 1 < chestMilestones.length &&
            currentCurrency >= chestMilestones[lastClaimedChestIndex + 1].totalNeededCurrency
        ) {
            ++lastClaimedChestIndex;
            currentShards += this.getShardsPerChest();
        }
        // Determine if we hit any new ascension milestones.
        let starIndex = 0;
        for (starIndex = 0; starIndex < ascensionMilestones.length; ++starIndex) {
            // Skip over the milestones we've already hit.
            if (currentRarity > ascensionMilestones[starIndex].rarity) continue;
            if (currentStars > ascensionMilestones[starIndex].stars) continue;
            if (
                currentRarity === ascensionMilestones[starIndex].rarity &&
                currentStars === ascensionMilestones[starIndex].stars
            ) {
                continue;
            }
            // Go over each milestone and see if we can spend our incremental shards to ascend.
            if (ascensionMilestones[starIndex].incrementalShards > currentShards) break;
            currentRarity = ascensionMilestones[starIndex].rarity;
            currentStars = ascensionMilestones[starIndex].stars;
            currentShards -= ascensionMilestones[starIndex].incrementalShards;
        }
        return {
            points: progress.syncedProgress.currentPoints,
            currency: currentCurrency,
            rarity: currentRarity,
            stars: currentStars,
            shards: currentShards,
            shardsForNextMilestone: ascensionMilestones[starIndex]?.incrementalShards ?? Infinity,
            currentClaimedChestIndex: lastClaimedChestIndex,
        } as EventProgress;
    }

    /**
     * @returns the current progress based either on the forced progress, or on the provided
     * progress model and current rarity/stars.
     */
    public static computeCurrentProgress(
        progress: ILreProgressModel,
        currentRarity: Rarity,
        currentStars: RarityStars,
        p2p: boolean
    ): EventProgress {
        if (progress.syncedProgress !== undefined) {
            return this.computeSyncedProgress(progress, currentRarity, currentStars);
        }
        const computedProgress = LeProgressService.computeProgress(progress, p2p);
        let lastClaimedChestIndex = -1;
        for (lastClaimedChestIndex = -1; lastClaimedChestIndex + 1 < chestMilestones.length; ++lastClaimedChestIndex) {
            if (computedProgress.currentCurrency < chestMilestones[lastClaimedChestIndex + 1].totalNeededCurrency) {
                break;
            }
        }
        let totalShards = computedProgress.currentTotalShards;
        let starIndex = 0;
        for (starIndex = 0; starIndex < ascensionMilestones.length; ++starIndex) {
            if (ascensionMilestones[starIndex].totalShards > totalShards) break;
            currentRarity = ascensionMilestones[starIndex].rarity;
            currentStars = ascensionMilestones[starIndex].stars;
            totalShards -= ascensionMilestones[starIndex].incrementalShards;
        }

        return {
            points: computedProgress.currentPoints,
            currency: computedProgress.currentCurrency,
            rarity: currentRarity,
            stars: currentStars,
            shards: totalShards,
            shardsForNextMilestone: ascensionMilestones[starIndex]?.incrementalShards ?? Infinity,
            currentClaimedChestIndex: lastClaimedChestIndex,
        } as EventProgress;
    }

    /**
     * @returns the information to display for each token based on the current progress of the
     * player.
     */
    public static getTokenDisplays(
        tokens: TokenUse[],
        progress: ILreProgressModel,
        currentRarity: Rarity,
        currentStars: RarityStars,
        p2p: boolean
    ): TokenDisplay[] {
        const currentProgress = this.computeCurrentProgress(progress, currentRarity, currentStars, p2p);
        let currentPoints = currentProgress.points;
        let currentCurrency = currentProgress.currency;
        let currentShards = currentProgress.shards;
        currentRarity = currentProgress.rarity;
        currentStars = currentProgress.stars;
        let lastClaimedChestIndex = currentProgress.currentClaimedChestIndex;
        let nextPointMilestoneIndex = this.getNextPointMilestoneIndex(currentProgress.points);
        let nextStarIndex = this.getCurrentStarIndex(currentProgress.rarity, currentProgress.stars) + 1;
        const ret: TokenDisplay[] = [];

        for (let i = 0; i < tokens.length; ++i) {
            const token = tokens[i];
            currentPoints += token.incrementalPoints;
            let achievedPointsMilestone = false;
            let achievedStarMilestone = false;
            while (
                nextPointMilestoneIndex < pointMilestones.length &&
                currentPoints >= pointMilestones[nextPointMilestoneIndex].points
            ) {
                currentCurrency +=
                    pointMilestones[nextPointMilestoneIndex].currencyPayout +
                    this.getBonusPayoutPerCurrencyPayout(progress);
                ++nextPointMilestoneIndex;
                achievedPointsMilestone = true;
                while (
                    lastClaimedChestIndex + 1 < chestMilestones.length &&
                    currentCurrency >= chestMilestones[lastClaimedChestIndex + 1].totalNeededCurrency
                ) {
                    currentShards += this.getShardsPerChest();
                    ++lastClaimedChestIndex;
                }
                while (
                    nextStarIndex < ascensionMilestones.length &&
                    currentShards >= ascensionMilestones[nextStarIndex].incrementalShards
                ) {
                    currentRarity = ascensionMilestones[nextStarIndex].rarity;
                    currentStars = ascensionMilestones[nextStarIndex].stars;
                    currentShards -= ascensionMilestones[nextStarIndex].incrementalShards;
                    achievedStarMilestone = true;
                    ++nextStarIndex;
                }
            }
            const chars = [];
            if (token.team) {
                if (token.team.charSnowprintIds) {
                    chars.push(...token.team.charSnowprintIds);
                } else if (token.team.charactersIds) {
                    chars.push(
                        ...token.team.charactersIds.map(
                            name => CharactersService.resolveCharacter(name)?.snowprintId ?? name
                        )
                    );
                }
            }
            const shardsToNextMilestone =
                nextStarIndex < ascensionMilestones.length
                    ? ascensionMilestones[nextStarIndex].incrementalShards - currentShards
                    : 0;
            ret.push({
                team: chars,
                restricts: token.restrictionsCleared,
                battleNumber: token.battleNumber,
                track: token.team!.section,
                incrementalPoints: token.incrementalPoints,
                totalPoints: currentPoints,
                rarity: currentRarity,
                stars: currentStars,
                shardsToNextMilestone: shardsToNextMilestone,
                achievedPointsMilestone: achievedPointsMilestone,
                achievedStarMilestone: achievedStarMilestone,
            });
        }
        return ret;
    }
}
