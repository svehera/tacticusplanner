import { useState } from 'react';

import { SupportSection } from '@/fsd/5-shared/ui/support-banner';

import { RequirementStatus } from '@/fsd/3-features/lre';
// eslint-disable-next-line import-x/no-internal-modules
import { ProgressState } from '@/fsd/3-features/lre-progress/enums';

import { LeBattle } from './le-battle';
import { ILeBattles, LeBattleService } from './le-battle.service';
import { LeTokenCard } from './le-token-card';
import { LeTokenMilestoneCardGrid } from './le-token-milestone-card-grid';
import { renderMilestone, renderRestrictions, renderTeam } from './le-token-render-utils';
import { LeTokenTable } from './le-token-table';
import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreTrackProgress, LeTokenCardRenderMode } from './lre.models';
import { milestonesAndPoints, TokenDisplay, TokenUse } from './token-estimation-service';

interface Props {
    battles: ILeBattles | undefined;
    tokens: TokenUse[];
    currentPoints: number;
    tokenDisplays: TokenDisplay[];
    tracksProgress: ILreTrackProgress[];
    eventStartTime: number | undefined;
    showP2P: boolean;
    nextTokenCompleted: (tokenIndex: number) => void;
    toggleBattleState: (
        trackId: 'alpha' | 'beta' | 'gamma',
        battleIndex: number,
        reqId: string,
        state: ProgressState
    ) => void;
}

/**
 * Displays the tokenomics of a Legendary Event (LE), including milestones
 * already achieved, and a table of tokens to use, and which milestones they
 * achieve.
 */
export const LeTokenomics: React.FC<Props> = ({
    battles,
    tokens,
    currentPoints,
    tokenDisplays,
    tracksProgress,
    eventStartTime,
    showP2P,
    nextTokenCompleted,
    toggleBattleState,
}: Props) => {
    const [isFirstTokenBattleVisible, setIsFirstTokenBattleVisible] = useState<boolean>(false);
    const projectedAdditionalPoints = tokens.reduce((sum, token) => sum + (token.incrementalPoints || 0), 0);
    const finalProjectedPoints = currentPoints + projectedAdditionalPoints;

    const missedMilestones = milestonesAndPoints
        .filter(milestone => milestone.points > finalProjectedPoints && (showP2P || milestone.packsPerRound === 0))
        .sort((a, b) => a.points - b.points);

    // Helper function to check if a token has yellow or red restrictions
    const hasWarningRestrictions = (token: TokenDisplay): boolean => {
        return token.restricts.some(restrict => {
            const status = LreRequirementStatusService.getRequirementStatus(
                tracksProgress,
                token.track as 'alpha' | 'beta' | 'gamma',
                token.battleNumber,
                restrict.id
            );
            return status === RequirementStatus.MaybeClear || status === RequirementStatus.StopHere;
        });
    };

    // Find the first token that doesn't have yellow/red restrictions
    const firstToken = tokenDisplays.find(token => !hasWarningRestrictions(token)) ?? null;
    const firstTokenIndex = firstToken ? tokenDisplays.indexOf(firstToken) : -1;

    const millisRemaining = () => {
        if (eventStartTime === undefined) return 0;
        const now = Date.now();
        const EVENT_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        return Math.max(EVENT_DURATION - (now - eventStartTime), 0);
    };

    const freeTokensRemaining = millisRemaining() === 0 ? 'N/A' : Math.floor(millisRemaining() / (3 * 60 * 60 * 1000));
    const adTokensRemaining = millisRemaining() === 0 ? 'N/A' : Math.floor(millisRemaining() / (24 * 60 * 60 * 1000));

    const characterPortrait = () => {
        return <span>character portrait goes here</span>;
    };

    return (
        <div className="flex flex-col w-full gap-y-8">
            {firstToken && (
                <div className="flex flex-col items-center w-full gap-y-4">
                    <div className="flex gap-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>Free Tokens Remaining: {freeTokensRemaining}</div>
                        <div>Ad Tokens Remaining: {adTokensRemaining}</div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Next Token</h3>
                    </div>
                    <div className="justify-center w-full md:w-2/3 lg:w-1/2">
                        <LeTokenCard
                            token={firstToken}
                            index={firstTokenIndex}
                            renderMode={LeTokenCardRenderMode.kStandalone}
                            currentPoints={currentPoints}
                            renderMilestone={index => renderMilestone(index, showP2P)}
                            renderRestrictions={x =>
                                renderRestrictions(
                                    x,
                                    tracksProgress,
                                    firstToken.track as 'alpha' | 'beta' | 'gamma',
                                    firstToken.battleNumber,
                                    35
                                )
                            }
                            renderTeam={x => renderTeam(x, 30)}
                            isBattleVisible={isFirstTokenBattleVisible}
                            onToggleBattle={() => setIsFirstTokenBattleVisible(!isFirstTokenBattleVisible)}
                            onCompleteBattle={() => nextTokenCompleted(firstTokenIndex)}
                        />
                        {isFirstTokenBattleVisible &&
                            LeBattleService.getBattleFromToken(firstToken, battles) !== undefined && (
                                <div className="w-full mt-4">
                                    <LeBattle
                                        battle={LeBattleService.getBattleFromToken(firstToken, battles)!}
                                        trackName={firstToken.track}
                                    />
                                </div>
                            )}
                        {isFirstTokenBattleVisible &&
                            LeBattleService.getBattleFromToken(firstToken, battles) === undefined && (
                                <div className="w-full p-4 mt-4 text-center text-gray-600 border border-gray-300 dark:text-gray-500 dark:border-gray-700 rounded-xl">
                                    Battle data not available.
                                </div>
                            )}
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-y-8">
                <SupportSection />
            </div>

            <div className="flex flex-col items-center w-full gap-y-4">{characterPortrait()}</div>

            <div key="tokens" className="flex flex-col w-full gap-2">
                <LeTokenTable
                    battles={battles}
                    tokenDisplays={tokenDisplays}
                    tracksProgress={tracksProgress}
                    showP2P={showP2P}
                    toggleBattleState={toggleBattleState}
                />
            </div>
            {missedMilestones.length > 0 && (
                <div className="flex flex-col items-center w-full pt-6 mt-4 border-t-2 border-gray-200 gap-y-4 dark:border-gray-700">
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                            Milestones Projected to Miss
                        </h3>
                        <p className="text-sm text-gray-500">
                            Based on current points ({currentPoints}) + tokens listed above (+
                            {projectedAdditionalPoints})
                        </p>
                    </div>

                    <LeTokenMilestoneCardGrid
                        milestonesToList={missedMilestones}
                        emptyMessage=""
                        isMissedVariant={true}
                    />
                </div>
            )}
        </div>
    );
};
