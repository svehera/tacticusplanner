import React, { JSX, useState } from 'react';

import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { RequirementStatus } from '@/fsd/3-features/lre';

import { LeTokenService } from './le-token-service';
import { LeTokenCardRenderMode } from './lre.models';
import { STATUS_COLORS, STATUS_LABELS } from './requirement-status-constants';
import { TokenDisplay } from './token-estimation-service';

interface CardProps {
    token: TokenDisplay;
    tokenUsedDuringEventIteration: number;
    index: number;
    renderMode: LeTokenCardRenderMode;
    renderRestrictions: (restricts: any[], track: string, battleNumber: number) => JSX.Element;
    renderTeam: (team: string[]) => JSX.Element;

    isBattleVisible: boolean;
    onToggleBattle: (index: number) => void;
    // If this is provided, show a complete battle button.
    onCompleteBattle: () => void;
    onMaybeBattle: () => void;
    onStopBattle: () => void;
    // Current progress points - used in standalone mode to show non-cumulative total
    currentPoints?: number;
}

const COMPLETE_DELAY_MILLIS: number = 500;

const TRACK_COLORS: string[] = [
    'border-blue-200 dark:border-blue-900',
    'border-green-200 dark:border-green-900',
    'border-yellow-200 dark:border-yellow-900',
    'border-red-200 dark:border-red-900',
];

export const LeTokenCard: React.FC<CardProps> = ({
    token,
    tokenUsedDuringEventIteration,
    index,
    renderMode,
    renderRestrictions,
    renderTeam,
    isBattleVisible,
    onToggleBattle,
    onCompleteBattle,
    onMaybeBattle,
    onStopBattle,
    currentPoints,
}: CardProps) => {
    const [isCompleting, setIsCompleting] = useState<boolean>(false);
    const hasMilestone = token.achievedStarMilestone;
    const widthClass = renderMode === LeTokenCardRenderMode.kInGrid ? '' : 'lg:w-full';

    // For standalone mode (Next Token card), show currentPoints + incrementalPoints
    // For grid mode (table view), show cumulative totalPoints
    const displayTotalPoints =
        renderMode === LeTokenCardRenderMode.kStandalone && currentPoints !== undefined
            ? currentPoints + token.incrementalPoints
            : token.totalPoints;

    // Use Tailwind dark: classes for theme handling
    const bgClass = hasMilestone ? 'bg-blue-50 dark:bg-gray-800/80' : 'bg-gray-100 dark:bg-gray-900';
    const borderClass = TRACK_COLORS[tokenUsedDuringEventIteration];

    const toggleText = isBattleVisible ? 'Hide Battle' : 'Show Battle';

    // 1. Define the dynamic opacity and pointer-events classes
    const opacityClass = isCompleting ? 'opacity-0 pointer-events-none' : 'opacity-100';

    return (
        <div
            className={`
                w-full ${widthClass} ${bgClass} rounded-xl border-[3px] ${borderClass} p-4 
                flex flex-col gap-3 shadow-lg relative overflow-hidden 
                transition-all ease-in-out
                ${opacityClass} 
            `}
            style={{ '--complete-delay': `${COMPLETE_DELAY_MILLIS}ms` } as React.CSSProperties}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-300 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-bold text-gray-800 bg-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-200">
                        #{index + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 uppercase dark:text-gray-300">
                        {token.track} - Battle {token.battleNumber + 1}
                    </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="text-right">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Total Points</div>
                        <div className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                            {displayTotalPoints}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-5">
                        {!LeTokenService.isAfterCutoff() && (
                            <div style={{ color: STATUS_COLORS[RequirementStatus.Cleared] }}>
                                <button
                                    onClick={() => {
                                        if (isCompleting) return;
                                        setIsCompleting(true);
                                        setTimeout(() => {
                                            setIsCompleting(false);
                                            onCompleteBattle();
                                        }, COMPLETE_DELAY_MILLIS);
                                    }}
                                    disabled={isCompleting}
                                    className="text-xs font-semibold uppercase transition-colors duration-500 disabled:opacity-50 focus:outline-none"
                                    title="Mark this token as successful.">
                                    {STATUS_LABELS[RequirementStatus.Cleared]}{' '}
                                </button>
                            </div>
                        )}
                        <div style={{ color: STATUS_COLORS[RequirementStatus.MaybeClear] }}>
                            <button
                                onClick={() => {
                                    if (isCompleting) return;
                                    setIsCompleting(true);
                                    setTimeout(() => {
                                        setIsCompleting(false);
                                        onMaybeBattle();
                                    }, COMPLETE_DELAY_MILLIS);
                                }}
                                disabled={isCompleting}
                                className="text-xs font-semibold uppercase transition-colors duration-500 disabled:opacity-50 focus:outline-none"
                                title="Potentially will not succeed with this token.">
                                {STATUS_LABELS[RequirementStatus.MaybeClear]}{' '}
                            </button>
                        </div>
                        <div style={{ color: STATUS_COLORS[RequirementStatus.StopHere] }}>
                            <button
                                onClick={() => {
                                    if (isCompleting) return;
                                    setIsCompleting(true);
                                    setTimeout(() => {
                                        setIsCompleting(false);
                                        onStopBattle();
                                    }, COMPLETE_DELAY_MILLIS);
                                }}
                                disabled={isCompleting}
                                className="text-xs font-semibold uppercase transition-colors duration-500 disabled:opacity-50 focus:outline-none"
                                title="Do not attempt this token.">
                                {STATUS_LABELS[RequirementStatus.StopHere]}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => onToggleBattle(index)}
                        className="text-xs font-semibold text-blue-600 uppercase transition-colors duration-150 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus:outline-none"
                        aria-expanded={isBattleVisible}
                        aria-controls={`battle-details-${index}`}>
                        {toggleText}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-4">
                <div className="flex flex-col items-center justify-start gap-2 min-w-[80px]">
                    {hasMilestone ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                            <StarsIcon stars={token.stars} />
                            <RarityIcon rarity={token.rarity} />
                        </div>
                    ) : (
                        <div className="h-[70px] w-[70px] rounded-lg border border-gray-300 dark:border-gray-800 bg-gray-200 dark:bg-gray-800/20 text-gray-500 dark:text-gray-600 flex items-center justify-center text-xs text-center p-1">
                            No Milestone
                        </div>
                    )}
                    <div className="mt-1 text-center">
                        <div className="text-[10px] uppercase text-gray-600 dark:text-gray-500">Incremental</div>
                        <div className="font-mono font-semibold text-green-600 dark:text-green-400">
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
