import React, { JSX } from 'react';

import { LeTokenCardRenderMode } from './lre.models';
import { milestonesAndPoints, TokenDisplay } from './token-estimation-service';

interface CardProps {
    token: TokenDisplay;
    index: number;
    renderMode: LeTokenCardRenderMode;
    renderMilestone: (milestoneIndex: number) => JSX.Element;
    renderRestrictions: (restricts: any[], track: string, battleNumber: number) => JSX.Element;
    renderTeam: (team: string[]) => JSX.Element;

    isBattleVisible: boolean;
    onToggleBattle: (index: number) => void;
    // If this is provided, show a complete battle button.
    onCompleteBattle?: () => void;
}

export const LeTokenCard: React.FC<CardProps> = ({
    token,
    index,
    renderMode,
    renderMilestone,
    renderRestrictions,
    renderTeam,
    isBattleVisible,
    onToggleBattle,
    onCompleteBattle,
}: CardProps) => {
    const hasMilestone =
        token.milestoneAchievedIndex !== -1 && token.milestoneAchievedIndex < milestonesAndPoints.length;
    const widthClass = renderMode === LeTokenCardRenderMode.kInGrid ? '' : 'lg:w-full';

    // Use Tailwind dark: classes for theme handling
    const bgClass = hasMilestone ? 'bg-blue-50 dark:bg-gray-800/80' : 'bg-gray-100 dark:bg-gray-900';
    const borderClass = hasMilestone
        ? 'border-blue-300 dark:border-blue-500/30'
        : 'border-gray-300 dark:border-gray-700/50';

    const toggleText = isBattleVisible ? 'Hide Battle' : 'Show Battle';

    return (
        <div
            className={`w-full ${widthClass} ${bgClass} rounded-xl border ${borderClass} p-4 flex flex-col gap-3 shadow-lg relative overflow-hidden transition-colors duration-200`}>
            <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                    <span className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold px-2 py-1 rounded-md">
                        #{index + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        {token.track} - Battle {token.battleNumber + 1}
                    </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="text-right">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Total Points</div>
                        <div className="font-bold font-mono text-blue-600 dark:text-blue-400 text-lg">
                            {token.totalPoints}
                        </div>
                    </div>

                    {onCompleteBattle && (
                        <button
                            onClick={() => onCompleteBattle()}
                            className="text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 text-xs font-semibold uppercase transition-colors duration-150 focus:outline-none"
                            title="Mark this battle as completed">
                            Mark Complete
                        </button>
                    )}
                    <button
                        onClick={() => onToggleBattle(index)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-xs font-semibold uppercase transition-colors duration-150 focus:outline-none"
                        aria-expanded={isBattleVisible}
                        aria-controls={`battle-details-${index}`}>
                        {toggleText}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-4">
                <div className="flex flex-col items-center justify-start gap-2 min-w-[80px]">
                    {hasMilestone ? (
                        <div className="transform scale-90 origin-top">
                            {renderMilestone(token.milestoneAchievedIndex)}
                        </div>
                    ) : (
                        <div className="h-[70px] w-[70px] rounded-lg border border-gray-300 dark:border-gray-800 bg-gray-200 dark:bg-gray-800/20 text-gray-500 dark:text-gray-600 flex items-center justify-center text-xs text-center p-1">
                            No Milestone
                        </div>
                    )}
                    <div className="text-center mt-1">
                        <div className="text-[10px] uppercase text-gray-600 dark:text-gray-500">Incremental</div>
                        <div className="font-mono text-green-600 dark:text-green-400 font-semibold">
                            +{token.incrementalPoints}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div>
                        <h4 className="text-[10px] font-semibold uppercase text-gray-600 dark:text-gray-500 mb-1">
                            Restrictions Cleared
                        </h4>
                        <div className="flex items-center">
                            {renderRestrictions(token.restricts, token.track, token.battleNumber)}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-semibold uppercase text-gray-600 dark:text-gray-500 mb-1">
                            Team Used
                        </h4>
                        <div className="flex flex-wrap gap-1">{renderTeam(token.team)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
