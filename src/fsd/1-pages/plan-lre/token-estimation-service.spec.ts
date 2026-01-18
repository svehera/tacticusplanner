import { describe, it, expect } from 'vitest';

import { LreTrackId } from '@/fsd/4-entities/lre';

import { ILreTeam } from '@/fsd/3-features/lre';

import { ILreTrackProgress, ILreRequirements, ILreBattleProgress, ILreBattleRequirementsProgress } from './lre.models';
import { TokenEstimationService, TokenUse, milestonesAndPoints } from './token-estimation-service';

function createRequirementsProgress(reqs: ILreRequirements[]): ILreBattleRequirementsProgress[] {
    return reqs.map(req => ({
        id: req.id,
        iconId: req.id,
        name: req.id,
        points: req.pointsPerBattle,
        completed: false,
        blocked: false,
    }));
}

function createBattleProgress(index: number, reqs: ILreRequirements[]): ILreBattleProgress {
    return {
        battleIndex: index,
        requirementsProgress: createRequirementsProgress(reqs),
        completed: false,
        totalPoints: 0,
    };
}

function createRequirement(id: string, pointsPerBattle: number): ILreRequirements {
    return {
        id: id,
        iconId: 'unused',
        name: id,
        totalPoints: 0,
        pointsPerBattle: pointsPerBattle,
        completed: false,
    };
}

function createTrack(id: LreTrackId, numBattles: number, reqs: ILreRequirements[]): ILreTrackProgress {
    return {
        trackId: id,
        trackName: id,
        totalPoints: 0,
        battlesPoints: Array(numBattles).fill(0),
        requirements: reqs,
        battles: Array.from({ length: numBattles }, (_, index) => createBattleProgress(numBattles - index - 1, reqs)),
    };
}

// '_killPoints', '_highScore', '_defeatAll']
const alphaTrack = createTrack('alpha', 3, [
    createRequirement('_killPoints', 45),
    createRequirement('_highScore', 45),
    createRequirement('_defeatAll', 60),
    createRequirement('NoPierce', 50),
    createRequirement('Pierce', 60),
    createRequirement('Flame', 70),
    createRequirement('NoFlame', 80),
    createRequirement('OnlyOrks', 90),
]);

// '_killPoints', '_highScore', '_defeatAll']
const betaTrack = createTrack('beta', 3, [
    createRequirement('_killPoints', 45),
    createRequirement('_highScore', 45),
    createRequirement('_defeatAll', 60),
    createRequirement('NoPower', 90),
    createRequirement('Power', 80),
    createRequirement('NoBolter', 70),
    createRequirement('Bolter', 60),
    createRequirement('OnlyBlackLegion', 50),
]);

// '_killPoints', '_highScore', '_defeatAll']
const gammaTrack = createTrack('gamma', 3, [
    createRequirement('_killPoints', 45),
    createRequirement('_highScore', 45),
    createRequirement('_defeatAll', 60),
    createRequirement('Toxic', 50),
    createRequirement('Physical', 50),
    createRequirement('Psychic', 50),
    createRequirement('Direct', 50),
    createRequirement('RapidAssault', 50),
]);

describe('TokenEstimationService', () => {
    describe('getFurthestMilestoneAchievedSmokeTest', () => {
        it('should return the correct milestone index for a few select sample points', () => {
            const idx1 = TokenEstimationService.getFurthestCurrencyMilestoneAchieved(500);
            expect(idx1).not.toBe(-1);
            expect(milestonesAndPoints[idx1].stars).toBe(3);
            expect(milestonesAndPoints[idx1].round).toBe(3);

            const idx2 = TokenEstimationService.getFurthestCurrencyMilestoneAchieved(13000);
            expect(idx2).not.toBe(-1);
            expect(milestonesAndPoints[idx2].stars).toBe(3);
            expect(milestonesAndPoints[idx2].round).toBe(1);

            const idx3 = TokenEstimationService.getFurthestCurrencyMilestoneAchieved(20000);
            expect(idx3).not.toBe(-1);
            expect(milestonesAndPoints[idx3].stars).toBe(6);
        });

        it('should return -1 if no milestone is achieved', () => {
            expect(TokenEstimationService.getFurthestCurrencyMilestoneAchieved(50)).toBe(-1);
        });
    });

    describe('computeNextToken', () => {
        it('if there is a clear best token, return it', () => {
            const tracks = [{ ...alphaTrack }, { ...betaTrack }, { ...gammaTrack }];
            const alphaTeam1: ILreTeam = {
                id: 'team1',
                name: 'Alpha Team 1',
                section: 'alpha',
                restrictionsIds: ['Pierce', 'Flame'],
                charSnowprintIds: ['char1', 'char2', 'char3'],
                expectedBattleClears: 1,
            };
            const alphaTeam2: ILreTeam = {
                id: 'team2',
                name: 'Alpha Team 2',
                section: 'alpha',
                restrictionsIds: ['Pierce'],
                charSnowprintIds: ['char1', 'char2', 'char3', 'char4', 'char5'],
                expectedBattleClears: 2,
            };
            const bestToken = TokenEstimationService.computeNextToken(tracks, [alphaTeam1, alphaTeam2], undefined);
            expect(bestToken.team).toBeDefined();
            expect(bestToken.team?.id ?? '').toBe('team1');
            expect(bestToken.battleNumber).toBe(0);
            expect(bestToken.incrementalPoints).toBe(45 + 45 + 60 + 60 + 70);
            expect(bestToken.restrictionsCleared.map(restriction => restriction.name).sort()).containSubset([
                'Flame',
                'Pierce',
            ]);
        });

        it('when all battles are complete, returns undefined', () => {
            const tracks = [{ ...alphaTrack }];
            tracks[0].battles.forEach(battle => (battle.completed = true));
            const alphaTeam1: ILreTeam = {
                id: 'team1',
                name: 'Alpha Team 1',
                section: 'alpha',
                restrictionsIds: ['Pierce', 'Flame'],
                charSnowprintIds: ['char1', 'char2', 'char3'],
                expectedBattleClears: 1,
            };
            const bestToken = TokenEstimationService.computeNextToken(tracks, [alphaTeam1], undefined);
            expect(bestToken.team).not.toBeDefined();
        });

        it('prefers to continue with the same team in the next battle when there is a tie between tracks', () => {
            // Create requirements for alpha and beta
            const alphaReqs = [
                createRequirement('_killPoints', 45),
                createRequirement('_highScore', 45),
                createRequirement('_defeatAll', 60),
                createRequirement('Pierce', 60),
                createRequirement('Flame', 70),
            ];
            const betaReqs = [
                createRequirement('_killPoints', 45),
                createRequirement('_highScore', 45),
                createRequirement('_defeatAll', 60),
                createRequirement('Power', 60),
                createRequirement('NoPower', 70),
            ];
            const gammaReqs = [
                createRequirement('_killPoints', 45),
                createRequirement('_highScore', 45),
                createRequirement('_defeatAll', 60),
            ];

            const alphaTrack = createTrack('alpha', 3, alphaReqs);
            const betaTrack = createTrack('beta', 3, betaReqs);
            const gammaTrack = createTrack('gamma', 3, gammaReqs);

            // Mark the three default restrictions as completed in the first battle of alpha and beta
            [alphaTrack, betaTrack].forEach(track => {
                const battle = track.battles[track.battles.length - 1]; // battle 0
                [0, 1, 2].forEach(idx => {
                    battle.requirementsProgress[idx].completed = true;
                });
            });

            // Team 1 can clear 'Pierce' and 'Flame' in alpha
            const team1: ILreTeam = {
                id: 'team1',
                name: 'Alpha Team',
                section: 'alpha',
                restrictionsIds: ['Pierce', 'Flame'],
                charSnowprintIds: ['char1', 'char2', 'char3'],
                expectedBattleClears: 3,
            };
            // Team 2 can clear 'Power' and 'NoPower' in beta
            const team2: ILreTeam = {
                id: 'team2',
                name: 'Beta Team',
                section: 'beta',
                restrictionsIds: ['Power', 'NoPower'],
                charSnowprintIds: ['char4', 'char5', 'char6'],
                expectedBattleClears: 3,
            };

            // Mark 'Pierce' as already cleared in alpha battle 0, and 'Power' as already cleared in beta battle 0
            alphaTrack.battles[alphaTrack.battles.length - 1].requirementsProgress.find(
                r => r.id === 'Pierce'
            )!.completed = true;
            betaTrack.battles[betaTrack.battles.length - 1].requirementsProgress.find(
                r => r.id === 'Power'
            )!.completed = true;

            // Simulate that the last token used was team1 in alpha, clearing 'Pierce' in battle 0
            const lastToken = new TokenUse();
            lastToken.team = team1;
            lastToken.battleNumber = 0;
            lastToken.incrementalPoints = 60;
            lastToken.restrictionsCleared = [
                {
                    id: 'Pierce',
                    iconId: 'Pierce',
                    name: 'Pierce',
                    pointsPerBattle: 60,
                    totalPoints: 0,
                    completed: true,
                },
            ];

            // Now, computeNextToken should prefer to continue with team1 in alpha, battle 1, clearing 'Flame'
            const tracks = [alphaTrack, betaTrack, gammaTrack];
            const nextToken = TokenEstimationService.computeNextToken(tracks, [team1, team2], lastToken);

            expect(nextToken.team).toBeDefined();
            expect(nextToken.team?.id).toBe('team1');
            expect(nextToken.team?.section).toBe('alpha');
            expect(nextToken.battleNumber).toBe(1);
            expect(nextToken.restrictionsCleared.map(r => r.id)).toContain('Flame');
            // Should not be using team2 in beta, even though the points are the same
        });
        it(
            'if one track has two battles with the same number of available points, returns ' +
                'the lower of the two battles.',
            () => {
                // Clone tracks to avoid mutation between tests
                // Define local requirements for each track
                const alphaReqs = [
                    createRequirement('_killPoints', 45),
                    createRequirement('_highScore', 45),
                    createRequirement('_defeatAll', 60),
                    createRequirement('NoPierce', 50),
                    createRequirement('Pierce', 60),
                    createRequirement('Flame', 70),
                    createRequirement('NoFlame', 80),
                    createRequirement('OnlyOrks', 90),
                ];
                const betaReqs = [
                    createRequirement('_killPoints', 45),
                    createRequirement('_highScore', 45),
                    createRequirement('_defeatAll', 60),
                    createRequirement('NoPower', 90),
                    createRequirement('Power', 80),
                    createRequirement('NoBolter', 70),
                    createRequirement('Bolter', 60),
                    createRequirement('OnlyBlackLegion', 50),
                ];
                const gammaReqs = [
                    createRequirement('_killPoints', 45),
                    createRequirement('_highScore', 45),
                    createRequirement('_defeatAll', 60),
                    createRequirement('Toxic', 50),
                    createRequirement('Physical', 50),
                    createRequirement('Psychic', 50),
                    createRequirement('Direct', 50),
                    createRequirement('RapidAssault', 50),
                ];

                // Create local tracks
                const tracks = [
                    createTrack('alpha', 3, alphaReqs),
                    createTrack('beta', 3, betaReqs),
                    createTrack('gamma', 3, gammaReqs),
                ];

                // Mark all requirements as completed for beta and gamma (fully completed)
                tracks[1].battles.forEach(battle => {
                    battle.completed = true;
                    battle.requirementsProgress.forEach(req => (req.completed = true));
                });
                tracks[2].battles.forEach(battle => {
                    battle.completed = true;
                    battle.requirementsProgress.forEach(req => (req.completed = true));
                });

                // For alpha, mark some requirements as completed in all battles
                tracks[0].battles.forEach(battle => {
                    [0, 1, 2].forEach(idx => {
                        battle.requirementsProgress[idx].completed = true;
                    });
                    battle.requirementsProgress.find(req => req.id === 'Pierce')!.completed = true;
                });

                // Teams that can clear the next available restriction in alpha
                const alphaTeam: ILreTeam = {
                    id: 'team1',
                    name: 'Alpha Team',
                    section: 'alpha',
                    restrictionsIds: ['NoPierce'],
                    charSnowprintIds: ['char1', 'char2', 'char3'],
                    expectedBattleClears: 3,
                };

                // Call computeNextToken
                const bestToken = TokenEstimationService.computeNextToken(tracks, [alphaTeam], undefined);

                // Should return a token for the first (lowest index) incomplete battle in alpha
                expect(bestToken.team).toBeDefined();
                expect(bestToken.team?.id).toBe('team1');
                expect(bestToken.battleNumber).toBe(0);
                expect(bestToken.team?.section).toBe('alpha');
            }
        );
        it(
            'if multiple tracks have battles with the same number of available points, returns ' +
                'a token with the lower battle number between the tracks.',
            () => {
                // Create requirements for each track
                const alphaReqs = [
                    createRequirement('_killPoints', 45),
                    createRequirement('_highScore', 45),
                    createRequirement('_defeatAll', 60),
                    createRequirement('Pierce', 60),
                ];
                const betaReqs = [
                    createRequirement('_killPoints', 45),
                    createRequirement('_highScore', 45),
                    createRequirement('_defeatAll', 60),
                    createRequirement('Power', 60),
                ];
                const gammaReqs = [
                    createRequirement('_killPoints', 45),
                    createRequirement('_highScore', 45),
                    createRequirement('_defeatAll', 60),
                    createRequirement('Toxic', 60),
                ];

                // Create tracks with 3 battles each
                const alphaTrack = createTrack('alpha', 3, alphaReqs);
                const betaTrack = createTrack('beta', 3, betaReqs);
                const gammaTrack = createTrack('gamma', 3, gammaReqs);

                // Mark the three default restrictions as completed in battle 0 for all tracks
                [alphaTrack, betaTrack, gammaTrack].forEach(track => {
                    const battle = track.battles[track.battles.length - 1]; // battle 0
                    [0, 1, 2].forEach(idx => {
                        battle.requirementsProgress[idx].completed = true;
                    });
                });

                // Team 1 can clear 'Pierce' in alpha, Team 2 can clear 'Power' in beta
                const team1: ILreTeam = {
                    id: 'team1',
                    name: 'Alpha Team',
                    section: 'alpha',
                    restrictionsIds: ['Pierce'],
                    charSnowprintIds: ['char1', 'char2', 'char3'],
                    expectedBattleClears: 3,
                };
                const team2: ILreTeam = {
                    id: 'team2',
                    name: 'Beta Team',
                    section: 'beta',
                    restrictionsIds: ['Power'],
                    charSnowprintIds: ['char4', 'char5', 'char6'],
                    expectedBattleClears: 3,
                };

                // Mark 'Pierce' as already cleared in alpha battle 0 and 1, and 'Power' as already
                // cleared in beta battle 0.
                [1, 2].forEach(
                    index =>
                        (alphaTrack.battles[index].requirementsProgress.find(r => r.id === 'Pierce')!.completed = true)
                );
                betaTrack.battles[2].requirementsProgress.find(r => r.id === 'Power')!.completed = true;

                // Now, both alpha and beta have their first battle fully completed, so next available is battle 1
                // Both teams can clear their respective restrictions in battle 1, which are worth the same points

                // Call computeNextToken
                const tracks = [alphaTrack, betaTrack, gammaTrack];
                const bestToken = TokenEstimationService.computeNextToken(tracks, [team1, team2], undefined);

                expect(bestToken.team).toBeDefined();
                expect(bestToken.team?.id).toBe(team2.id);
                expect(bestToken.team?.section).toBe(team2.section);
                expect(bestToken.battleNumber).toBe(1);
            }
        );
    });

    describe('computeAllTokenUsage', () => {
        it('should return the correct sequence of tokens to use', () => {
            const alphaReqs = [
                createRequirement('_killPoints', 45),
                createRequirement('_highScore', 45),
                createRequirement('_defeatAll', 60),
                createRequirement('Physical', 70),
                createRequirement('Pierce', 80),
                createRequirement('Power', 35),
                createRequirement('Plasma', 105),
                createRequirement('Psychic', 60),
            ];
            const betaReqs = [
                createRequirement('_killPoints', 40),
                createRequirement('_highScore', 40),
                createRequirement('_defeatAll', 70),
                createRequirement('BlackLegion', 120),
                createRequirement('WorldEaters', 60),
                createRequirement('ThousandSons', 50),
                createRequirement('DeathGuard', 40),
                createRequirement('EmperorsChildren', 80),
            ];
            const gammaReqs = [
                createRequirement('_killPoints', 50),
                createRequirement('_highScore', 50),
                createRequirement('_defeatAll', 50),
                createRequirement('Max1Hits', 100),
                createRequirement('Max2Hits', 75),
                createRequirement('Max3Hits', 80),
                createRequirement('Min5Hits', 30),
                createRequirement('Min6Hits', 65),
            ];

            // Create tracks with 3 battles each
            const alphaTrack = createTrack('alpha', 3, alphaReqs);
            const betaTrack = createTrack('beta', 3, betaReqs);
            const gammaTrack = createTrack('gamma', 3, gammaReqs);

            // Define 8 teams, each focused on a single track and covering a subset of restrictions
            const teams: ILreTeam[] = [
                // Alpha teams
                {
                    id: 'alpha-team-1',
                    name: 'Alpha Physical & Pierce',
                    section: 'alpha',
                    restrictionsIds: ['Physical', 'Pierce'],
                    charSnowprintIds: ['charA1', 'charA2', 'charA3'],
                    expectedBattleClears: 2,
                },
                {
                    id: 'alpha-team-2',
                    name: 'Alpha Power & Plasma',
                    section: 'alpha',
                    restrictionsIds: ['Power', 'Plasma'],
                    charSnowprintIds: ['charA4', 'charA5', 'charA6'],
                    expectedBattleClears: 2,
                },
                {
                    id: 'alpha-team-3',
                    name: 'Alpha Psychic',
                    section: 'alpha',
                    restrictionsIds: ['Psychic'],
                    charSnowprintIds: ['charA7', 'charA8', 'charA9'],
                    expectedBattleClears: 1,
                },
                // Beta teams
                {
                    id: 'beta-team-1',
                    name: 'Beta BlackLegion & WorldEaters',
                    section: 'beta',
                    restrictionsIds: ['BlackLegion', 'WorldEaters'],
                    charSnowprintIds: ['charB1', 'charB2', 'charB3'],
                    expectedBattleClears: 2,
                },
                {
                    id: 'beta-team-2',
                    name: 'Beta ThousandSons & DeathGuard',
                    section: 'beta',
                    restrictionsIds: ['ThousandSons', 'DeathGuard'],
                    charSnowprintIds: ['charB4', 'charB5', 'charB6'],
                    expectedBattleClears: 2,
                },
                {
                    id: 'beta-team-3',
                    name: 'Beta EmperorsChildren',
                    section: 'beta',
                    restrictionsIds: ['EmperorsChildren'],
                    charSnowprintIds: ['charB7', 'charB8', 'charB9'],
                    expectedBattleClears: 1,
                },
                // Gamma teams
                {
                    id: 'gamma-team-1',
                    name: 'Gamma Max1Hits & Max2Hits',
                    section: 'gamma',
                    restrictionsIds: ['Max1Hits', 'Max2Hits'],
                    charSnowprintIds: ['charG1', 'charG2', 'charG3'],
                    expectedBattleClears: 2,
                },
                {
                    id: 'gamma-team-2',
                    name: 'Gamma Max3Hits & Min5Hits & Min6Hits',
                    section: 'gamma',
                    restrictionsIds: ['Max3Hits', 'Min5Hits', 'Min6Hits'],
                    charSnowprintIds: ['charG4', 'charG5', 'charG6'],
                    expectedBattleClears: 3,
                },
            ];

            // Now call computeAllTokenUsage with these teams and the tracks
            const tokenUsage = TokenEstimationService.computeAllTokenUsage([alphaTrack, betaTrack, gammaTrack], teams);

            // For this smoke test, just check that the result is an array and has at least one token use
            expect(Array.isArray(tokenUsage)).toBe(true);
            expect(tokenUsage.length).toBeGreaterThan(0);

            // Ensure array is sorted in descending order by incrementalPoints
            for (let i = 1; i < tokenUsage.length; i++) {
                expect(tokenUsage[i - 1].incrementalPoints).toBeGreaterThanOrEqual(tokenUsage[i].incrementalPoints);
            }

            // Ensure that for each track, battles are cleared in order (battle 0, then 1, then 2, etc.)
            const trackBattleMap: Record<string, number[]> = {};
            for (const token of tokenUsage) {
                const track = token.team?.section;
                if (!track) continue;
                if (!trackBattleMap[track]) trackBattleMap[track] = [];
                trackBattleMap[track].push(token.battleNumber);
            }
            for (const battles of Object.values(trackBattleMap)) {
                // For each attempted battle in this track, ensure all previous battles were already attempted
                const attempted = new Set<number>();
                for (const battleNum of battles) {
                    // All previous battles must have been attempted
                    for (let prev = 0; prev < battleNum; prev++) {
                        expect(attempted.has(prev)).toBe(true);
                    }
                    attempted.add(battleNum);
                }
            }
        });
        it('should return an empty array if no tokens can be used', () => {
            // Setup: All restrictions that the teams could have completed are already completed,
            // but there are still uncleared restrictions in some battles (that no team can clear
            // due to expectedBattleClears being too low or not matching those restrictions).

            // Create requirements for a track
            const reqs = [
                createRequirement('_killPoints', 45),
                createRequirement('_highScore', 45),
                createRequirement('_defeatAll', 60),
                createRequirement('Pierce', 60),
                createRequirement('Flame', 70),
                createRequirement('Power', 80),
            ];

            // Create a track with 2 battles
            const track = createTrack('alpha', 2, reqs);

            // Teams can only clear 'Pierce' and 'Flame', but have expectedBattleClears = 1 (so only battle 0)
            const team1: ILreTeam = {
                id: 'team1',
                name: 'Alpha Team',
                section: 'alpha',
                restrictionsIds: ['Pierce'],
                charSnowprintIds: ['char1', 'char2', 'char3'],
                expectedBattleClears: 2,
            };
            const team2: ILreTeam = {
                id: 'team2',
                name: 'Alpha Team 2',
                section: 'alpha',
                restrictionsIds: ['Flame'],
                charSnowprintIds: ['char4', 'char5', 'char6'],
                expectedBattleClears: 1,
            };

            // Mark all restrictions that the teams could have completed as completed in battle 0
            const battle0 = track.battles[track.battles.length - 1]; // battle 0
            battle0.requirementsProgress.forEach(req => {
                if (
                    team1.restrictionsIds.includes(req.id) ||
                    team2.restrictionsIds.includes(req.id) ||
                    ['_killPoints', '_highScore', '_defeatAll'].includes(req.id)
                ) {
                    req.completed = true;
                }
            });
            battle0.completed = battle0.requirementsProgress.every(req => req.completed);

            // In battle 1, leave 'Power' incomplete (no team can clear it), and mark the rest as completed
            const battle1 = track.battles[track.battles.length - 2]; // battle 1
            battle1.requirementsProgress.forEach(req => {
                if (req.id !== 'Power') {
                    req.completed = true;
                }
            });

            // Now, computeAllTokenUsage should return an empty array, since teams can't clear any more restrictions
            const tokens = TokenEstimationService.computeAllTokenUsage([track], [team1, team2]);
            expect(tokens).toEqual([]);
        });
    });

    describe('computeCurrentPoints', () => {
        it('should compute the total points earned in a track', () => {
            // Track 1: nothing cleared
            // Each track: 3 default + 5 non-default restrictions, total points = 500 per track

            // Track 1: nothing cleared
            const reqs1 = [
                createRequirement('_killPoints', 50),
                createRequirement('_highScore', 50),
                createRequirement('_defeatAll', 50),
                createRequirement('SpecialA', 75),
                createRequirement('SpecialB', 75),
                createRequirement('SpecialC', 50),
                createRequirement('SpecialD', 75),
                createRequirement('SpecialE', 75),
            ];
            const track1 = createTrack('alpha', 3, reqs1);

            // Track 2: some battles fully cleared, some partially, some untouched
            const reqs2 = [
                createRequirement('_killPoints', 50),
                createRequirement('_highScore', 50),
                createRequirement('_defeatAll', 50),
                createRequirement('SpecialA', 75),
                createRequirement('SpecialB', 75),
                createRequirement('SpecialC', 50),
                createRequirement('SpecialD', 75),
                createRequirement('SpecialE', 75),
            ];
            const track2 = createTrack('beta', 4, reqs2);

            // Track 3: all battles fully cleared
            const reqs3 = [
                createRequirement('_killPoints', 63),
                createRequirement('_highScore', 63),
                createRequirement('_defeatAll', 63),
                createRequirement('SpecialA', 63),
                createRequirement('SpecialB', 62),
                createRequirement('SpecialC', 62),
                createRequirement('SpecialD', 62),
                createRequirement('SpecialE', 62),
            ];
            const track3 = createTrack('gamma', 2, reqs3);

            // The alpha track is untouched.

            // The beta track has some points from the first two battles.
            // Battle 0 (last): fully cleared
            track2.battles[3].requirementsProgress.forEach(req => (req.completed = true));
            track2.battles[3].completed = true;
            // Battle 1: partially cleared (only _killPoints and _highScore)
            track2.battles[2].requirementsProgress.forEach(req => {
                if (['_killPoints', '_highScore'].includes(req.id)) req.completed = true;
            });

            // The gamma track is fully cleared.
            track3.battles.forEach(battle => {
                battle.requirementsProgress.forEach(req => (req.completed = true));
                battle.completed = true;
            });

            const points1 = TokenEstimationService.computeCurrentPointsInTrack(track1);
            const points2 = TokenEstimationService.computeCurrentPointsInTrack(track2);
            const points3 = TokenEstimationService.computeCurrentPointsInTrack(track3);

            // Track 1: nothing cleared, so 0
            expect(points1).toBe(0);
            expect(points2).toBe(500 + 100);
            expect(points3).toBe(1000);
        });

        it('should return 0 if no requirements are completed', () => {
            // Create requirements for three tracks, each with 3 default + 5 other restrictions
            const reqsAlpha = [
                createRequirement('_killPoints', 40),
                createRequirement('_highScore', 40),
                createRequirement('_defeatAll', 60),
                createRequirement('AlphaA', 50),
                createRequirement('AlphaB', 55),
                createRequirement('AlphaC', 60),
                createRequirement('AlphaD', 65),
                createRequirement('AlphaE', 70),
            ];
            const reqsBeta = [
                createRequirement('_killPoints', 41),
                createRequirement('_highScore', 41),
                createRequirement('_defeatAll', 61),
                createRequirement('BetaA', 51),
                createRequirement('BetaB', 56),
                createRequirement('BetaC', 61),
                createRequirement('BetaD', 66),
                createRequirement('BetaE', 71),
            ];
            const reqsGamma = [
                createRequirement('_killPoints', 42),
                createRequirement('_highScore', 42),
                createRequirement('_defeatAll', 62),
                createRequirement('GammaA', 52),
                createRequirement('GammaB', 57),
                createRequirement('GammaC', 62),
                createRequirement('GammaD', 67),
                createRequirement('GammaE', 72),
            ];

            const alphaTrack = createTrack('alpha', 3, reqsAlpha);
            const betaTrack = createTrack('beta', 3, reqsBeta);
            const gammaTrack = createTrack('gamma', 3, reqsGamma);

            // No requirements are completed in any battle
            alphaTrack.battles.forEach(battle => {
                battle.requirementsProgress.forEach(req => (req.completed = false));
                battle.completed = false;
            });
            betaTrack.battles.forEach(battle => {
                battle.requirementsProgress.forEach(req => (req.completed = false));
                battle.completed = false;
            });
            gammaTrack.battles.forEach(battle => {
                battle.requirementsProgress.forEach(req => (req.completed = false));
                battle.completed = false;
            });

            expect(TokenEstimationService.computeCurrentPointsInTrack(alphaTrack)).toBe(0);
            expect(TokenEstimationService.computeCurrentPointsInTrack(betaTrack)).toBe(0);
            expect(TokenEstimationService.computeCurrentPointsInTrack(gammaTrack)).toBe(0);
        });
    });

    describe('computeMinimumTokensToClearBattle', () => {
        it('returns undefined if not all restrictions can be cleared in a battle', () => {
            expect(
                TokenEstimationService.computeMinimumTokensToClearBattle([
                    {
                        id: 'team4',
                        name: 'Team 4',
                        section: 'alpha',
                        restrictionsIds: ['SpecialA', 'SpecialB', 'SpecialC', 'SpecialD'],
                        charSnowprintIds: ['char10', 'char11', 'char12'],
                        expectedBattleClears: 3,
                    },
                ] as ILreTeam[])
            ).toBeUndefined();
        });

        it('returns 5 if all teams each clear one restriction', () => {
            expect(
                TokenEstimationService.computeMinimumTokensToClearBattle([
                    {
                        id: 'team1',
                        name: 'Team 1',
                        section: 'alpha',
                        restrictionsIds: ['Flame'],
                        charSnowprintIds: ['char1'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team2',
                        name: 'Team 2',
                        section: 'alpha',
                        restrictionsIds: ['Physical'],
                        charSnowprintIds: ['char2'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team3',
                        name: 'Team 3',
                        section: 'alpha',
                        restrictionsIds: ['Psychic'],
                        charSnowprintIds: ['char3'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team4',
                        name: 'Team 4',
                        section: 'alpha',
                        restrictionsIds: ['Bolter'],
                        charSnowprintIds: ['char4'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team5',
                        name: 'Team 5',
                        section: 'alpha',
                        restrictionsIds: ['Direct'],
                        charSnowprintIds: ['char5'],
                        expectedBattleClears: 1,
                    },
                ] as ILreTeam[])
            ).toBe(5);
        });

        it('considers and respects overlapping coverage, but still returns the minimum number of battles to clear', () => {
            expect(
                TokenEstimationService.computeMinimumTokensToClearBattle([
                    {
                        id: 'team1',
                        name: 'Team 1',
                        section: 'alpha',
                        restrictionsIds: ['Flame'],
                        charSnowprintIds: ['char1'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team2',
                        name: 'Team 2',
                        section: 'alpha',
                        restrictionsIds: ['Physical', 'Flame'],
                        charSnowprintIds: ['char2'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team3',
                        name: 'Team 3',
                        section: 'alpha',
                        restrictionsIds: ['Psychic', 'Flame'],
                        charSnowprintIds: ['char3'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team4',
                        name: 'Team 4',
                        section: 'alpha',
                        restrictionsIds: ['Bolter', 'Flame'],
                        charSnowprintIds: ['char4'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team5',
                        name: 'Team 5',
                        section: 'alpha',
                        restrictionsIds: ['Direct', 'Flame'],
                        charSnowprintIds: ['char5'],
                        expectedBattleClears: 1,
                    },
                ] as ILreTeam[])
            ).toBe(4);
        });

        it('recognizes that some teams are unnecessary because other teams cover their restrictions plus more', () => {
            expect(
                TokenEstimationService.computeMinimumTokensToClearBattle([
                    {
                        id: 'team1',
                        name: 'Team 1',
                        section: 'alpha',
                        restrictionsIds: ['Flame', 'Physical', 'Piercing'],
                        charSnowprintIds: ['char1'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team2',
                        name: 'Team 2',
                        section: 'alpha',
                        restrictionsIds: ['Direct', 'Psychic'],
                        charSnowprintIds: ['char2'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team3',
                        name: 'Team 3',
                        section: 'alpha',
                        restrictionsIds: ['Psychic', 'Flame'],
                        charSnowprintIds: ['char3'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team4',
                        name: 'Team 4',
                        section: 'alpha',
                        restrictionsIds: ['Piercing', 'Flame'],
                        charSnowprintIds: ['char4'],
                        expectedBattleClears: 1,
                    },
                    {
                        id: 'team5',
                        name: 'Team 5',
                        section: 'alpha',
                        restrictionsIds: ['Piercing'],
                        charSnowprintIds: ['char5'],
                        expectedBattleClears: 1,
                    },
                ] as ILreTeam[])
            ).toBe(2); // the first two teams clear everything, the other three are unnecessary.
        });
    });
});
