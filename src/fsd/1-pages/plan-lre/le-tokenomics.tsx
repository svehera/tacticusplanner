import { useContext, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { SupportSection } from '@/fsd/5-shared/ui/support-banner';

// eslint-disable-next-line import-x/no-internal-modules
import { ProgressState } from '@/fsd/3-features/lre-progress/enums';

import { LeBattle } from './le-battle';
import { ILeBattles, LeBattleService } from './le-battle.service';
import { LeTokenCard } from './le-token-card';
import { LeTokenMilestoneCardGrid } from './le-token-milestone-card-grid';
import { renderMilestone, renderRestrictions, renderTeam } from './le-token-render-utils';
import { LeTokenTable } from './le-token-table';
import { LeTokenCardRenderMode } from './lre.models';
import { milestonesAndPoints, TokenDisplay, TokenUse } from './token-estimation-service';

interface Props {
    battles: ILeBattles | undefined;
    tokens: TokenUse[];
    currentPoints: number;
    tokenDisplays: TokenDisplay[];
    nextTokenCompleted: () => void;
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
    nextTokenCompleted,
    toggleBattleState,
}: Props) => {
    const { viewPreferences } = useContext(StoreContext);
    const [isFirstTokenBattleVisible, setIsFirstTokenBattleVisible] = useState<boolean>(false);
    const projectedAdditionalPoints = tokens.reduce((sum, token) => sum + (token.incrementalPoints || 0), 0);
    const finalProjectedPoints = currentPoints + projectedAdditionalPoints;

    const achievedMilestones = milestonesAndPoints.filter(milestone => currentPoints >= milestone.points);

    const missedMilestones = milestonesAndPoints
        .filter(milestone => milestone.points > finalProjectedPoints)
        .sort((a, b) => a.points - b.points);

    const firstToken = tokenDisplays.length > 0 ? tokenDisplays[0] : null;
    const isDarkMode = viewPreferences.theme === 'dark';

    return (
        <div className="flex flex-col gap-y-8 w-full">
            {firstToken && (
                <div className="w-full flex flex-col items-center gap-y-4">
                    <div>
                        <h3 className="text-lg font-bold">Next Token</h3>
                    </div>
                    <div className="justify-center w-full md:w-2/3 lg:w-1/2">
                        <LeTokenCard
                            token={firstToken}
                            index={0}
                            renderMode={LeTokenCardRenderMode.kStandalone}
                            renderMilestone={index => renderMilestone(index, isDarkMode)}
                            renderRestrictions={x =>
                                renderRestrictions(x, firstToken.track, firstToken.battleNumber, 35)
                            }
                            renderTeam={x => renderTeam(x, 30)}
                            isBattleVisible={isFirstTokenBattleVisible}
                            onToggleBattle={() => setIsFirstTokenBattleVisible(!isFirstTokenBattleVisible)}
                            onCompleteBattle={nextTokenCompleted}
                            isDarkMode={isDarkMode}
                        />
                        {isFirstTokenBattleVisible &&
                            LeBattleService.getBattleFromToken(firstToken, battles) !== undefined && (
                                <div className="w-full mt-4">
                                    <LeBattle
                                        battle={LeBattleService.getBattleFromToken(firstToken, battles)!}
                                        trackName={firstToken.track}
                                        isDarkMode={isDarkMode}
                                    />
                                </div>
                            )}
                        {isFirstTokenBattleVisible &&
                            LeBattleService.getBattleFromToken(firstToken, battles) === undefined && (
                                <div
                                    className={`w-full text-center ${isDarkMode ? 'text-gray-500 border-gray-700' : 'text-gray-600 border-gray-300'} p-4 border rounded-xl mt-4`}>
                                    Battle data not available.
                                </div>
                            )}
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-y-8">
                <SupportSection />
            </div>

            <div className="w-full flex flex-col items-center gap-y-4">
                <div>
                    <h3 className="text-lg font-bold">Milestones Already Achieved</h3>
                </div>
                <LeTokenMilestoneCardGrid
                    milestonesToList={achievedMilestones}
                    emptyMessage="No milestones achieved yet."
                />
            </div>

            <div key="tokens" className="flex flex-col gap-2 w-full">
                <LeTokenTable battles={battles} tokenDisplays={tokenDisplays} toggleBattleState={toggleBattleState} />
            </div>
            {missedMilestones.length > 0 && (
                <div className="w-full flex flex-col items-center gap-y-4 mt-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
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
