import {
    HsePlan,
    OnslaughtBattleKey,
    OnslaughtData,
    OnslaughtSectorKey,
    OnslaughtTokens,
    OnslaughtTrackId,
    OnslaughtZoneKey,
} from './models';
import { OnslaughtKillzone } from './types';

export class HomeScreenEventPlannerService {
    /**
     * @returns a token usage plan to maximize enemies killed in onslaught during a home-screen event. Technically
     * it can be used whenever, but the current need is for home-screen events.
     *
     * @param onslaughtData the data to use for calculations
     * @param imperial the current battle key for the imperial track
     * @param xenos the current battle key for the xenos track
     * @param chaos the current battle key for the chaos track
     * @param chosenTracks a record of which tracks the user has chosen to use tokens on
     * @param preEventTokens how many tokens the user will use before the event starts
     * @param duringEventTokens how many tokens the user will use during the event
     */
    public static calculateHsePlan(
        onslaughtData: OnslaughtData,
        imperial: OnslaughtBattleKey,
        xenos: OnslaughtBattleKey,
        chaos: OnslaughtBattleKey,
        chosenTracks: Record<OnslaughtTrackId, boolean>,
        preEventTokens: number,
        duringEventTokens: number
    ): HsePlan {
        const tracks = Object.entries(chosenTracks)
            .filter(([_, selected]) => selected)
            .map(([track]) => track as OnslaughtTrackId);
        if (tracks.length === 0) {
            return {
                preEventTokens: {
                    [OnslaughtTrackId.Imperial]: 0,
                    [OnslaughtTrackId.Xenos]: 0,
                    [OnslaughtTrackId.Chaos]: 0,
                },
                eventTokens: {
                    [OnslaughtTrackId.Imperial]: 0,
                    [OnslaughtTrackId.Xenos]: 0,
                    [OnslaughtTrackId.Chaos]: 0,
                },
            };
        }
        if (tracks.length === 1) {
            return this.calculateSingleTrack(
                onslaughtData,
                imperial,
                xenos,
                chaos,
                chosenTracks,
                preEventTokens,
                duringEventTokens
            );
        }
        if (tracks.length === 2) {
            return this.calculateDoubleTrack(
                onslaughtData,
                imperial,
                xenos,
                chaos,
                chosenTracks,
                preEventTokens,
                duringEventTokens
            );
        }
        return this.calculateTripleTrack(onslaughtData, imperial, xenos, chaos, preEventTokens, duringEventTokens);
    }

    /**
     * @returns the optimal token usage plan if the user is only using tokens on one track. This is a simpler calculation than the
     * double and triple track cases, as we just need to find the best contiguous segment of battles to use tokens on. In this case,
     * we will simply recommend to the user the optimal number of tokens to use on their chosen track pre-event, and if they have
     * excess tokens before the event, they should use them on other tracks.
     */
    public static calculateSingleTrack(
        onslaughtData: OnslaughtData,
        imperial: OnslaughtBattleKey,
        xenos: OnslaughtBattleKey,
        chaos: OnslaughtBattleKey,
        chosenTracks: Record<OnslaughtTrackId, boolean>,
        preEventTokens: number,
        duringEventTokens: number
    ): HsePlan {
        const track = Object.keys(chosenTracks).find(t => chosenTracks[t as OnslaughtTrackId]) as OnslaughtTrackId;
        let nextBattle: OnslaughtBattleKey | undefined =
            track === OnslaughtTrackId.Imperial ? imperial : track === OnslaughtTrackId.Xenos ? xenos : chaos;
        if (nextBattle === undefined) {
            return {
                preEventTokens: {
                    [OnslaughtTrackId.Imperial]: 0,
                    [OnslaughtTrackId.Xenos]: 0,
                    [OnslaughtTrackId.Chaos]: 0,
                },
                eventTokens: {
                    [OnslaughtTrackId.Imperial]: 0,
                    [OnslaughtTrackId.Xenos]: 0,
                    [OnslaughtTrackId.Chaos]: 0,
                },
            };
        }
        const enemies: number[] = [];
        const rollingTotal: number[] = [];

        for (let i = 0; i < preEventTokens + duringEventTokens; ++i) {
            const zoneData = onslaughtData[nextBattle.track].sectors[nextBattle.sector].killzones[
                nextBattle.zone
            ] as OnslaughtKillzone;
            if (!zoneData) break;
            nextBattle = this.getBattleAfter(onslaughtData, nextBattle.track, nextBattle.sector, nextBattle.zone);
            if (!nextBattle) break;
            enemies.push(zoneData.totalEnemyCount);
            rollingTotal.push(enemies[i] + (rollingTotal[i - 1] || 0));
        }

        let bestEndingIndex = 0;
        let bestSum = 0;
        for (let i = 0; i < rollingTotal.length; ++i) {
            if (i < duringEventTokens) {
                if (rollingTotal[i] > bestSum) {
                    bestSum = rollingTotal[i];
                    bestEndingIndex = i;
                }
            }
            const currentSum = rollingTotal[i] - rollingTotal[i - duringEventTokens];
            if (currentSum > bestSum) {
                bestSum = currentSum;
                bestEndingIndex = i;
            }
        }

        const tokensToUsePreEvent: OnslaughtTokens = {
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        };
        const tokensToUseDuringEvent: OnslaughtTokens = {
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        };

        tokensToUsePreEvent[track] = Math.max(0, bestEndingIndex + 1 - duringEventTokens);
        tokensToUseDuringEvent[track] = Math.min(duringEventTokens, bestEndingIndex + 1);

        return {
            preEventTokens: tokensToUsePreEvent,
            eventTokens: tokensToUseDuringEvent,
        };
    }

    /**
     * Calculates the optimal token usage plan if the user is using tokens on two tracks. This is a more complex calculation
     * than the single track case, as we need to consider the interaction between the two tracks and find the optimal distribution
     * of tokens between them.
     * @returns The optimal number of tokens to use on their chosen tracks before the event starts, and during the event. Leftover
     * pre-event tokens are allocated to the remaining track.
     */
    public static calculateDoubleTrack(
        onslaughtData: OnslaughtData,
        imperial: OnslaughtBattleKey,
        xenos: OnslaughtBattleKey,
        chaos: OnslaughtBattleKey,
        chosenTracks: Record<OnslaughtTrackId, boolean>,
        preEventTokensToUse: number,
        duringEventTokensToUse: number
    ): HsePlan {
        const tracks = Object.keys(chosenTracks).filter(t => chosenTracks[t as OnslaughtTrackId]) as OnslaughtTrackId[];
        if (tracks.length !== 2) {
            return {
                preEventTokens: {
                    [OnslaughtTrackId.Imperial]: 0,
                    [OnslaughtTrackId.Xenos]: 0,
                    [OnslaughtTrackId.Chaos]: 0,
                },
                eventTokens: {
                    [OnslaughtTrackId.Imperial]: 0,
                    [OnslaughtTrackId.Xenos]: 0,
                    [OnslaughtTrackId.Chaos]: 0,
                },
            };
        }
        const trackA = tracks[0];
        const trackB = tracks[1];
        const trackC = Object.keys(chosenTracks).find(t => !chosenTracks[t as OnslaughtTrackId]) as OnslaughtTrackId;

        const allEnemies: number[][] = [[], []];
        const allRollingTotal: number[][] = [[], []];

        let index = 0;
        for (const track of tracks) {
            const enemies = allEnemies[index];
            const rollingTotal = allRollingTotal[index];
            ++index;
            let nextBattle: OnslaughtBattleKey | undefined =
                track === OnslaughtTrackId.Imperial ? imperial : track === OnslaughtTrackId.Xenos ? xenos : chaos;

            if (nextBattle === undefined) continue;
            for (let i = 0; i < preEventTokensToUse + duringEventTokensToUse; ++i) {
                const zoneData = onslaughtData[nextBattle.track].sectors[nextBattle.sector].killzones[
                    nextBattle.zone
                ] as OnslaughtKillzone;
                if (!zoneData) break;
                nextBattle = this.getBattleAfter(onslaughtData, nextBattle.track, nextBattle.sector, nextBattle.zone);
                if (!nextBattle) break;
                enemies.push(zoneData.totalEnemyCount);
                rollingTotal.push(enemies[i] + (rollingTotal[i - 1] || 0));
            }
        }

        let bestStartingIndexA = 0;
        let bestStartingIndexB = 0;
        let bestEndingIndexA = -1;
        let bestEndingIndexB = -1;
        let bestEnemies = 0;
        for (let preEventTokensOnC = 0; preEventTokensOnC <= preEventTokensToUse; ++preEventTokensOnC) {
            for (
                let preEventTokensOnA = 0;
                preEventTokensOnA + preEventTokensOnC <= preEventTokensToUse;
                ++preEventTokensOnA
            ) {
                for (
                    let preEventTokensOnB = 0;
                    preEventTokensOnA + preEventTokensOnB + preEventTokensOnC <= preEventTokensToUse;
                    ++preEventTokensOnB
                ) {
                    for (let tokensOnA = 0; tokensOnA <= duringEventTokensToUse; ++tokensOnA) {
                        const tokensOnB = duringEventTokensToUse - tokensOnA;
                        const startingIndexA = preEventTokensOnA;
                        const startingIndexB = preEventTokensOnB;
                        const finishingIndexOnA = Math.min(
                            preEventTokensOnA + tokensOnA - 1,
                            allRollingTotal[0].length - 1
                        );
                        const finishingIndexOnB = Math.min(
                            preEventTokensOnB + tokensOnB - 1,
                            allRollingTotal[1].length - 1
                        );
                        const enemiesOnA =
                            allRollingTotal[0][finishingIndexOnA] -
                            allRollingTotal[0][startingIndexA] +
                            allEnemies[0][startingIndexA];
                        const enemiesOnB =
                            allRollingTotal[1][finishingIndexOnB] -
                            allRollingTotal[1][startingIndexB] +
                            allEnemies[1][startingIndexB];
                        const totalEnemies = enemiesOnA + enemiesOnB;

                        if (totalEnemies > bestEnemies) {
                            bestEnemies = totalEnemies;
                            bestStartingIndexA = startingIndexA;
                            bestStartingIndexB = startingIndexB;
                            bestEndingIndexA = finishingIndexOnA;
                            bestEndingIndexB = finishingIndexOnB;
                        }
                    }
                }
            }
        }

        const preEventTokens: OnslaughtTokens = {
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        };
        const eventTokens: OnslaughtTokens = {
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        };
        preEventTokens[trackA] = bestStartingIndexA;
        preEventTokens[trackB] = bestStartingIndexB;
        preEventTokens[trackC] = preEventTokensToUse - bestStartingIndexB - bestStartingIndexA;
        eventTokens[trackA] = bestEndingIndexA - bestStartingIndexA + 1;
        eventTokens[trackB] = bestEndingIndexB - bestStartingIndexB + 1;
        eventTokens[trackC] = 0;
        return {
            preEventTokens,
            eventTokens,
        };
    }

    /**
     * @returns the optimal number of tokens to use on each of the three tracks before the event starts, and during the event.
     *
     * This is an N^4 algorithm using dynamic programming. The memory footprint is small but after about 130-150 tokens, this will start
     * to grind.
     */
    public static calculateTripleTrack(
        onslaughtData: OnslaughtData,
        imperial: OnslaughtBattleKey,
        xenos: OnslaughtBattleKey,
        chaos: OnslaughtBattleKey,
        preEventTokensToUse: number,
        duringEventTokensToUse: number
    ): HsePlan {
        const allEnemies: number[][] = [[], [], []];
        const allRollingTotal: number[][] = [[], [], []];

        let index = 0;
        for (const track of [OnslaughtTrackId.Imperial, OnslaughtTrackId.Xenos, OnslaughtTrackId.Chaos]) {
            const enemies = allEnemies[index];
            const rollingTotal = allRollingTotal[index];
            ++index;
            let nextBattle: OnslaughtBattleKey | undefined =
                track === OnslaughtTrackId.Imperial ? imperial : track === OnslaughtTrackId.Xenos ? xenos : chaos;

            if (nextBattle === undefined) continue;
            for (let i = 0; i < preEventTokensToUse + duringEventTokensToUse; ++i) {
                const zoneData = onslaughtData[nextBattle.track].sectors[nextBattle.sector].killzones[
                    nextBattle.zone
                ] as OnslaughtKillzone;
                if (!zoneData) break;
                nextBattle = this.getBattleAfter(onslaughtData, nextBattle.track, nextBattle.sector, nextBattle.zone);
                if (!nextBattle) break;
                enemies.push(zoneData.totalEnemyCount);
                rollingTotal.push(enemies[i] + (rollingTotal[i - 1] || 0));
            }
        }

        let bestStartingIndex: number[] = [0, 0, 0];
        let bestEndingIndex: number[] = [-1, -1, -1];
        let bestEnemies = 0;
        for (let preEventTokensOnA = 0; preEventTokensOnA <= preEventTokensToUse; ++preEventTokensOnA) {
            for (
                let preEventTokensOnB = 0;
                preEventTokensOnA + preEventTokensOnB <= preEventTokensToUse;
                ++preEventTokensOnB
            ) {
                const preEventTokensOnC = preEventTokensToUse - preEventTokensOnA - preEventTokensOnB;
                for (let tokensOnA = 0; tokensOnA <= duringEventTokensToUse; ++tokensOnA) {
                    for (let tokensOnB = 0; tokensOnB <= duringEventTokensToUse - tokensOnA; ++tokensOnB) {
                        const tokensOnC = duringEventTokensToUse - tokensOnA - tokensOnB;
                        const startingIndex = [preEventTokensOnA, preEventTokensOnB, preEventTokensOnC];
                        const finishingIndex = [
                            Math.min(preEventTokensOnA + tokensOnA - 1, allRollingTotal[0].length - 1),
                            Math.min(preEventTokensOnB + tokensOnB - 1, allRollingTotal[1].length - 1),
                            Math.min(preEventTokensOnC + tokensOnC - 1, allRollingTotal[2].length - 1),
                        ];
                        const enemies = [
                            allRollingTotal[0][finishingIndex[0]] -
                                allRollingTotal[0][startingIndex[0]] +
                                allEnemies[0][startingIndex[0]],

                            allRollingTotal[1][finishingIndex[1]] -
                                allRollingTotal[1][startingIndex[1]] +
                                allEnemies[1][startingIndex[1]],

                            allRollingTotal[2][finishingIndex[2]] -
                                allRollingTotal[2][startingIndex[2]] +
                                allEnemies[2][startingIndex[2]],
                        ];
                        const totalEnemies = enemies[0] + enemies[1] + enemies[2];

                        if (totalEnemies > bestEnemies) {
                            bestEnemies = totalEnemies;
                            bestStartingIndex = startingIndex;
                            bestEndingIndex = finishingIndex;
                        }
                    }
                }
            }
        }

        const preEventTokens: OnslaughtTokens = {
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        };
        const eventTokens: OnslaughtTokens = {
            [OnslaughtTrackId.Imperial]: 0,
            [OnslaughtTrackId.Xenos]: 0,
            [OnslaughtTrackId.Chaos]: 0,
        };
        preEventTokens[OnslaughtTrackId.Imperial] = bestStartingIndex[0];
        preEventTokens[OnslaughtTrackId.Xenos] = bestStartingIndex[1];
        preEventTokens[OnslaughtTrackId.Chaos] = bestStartingIndex[2];
        eventTokens[OnslaughtTrackId.Imperial] = bestEndingIndex[0] - bestStartingIndex[0] + 1;
        eventTokens[OnslaughtTrackId.Xenos] = bestEndingIndex[1] - bestStartingIndex[1] + 1;
        eventTokens[OnslaughtTrackId.Chaos] = bestEndingIndex[2] - bestStartingIndex[2] + 1;
        return {
            preEventTokens,
            eventTokens,
        };
    }

    /** @returns the next battle key after the supplied one. Or undefined if there are no more battles. */
    public static getBattleAfter(
        onslaughtData: OnslaughtData,
        track: OnslaughtTrackId,
        sector: OnslaughtSectorKey,
        zone: OnslaughtZoneKey
    ): OnslaughtBattleKey | undefined {
        const trackData = onslaughtData[track];
        if (!trackData) {
            console.error('Invalid track', track);
            return undefined;
        }
        if (zone + 1 < trackData.sectors[sector].killzones.length) {
            return { track, sector, zone: zone + 1 };
        }
        if (sector + 1 < trackData.sectors.length) {
            return { track, sector: sector + 1, zone: 0 };
        }
        console.error('No more battles after', { track, sector, zone });
        return undefined;
    }

    /**
     * @returns the total number of in-event enemies killed for the specified track, start at
     * sector+zone, using the specified number of pre-event tokens and the specified number of
     * in-event tokens.
     */
    public static computeTotalEnemies(
        onslaughtData: OnslaughtData,
        track: OnslaughtTrackId,
        sector: number,
        zone: number,
        tokens: HsePlan
    ): number {
        const preEventTokens = tokens.preEventTokens[track] ?? 0;
        const duringEventTokens = tokens.eventTokens[track] ?? 0;
        let totalEnemies = 0;
        let nextBattle: OnslaughtBattleKey | undefined = {
            track,
            sector,
            zone,
        };
        for (let i = 0; i < preEventTokens; ++i) {
            nextBattle = this.getBattleAfter(onslaughtData, nextBattle.track, nextBattle.sector, nextBattle.zone);
            if (!nextBattle) return 0;
        }
        for (let i = 0; i < duringEventTokens; ++i) {
            const zoneData = onslaughtData[nextBattle.track].sectors[nextBattle.sector].killzones[
                nextBattle.zone
            ] as OnslaughtKillzone;
            if (!zoneData) break;
            totalEnemies += zoneData.totalEnemyCount;
            nextBattle = this.getBattleAfter(onslaughtData, nextBattle.track, nextBattle.sector, nextBattle.zone);
            if (!nextBattle) return totalEnemies;
        }
        return totalEnemies;
    }
}
